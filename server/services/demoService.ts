import { db } from '../database/db';
import { Bin, TelemetryRecord } from '../models/types';
import { calculateFillPercent, determineStatus } from '../validation/telemetryValidator';
import { sseService } from './sseService';
import { binService } from './binService';
import { config } from '../config';

export class DemoService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    if (config.demoMode) {
      this.startSimulation();
    }
  }

  public startSimulation(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[DEMO SIMULATOR] Started background simulator (Interval: ${config.demoUpdateIntervalMs}ms)`);
    this.timer = setInterval(() => {
      this.runSimulationStep().catch((err) => console.error('[DEMO SIM ERROR]:', err));
    }, config.demoUpdateIntervalMs);
  }

  public stopSimulation(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[DEMO SIMULATOR] Stopped background simulator');
  }

  public getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: config.demoUpdateIntervalMs,
    };
  }

  /**
   * Executes a single simulation evolution step.
   * STRICT GUARANTEE: Operates EXCLUSIVELY on data_source = 'DEMO'.
   * REAL bins are NEVER selected or modified.
   */
  public async runSimulationStep(): Promise<{ updatedCount: number; updatedBinIds: string[] }> {
    // 1. Fetch only DEMO bins
    const demoBins = await db.getAllBins({ dataSource: 'DEMO' });
    if (demoBins.length === 0) return { updatedCount: 0, updatedBinIds: [] };

    // Select a subset of demo bins to realistically evolve each tick (e.g. 5-8 bins)
    const countToUpdate = Math.min(8, demoBins.length);
    const shuffled = [...demoBins].sort(() => 0.5 - Math.random());
    const selectedBins = shuffled.slice(0, countToUpdate);

    const updatedIds: string[] = [];
    const nowIso = new Date().toISOString();

    for (const bin of selectedBins) {
      // ABSOLUTE SECURITY ASSERTION
      if (bin.data_source !== 'DEMO' || bin.bin_id.startsWith('BIN_00')) {
        console.error(`[CRITICAL SECURITY ALERT] Attempted to mutate REAL bin ${bin.bin_id} in demo simulator! Aborting.`);
        continue;
      }

      let newFill = bin.current_fill_percent;

      // Realistic evolution rule:
      if (newFill >= 96) {
        // Full bins that reached critical threshold simulate collection: 96% -> 15-20%
        newFill = 15 + Math.floor(Math.random() * 8);
      } else if (newFill >= 88) {
        // Approaching full: slow accumulation (+1% or +2%)
        newFill += 1 + Math.floor(Math.random() * 2);
      } else {
        // Normal waste accumulation: +3% to +6%
        newFill += 3 + Math.floor(Math.random() * 4);
      }

      if (newFill > 100) newFill = 100;

      // Calculate distance based on canonical physics
      const newDistance = Number((30.0 - (newFill / 100.0) * 25.0).toFixed(1));
      const newStatus = determineStatus(newFill);

      // Update in database
      const updated = await db.updateBin(bin.bin_id, {
        current_fill_percent: newFill,
        current_distance_cm: newDistance,
        current_status: newStatus,
        online: true,
        last_seen: nowIso,
      });

      if (updated) {
        updatedIds.push(bin.bin_id);

        // Record historical telemetry
        const telRecord: TelemetryRecord = {
          id: `TEL_${bin.bin_id}_${Date.now()}`,
          bin_id: bin.bin_id,
          distance_cm: newDistance,
          fill_percent: newFill,
          status: newStatus,
          data_source: 'DEMO',
          recorded_at: nowIso,
        };
        await db.insertTelemetry(telRecord);

        // Notify subscribers
        sseService.broadcast('bin_updated', {
          bin: {
            ...updated,
            connection_state: 'ONLINE',
          },
          telemetry: telRecord,
        });
      }
    }

    sseService.broadcast('demo_step', {
      timestamp: nowIso,
      updatedCount: updatedIds.length,
      updatedBinIds: updatedIds,
    });

    return { updatedCount: updatedIds.length, updatedBinIds: updatedIds };
  }

  /**
   * Simulates municipal collection for a specific demo bin
   */
  public async simulateCollection(bin_id: string): Promise<Bin | null> {
    const bin = await db.getBinById(bin_id);
    if (!bin) return null;

    if (bin.data_source === 'REAL') {
      throw new Error('Demo collection cannot be triggered on REAL physical hardware. Hardware must report true empty state.');
    }

    const clearedFill = 12 + Math.floor(Math.random() * 6);
    const clearedDistance = Number((30.0 - (clearedFill / 100.0) * 25.0).toFixed(1));
    const clearedStatus = determineStatus(clearedFill);
    const nowIso = new Date().toISOString();

    const updated = await db.updateBin(bin_id, {
      current_fill_percent: clearedFill,
      current_distance_cm: clearedDistance,
      current_status: clearedStatus,
      online: true,
      last_seen: nowIso,
    });

    if (updated) {
      await db.resolveAlertsForBin(bin_id, ['FULL', 'HIGH']);
      sseService.broadcast('bin_updated', {
        bin: { ...updated, connection_state: 'ONLINE' },
      });
    }

    return updated;
  }
}

export const demoService = new DemoService();
