import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dustbin,
  Ward,
  CitizenReport,
  Task,
  Worker,
  Supervisor,
  UserRole,
  SensorReading,
  TaskStatus,
} from '../types';
import {
  INITIAL_WARDS,
  INITIAL_DUSTBINS,
  INITIAL_REPORTS,
  INITIAL_TASKS,
  INITIAL_WORKERS,
  INITIAL_SUPERVISORS,
} from '../data/mockData';
import { getStatusFromFill } from '../config/thresholds';
import { evaluatePriority } from '../utils/priorityEngine';
import { telemetryBridge, getActiveIoTSource } from '../services/iotDataSource';
import { formatTimestamp } from '../utils/formatters';
import { api } from '../services/api';

interface WasteSystemContextType {
  dustbins: Dustbin[];
  wards: Ward[];
  reports: CitizenReport[];
  tasks: Task[];
  workers: Worker[];
  supervisors: Supervisor[];
  currentRole: UserRole;
  selectedWardId: string | null;
  selectedDustbinId: string | null;
  hardwareMode: 'DEMO' | 'LIVE';
  espConnectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastTelemetryTimestamp: string;

  // Actions
  setCurrentRole: (role: UserRole) => void;
  setSelectedWardId: (id: string | null) => void;
  setSelectedDustbinId: (id: string | null) => void;
  setHardwareMode: (mode: 'DEMO' | 'LIVE') => void;
  setEspConnectionStatus: (status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING') => void;

  // Telemetry
  pushTelemetry: (reading: Partial<SensorReading> & { dustbinId: string }) => void;
  triggerDemoStepSequence: () => void;

  // Citizen Actions
  submitCitizenReport: (report: {
    dustbinId?: string;
    ward: string;
    area: string;
    issue: CitizenReport['issue'];
    description: string;
    photoUrl: string;
    coordinates?: [number, number];
  }) => CitizenReport;

  // Worker Actions
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  completeTaskWithProof: (taskId: string, proofPhoto: string, afterFillPercentage: number) => void;

  // Supervisor Actions
  verifyTask: (taskId: string, approved: boolean) => void;

  // Navigation helpers
  getDustbinById: (id: string) => Dustbin | undefined;
  getWardById: (id: string) => Ward | undefined;
  getTaskById: (id: string) => Task | undefined;
}

const WasteSystemContext = createContext<WasteSystemContextType | undefined>(undefined);

export const WasteSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dustbins, setDustbins] = useState<Dustbin[]>(INITIAL_DUSTBINS);
  const [wards, setWards] = useState<Ward[]>(INITIAL_WARDS);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_REPORTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [supervisors] = useState<Supervisor[]>(INITIAL_SUPERVISORS);

  const [currentRole, setCurrentRole] = useState<UserRole>('AUTHORITY');
  const [selectedWardId, setSelectedWardId] = useState<string | null>('W-05');
  const [selectedDustbinId, setSelectedDustbinId] = useState<string | null>('D-104');
  const [hardwareMode, setHardwareModeState] = useState<'DEMO' | 'LIVE'>('DEMO');
  const [espConnectionStatus, setEspConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTED');
  const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState<string>('12:42:18');

  // Push telemetry and dynamically update dustbin, wards, and priority
  const pushTelemetry = useCallback((reading: Partial<SensorReading> & { dustbinId: string }) => {
    const timestampStr = reading.timestamp ? formatTimestamp(reading.timestamp) : formatTimestamp();
    setLastTelemetryTimestamp(timestampStr);

    setDustbins((prevBins) =>
      prevBins.map((bin) => {
        if (bin.id !== reading.dustbinId) return bin;

        const newFill = reading.fillPercentage !== undefined ? reading.fillPercentage : bin.fillPercentage;
        const newDistance = reading.distance !== undefined
          ? reading.distance
          : Number(((100 - newFill) * (bin.height / 100)).toFixed(1));
        const newMoisture = reading.moisture !== undefined ? reading.moisture : bin.moisture;
        const newStatus = getStatusFromFill(newFill);

        const newHistoryPoint = {
          timestamp: timestampStr,
          fillPercentage: newFill,
          distance: newDistance,
          moisture: newMoisture,
        };

        const updatedHistory = [...bin.history.slice(-14), newHistoryPoint];

        return {
          ...bin,
          fillPercentage: newFill,
          distance: newDistance,
          moisture: newMoisture,
          status: newStatus,
          lastUpdated: timestampStr,
          espConnection: 'CONNECTED',
          history: updatedHistory,
        };
      })
    );
  }, []);

  // Listen to telemetry bus
  useEffect(() => {
    const unsubscribe = telemetryBridge.subscribe((reading) => {
      pushTelemetry(reading);
    });
    return () => unsubscribe();
  }, [pushTelemetry]);

  // Recalculate ward stats whenever dustbins, reports, or tasks change
  useEffect(() => {
    setWards((prevWards) =>
      prevWards.map((w) => {
        const wardBins = dustbins.filter((b) => b.wardId === w.id || b.ward === w.name);
        const criticalCount = wardBins.filter((b) => b.status === 'CRITICAL').length;
        const highCount = wardBins.filter((b) => b.status === 'HIGH').length;
        const wardReports = reports.filter((r) => r.ward === w.name && r.status !== 'RESOLVED');
        const wardTasks = tasks.filter((t) => t.ward === w.name && t.status !== 'VERIFIED');
        const completedTasks = tasks.filter((t) => t.ward === w.name && t.status === 'VERIFIED');

        let pressure = w.wastePressure;
        if (criticalCount >= 3 || wardReports.length >= 5) {
          pressure = 'CRITICAL';
        } else if (criticalCount > 0 || highCount >= 2 || wardReports.length >= 3) {
          pressure = 'HIGH';
        } else if (highCount > 0 || wardReports.length > 0) {
          pressure = 'MODERATE';
        } else {
          pressure = 'NORMAL';
        }

        return {
          ...w,
          criticalBins: criticalCount,
          highPriority: highCount,
          openReports: wardReports.length,
          pendingTasks: wardTasks.length,
          completedToday: 15 + completedTasks.length,
          wastePressure: pressure,
        };
      })
    );
  }, [dustbins, reports, tasks]);

  const setHardwareMode = useCallback((mode: 'DEMO' | 'LIVE') => {
    setHardwareModeState(mode);
    getActiveIoTSource().setMode(mode);
  }, []);

  // Demonstration Sequence: 72% -> 79% -> 86% -> 91%
  const triggerDemoStepSequence = useCallback(() => {
    const sequence = [
      { fill: 72, dist: 28.0, moist: 45, delay: 0 },
      { fill: 79, dist: 21.0, moist: 52, delay: 2000 },
      { fill: 86, dist: 14.0, moist: 60, delay: 4200 },
      { fill: 91, dist: 8.4, moist: 67, delay: 6500 },
    ];

    sequence.forEach(({ fill, dist, moist, delay }) => {
      setTimeout(() => {
        telemetryBridge.broadcast({
          dustbinId: 'D-104',
          fillPercentage: fill,
          distance: dist,
          moisture: moist,
          timestamp: new Date().toISOString(),
        });
      }, delay);
    });
  }, []);

  // Submit Citizen Report with duplicate check simulation
  const submitCitizenReport = useCallback(
    (input: {
      dustbinId?: string;
      ward: string;
      area: string;
      issue: CitizenReport['issue'];
      description: string;
      photoUrl: string;
      coordinates?: [number, number];
    }): CitizenReport => {
      const id = `#R-${Math.floor(1043 + Math.random() * 900)}`;
      const timestamp = formatTimestamp();
      const coords: [number, number] = input.coordinates || [18.5204, 73.8567];

      // Lightweight duplicate detection simulation:
      // If there's already an active report for this dustbin in under 30 minutes
      const existingReport = reports.find(
        (r) => r.dustbinId === input.dustbinId && r.status !== 'RESOLVED'
      );

      const isDuplicate = Boolean(existingReport);

      // Evaluate priority
      const bin = dustbins.find((b) => b.id === input.dustbinId);
      const evalResult = evaluatePriority({
        fillPercentage: bin ? bin.fillPercentage : 75,
        reportCount: isDuplicate ? 3 : 1,
        unresolvedMinutes: 15,
        areaSeverity: 'HIGH',
      });

      const newReport: CitizenReport = {
        id,
        dustbinId: input.dustbinId,
        ward: input.ward,
        area: input.area,
        issue: input.issue,
        description: input.description,
        photoUrl: input.photoUrl,
        coordinates: coords,
        timestamp,
        status: isDuplicate ? 'DUPLICATE' : 'UNDER REVIEW',
        priority: evalResult.level,
        priorityScore: evalResult.score,
        isDuplicate,
        duplicateNotice: isDuplicate
          ? 'Possible duplicate: A similar report was submitted within 120 metres in the same reporting window.'
          : undefined,
      };

      setReports((prev) => [newReport, ...prev]);

      // If priority is high/critical and no active task exists for this bin, auto-assign or flag task
      if (!isDuplicate && (evalResult.level === 'CRITICAL' || evalResult.level === 'HIGH') && input.dustbinId) {
        const hasTask = tasks.some(
          (t) => t.dustbinId === input.dustbinId && t.status !== 'VERIFIED'
        );
        if (!hasTask) {
          const newTask: Task = {
            id: `TASK #${Math.floor(1043 + Math.random() * 500)}`,
            dustbinId: input.dustbinId,
            ward: input.ward,
            area: input.area,
            assignedToWorkerId: 'WKR-01',
            workerName: 'Rahul Patil',
            assignedAt: timestamp,
            deadline: 'Within 45 min',
            status: 'ASSIGNED',
            priority: evalResult.level,
            beforeFill: bin?.fillPercentage ?? 90,
            notes: `Auto-generated from citizen report ${id}: ${input.issue}`,
          };
          setTasks((prev) => [newTask, ...prev]);
        }
      }

      // Background sync to backend server
      api.createReport({
        citizen_name: 'Concerned Citizen',
        ward: input.ward,
        area: input.area,
        issue: input.issue,
        description: input.description,
        photo_url: input.photoUrl,
        bin_id: input.dustbinId,
        latitude: coords[0],
        longitude: coords[1],
      }).catch((e) => console.warn('[SYNC ERROR] createReport:', e));

      return newReport;
    },
    [dustbins, reports, tasks]
  );

  // Update Task Status state machine
  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    api.updateTaskStatus(taskId, newStatus).catch((e) => console.warn('[SYNC ERROR] updateTaskStatus:', e));
  }, []);

  // Complete Task with Proof
  const completeTaskWithProof = useCallback(
    (taskId: string, proofPhoto: string, afterFillPercentage: number) => {
      const now = formatTimestamp();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: 'COMPLETED',
            afterFill: afterFillPercentage,
            proof: {
              completionPhoto: proofPhoto,
              location: [18.5204, 73.8567],
              timestamp: now,
              beforeFill: t.beforeFill,
              afterFill: afterFillPercentage,
            },
            notes: `${t.notes || ''} | Completed by worker. Awaiting supervisor approval.`,
          };
        })
      );
      api.completeTask(taskId, {
        completion_photo: proofPhoto,
        after_fill_percent: afterFillPercentage,
      }).catch((e) => console.warn('[SYNC ERROR] completeTask:', e));
    },
    []
  );

  // Supervisor Verification
  const verifyTask = useCallback(
    (taskId: string, approved: boolean) => {
      api.verifyTask(taskId, {
        approved,
        supervisor_id: 'SUP_001',
      }).catch((e) => console.warn('[SYNC ERROR] verifyTask:', e));

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (approved) {
            // Lower dustbin fill when verified!
            if (t.dustbinId) {
              const clearedFill = t.afterFill ?? 15;
              telemetryBridge.broadcast({
                dustbinId: t.dustbinId,
                fillPercentage: clearedFill,
                distance: Number(((100 - clearedFill) * 0.9).toFixed(1)),
                moisture: 20,
                timestamp: new Date().toISOString(),
              });
            }
            return {
              ...t,
              status: 'VERIFIED',
              notes: `${t.notes || ''} | Supervisor verified & approved at ${formatTimestamp()}.`,
            };
          } else {
            return {
              ...t,
              status: 'IN PROGRESS',
              notes: `${t.notes || ''} | Supervisor requested re-clearance.`,
            };
          }
        })
      );

      // Increment completed count for worker
      const task = tasks.find((t) => t.id === taskId);
      if (task && approved) {
        setWorkers((prev) =>
          prev.map((w) =>
            w.id === task.assignedToWorkerId
              ? { ...w, tasksCompletedToday: (w.tasksCompletedToday || 0) + 1, activeTaskId: undefined }
              : w
          )
        );

        // Also mark linked reports as resolved
        setReports((prev) =>
          prev.map((r) =>
            r.dustbinId === task.dustbinId && r.status !== 'RESOLVED'
              ? { ...r, status: 'RESOLVED' }
              : r
          )
        );
      }
    },
    [tasks]
  );

  const getDustbinById = useCallback(
    (id: string) => dustbins.find((d) => d.id === id),
    [dustbins]
  );

  const getWardById = useCallback(
    (id: string) => wards.find((w) => w.id === id || w.name === id),
    [wards]
  );

  const getTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks]
  );

  const value = useMemo(
    () => ({
      dustbins,
      wards,
      reports,
      tasks,
      workers,
      supervisors,
      currentRole,
      selectedWardId,
      selectedDustbinId,
      hardwareMode,
      espConnectionStatus,
      lastTelemetryTimestamp,
      setCurrentRole,
      setSelectedWardId,
      setSelectedDustbinId,
      setHardwareMode,
      setEspConnectionStatus,
      pushTelemetry,
      triggerDemoStepSequence,
      submitCitizenReport,
      updateTaskStatus,
      completeTaskWithProof,
      verifyTask,
      getDustbinById,
      getWardById,
      getTaskById,
    }),
    [
      dustbins,
      wards,
      reports,
      tasks,
      workers,
      supervisors,
      currentRole,
      selectedWardId,
      selectedDustbinId,
      hardwareMode,
      espConnectionStatus,
      lastTelemetryTimestamp,
      setHardwareMode,
      pushTelemetry,
      triggerDemoStepSequence,
      submitCitizenReport,
      updateTaskStatus,
      completeTaskWithProof,
      verifyTask,
      getDustbinById,
      getWardById,
      getTaskById,
    ]
  );

  return <WasteSystemContext.Provider value={value}>{children}</WasteSystemContext.Provider>;
};

export function useWasteSystem(): WasteSystemContextType {
  const context = useContext(WasteSystemContext);
  if (!context) {
    throw new Error('useWasteSystem must be used within a WasteSystemProvider');
  }
  return context;
}
