import { db } from '../database/db';
import { Bin, TelemetryRecord, Alert, BinStatus, ConnectionState, DataSource, CollectionTask } from '../models/types';
import { validateTelemetryPayload, ValidatedTelemetry } from '../validation/telemetryValidator';
import { sseService } from './sseService';
import { config } from '../config';

export class BinService {
  /**
   * Evaluates offline/warning/online state based on last_seen timestamp
   */
  public evaluateConnectionState(lastSeenIso: string): ConnectionState {
    const lastSeenTime = new Date(lastSeenIso).getTime();
    const elapsedMinutes = (Date.now() - lastSeenTime) / 60000;

    if (elapsedMinutes < config.onlineThresholdMinutes) {
      return 'ONLINE';
    } else if (elapsedMinutes <= config.warningThresholdMinutes) {
      return 'WARNING';
    } else {
      return 'OFFLINE';
    }
  }

  /**
   * Core telemetry processor:
   * Enforces Section 7: When BIN_001 sends telemetry, ONLY BIN_001 is updated.
   */
  public async processTelemetry(payload: any): Promise<{ success: boolean; bin?: Bin; error?: string }> {
    const validation = validateTelemetryPayload(payload);
    if (!validation.isValid || !validation.data) {
      return { success: false, error: validation.error || 'Invalid telemetry data' };
    }

    const { bin_id, distance_cm, fill_percent, status } = validation.data;

    // Check if bin exists
    const existingBin = await db.getBinById(bin_id);
    if (!existingBin) {
      return { success: false, error: `Device identity "${bin_id}" not recognized` };
    }

    const nowIso = new Date().toISOString();

    // 1. Update ONLY THIS SPECIFIC BIN
    const updatedBin = await db.updateBin(bin_id, {
      current_distance_cm: distance_cm,
      current_fill_percent: fill_percent,
      current_status: status,
      online: true,
      last_seen: nowIso,
    });

    if (!updatedBin) {
      return { success: false, error: 'Failed to update dustbin record' };
    }

    // 2. Append historical telemetry record
    const telemetryRecord: TelemetryRecord = {
      id: `TEL_${bin_id}_${Date.now()}`,
      bin_id,
      distance_cm,
      fill_percent,
      status,
      data_source: existingBin.data_source,
      recorded_at: nowIso,
    };
    await db.insertTelemetry(telemetryRecord);

    // 3. Evaluate operational alerts
    await this.evaluateAlertsForBin(updatedBin);

    // 4. Broadcast live update to all connected dashboard clients
    sseService.broadcast('bin_updated', {
      bin: {
        ...updatedBin,
        connection_state: 'ONLINE',
      },
      telemetry: telemetryRecord,
    });

    return { success: true, bin: updatedBin };
  }

  /**
   * Alert evaluation logic:
   * FULL >= 90% (CRITICAL)
   * HIGH 80-89% (WARNING)
   * Resolves alerts when fill drops below threshold
   */
  private async evaluateAlertsForBin(bin: Bin): Promise<void> {
    const activeAlerts = await db.getAlerts({ resolved: false });
    const existingFull = activeAlerts.find((a) => a.bin_id === bin.bin_id && a.alert_type === 'FULL');
    const existingHigh = activeAlerts.find((a) => a.bin_id === bin.bin_id && a.alert_type === 'HIGH');

    const prefix = bin.data_source === 'REAL' ? '🔴 [REAL HARDWARE]' : '🔴';
    const warnPrefix = bin.data_source === 'REAL' ? '⚠️ [REAL HARDWARE]' : '⚠️';

    if (bin.current_fill_percent >= 90) {
      // Resolve any existing HIGH alert since it is now FULL
      if (existingHigh) {
        await db.resolveAlert(existingHigh.id);
      }

      if (!existingFull) {
        const newAlert: Alert = {
          id: `ALT_${bin.bin_id}_${Date.now()}`,
          bin_id: bin.bin_id,
          alert_type: 'FULL',
          severity: 'CRITICAL',
          message: `${prefix} ${bin.bin_id} (${bin.name}) at ${bin.current_fill_percent}% - Immediate Collection Required`,
          fill_percent: bin.current_fill_percent,
          resolved: false,
          data_source: bin.data_source,
          created_at: new Date().toISOString(),
        };
        await db.insertAlert(newAlert);
        sseService.broadcast('alert_created', newAlert);
      }

      // Auto-dispatch collection task if no active task exists for this full bin
      const activeTask = await db.getActiveTaskForBin(bin.bin_id);
      if (!activeTask) {
        const availableWorkers = await db.getAllWorkers({ ward: bin.ward, status: 'ON_DUTY' });
        const allWorkers = await db.getAllWorkers();
        const assignedWorker = availableWorkers[0] || allWorkers[0];

        const newTask: CollectionTask = {
          id: `TSK_${bin.bin_id}_${Date.now().toString().slice(-6)}`,
          bin_id: bin.bin_id,
          task_type: 'BIN_CLEARANCE',
          title: `Emergency Clearance: ${bin.bin_id} (${bin.name}) at ${bin.current_fill_percent}%`,
          ward: bin.ward,
          location: bin.location,
          priority: 'CRITICAL',
          assigned_worker_id: assignedWorker ? assignedWorker.id : 'WRK_001',
          assigned_worker_name: assignedWorker ? assignedWorker.name : 'Municipal Field Staff',
          status: 'ASSIGNED',
          before_fill_percent: bin.current_fill_percent,
          deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        };

        await db.insertTask(newTask);
        if (assignedWorker) {
          await db.updateWorker(assignedWorker.id, {
            status: 'BUSY',
            active_task_id: newTask.id,
          });
        }
        sseService.broadcast('task_created', newTask);
      }
    } else if (bin.current_fill_percent >= 80) {
      // If was FULL, resolve it
      if (existingFull) {
        await db.resolveAlert(existingFull.id);
      }

      if (!existingHigh) {
        const newAlert: Alert = {
          id: `ALT_${bin.bin_id}_${Date.now()}`,
          bin_id: bin.bin_id,
          alert_type: 'HIGH',
          severity: 'WARNING',
          message: `${warnPrefix} ${bin.bin_id} (${bin.name}) at ${bin.current_fill_percent}% - Approaching Full Capacity`,
          fill_percent: bin.current_fill_percent,
          resolved: false,
          data_source: bin.data_source,
          created_at: new Date().toISOString(),
        };
        await db.insertAlert(newAlert);
        sseService.broadcast('alert_created', newAlert);
      }
    } else {
      // Under 80%: Resolve any active FULL or HIGH alerts for this bin
      if (existingFull) {
        await db.resolveAlert(existingFull.id);
        sseService.broadcast('alert_resolved', { id: existingFull.id, bin_id: bin.bin_id });
      }
      if (existingHigh) {
        await db.resolveAlert(existingHigh.id);
        sseService.broadcast('alert_resolved', { id: existingHigh.id, bin_id: bin.bin_id });
      }
    }
  }

  /**
   * Returns list of bins enriched with real-time connection state
   */
  public async getEnrichedBins(filters?: any): Promise<Bin[]> {
    const bins = await db.getAllBins(filters);
    return bins.map((bin) => ({
      ...bin,
      connection_state: this.evaluateConnectionState(bin.last_seen),
    }));
  }

  /**
   * Collection priority dispatch list:
   * Sorted: FULL first, then HIGH, then MEDIUM, then LOW.
   * Within each category: highest fill first.
   */
  public async getCollectionPriorityList(): Promise<Bin[]> {
    const bins = await this.getEnrichedBins();
    const statusWeight: Record<BinStatus, number> = {
      FULL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return bins.sort((a, b) => {
      const weightA = statusWeight[a.current_status];
      const weightB = statusWeight[b.current_status];
      if (weightA !== weightB) {
        return weightB - weightA; // higher priority status first
      }
      // If same status, sort by current_fill_percent descending
      return b.current_fill_percent - a.current_fill_percent;
    });
  }
}

export const binService = new BinService();
