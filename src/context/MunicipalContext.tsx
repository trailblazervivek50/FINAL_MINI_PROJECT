import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Bin,
  Alert,
  AnalyticsSummary,
  TelemetryRecord,
  DataSource,
  BinStatus,
  CitizenReport,
  CollectionTask,
  Worker,
  Supervisor,
  UserRole,
} from '../types';
import { api } from '../services/api';

interface MunicipalContextType {
  bins: Bin[];
  realBins: Bin[];
  demoBins: Bin[];
  alerts: Alert[];
  analytics: AnalyticsSummary | null;
  priorityQueue: Bin[];
  reports: CitizenReport[];
  tasks: CollectionTask[];
  workers: Worker[];
  supervisors: Supervisor[];
  currentRole: UserRole;
  currentWorkerId: string;
  currentSupervisorId: string;
  selectedBinId: string | null;
  selectedBin: Bin | null;
  selectedBinHistory: TelemetryRecord[];
  isLiveConnected: boolean;
  isLoading: boolean;
  dataSourceFilter: 'REAL' | 'DEMO' | 'ALL';
  statusFilter: string;
  searchQuery: string;
  lastUpdateTimestamp: string;
  demoRunning: boolean;

  // Actions
  setCurrentRole: (role: UserRole) => void;
  setCurrentWorkerId: (id: string) => void;
  setCurrentSupervisorId: (id: string) => void;
  setSelectedBinId: (id: string | null) => void;
  setDataSourceFilter: (filter: 'REAL' | 'DEMO' | 'ALL') => void;
  setStatusFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  refreshData: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  simulateCollection: (id: string) => Promise<void>;
  triggerDemoStep: () => Promise<void>;
  toggleDemoSimulation: (enabled: boolean) => Promise<void>;
  injectHardwareTelemetry: (data: {
    bin_id: string;
    distance_cm: number;
    fill_percent?: number;
    apiKey?: string;
  }) => Promise<any>;

  // Citizen & Task Actions
  submitCitizenReport: (data: any) => Promise<CitizenReport | null>;
  updateReportStatus: (id: string, updates: any) => Promise<CitizenReport | null>;
  createCollectionTask: (data: any) => Promise<CollectionTask | null>;
  updateTaskStatus: (id: string, status: string) => Promise<CollectionTask | null>;
  completeTaskWithProof: (
    id: string,
    proof: { completion_photo?: string; after_fill_percent?: number; notes?: string }
  ) => Promise<CollectionTask | null>;
  verifyTask: (
    id: string,
    verification: { approved: boolean; supervisor_id?: string; notes?: string }
  ) => Promise<CollectionTask | null>;
  createBin: (binData: any) => Promise<Bin | null>;
  updateBin: (id: string, updates: any) => Promise<Bin | null>;
}

const MunicipalContext = createContext<MunicipalContextType | undefined>(undefined);

export const MunicipalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [priorityQueue, setPriorityQueue] = useState<Bin[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Roles & Profiles
  const [currentRole, setCurrentRole] = useState<UserRole>('AUTHORITY');
  const [currentWorkerId, setCurrentWorkerId] = useState<string>('WRK_001');
  const [currentSupervisorId, setCurrentSupervisorId] = useState<string>('SUP_001');

  const [selectedBinId, setSelectedBinId] = useState<string | null>('BIN_001');
  const [selectedBinHistory, setSelectedBinHistory] = useState<TelemetryRecord[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSourceFilter, setDataSourceFilter] = useState<'REAL' | 'DEMO' | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>(new Date().toLocaleTimeString());
  const [demoRunning, setDemoRunning] = useState<boolean>(true);

  // Compute filtered subsets
  const realBins = useMemo(() => bins.filter((b) => b.data_source === 'REAL'), [bins]);
  const demoBins = useMemo(() => bins.filter((b) => b.data_source === 'DEMO'), [bins]);

  const selectedBin = useMemo(
    () => bins.find((b) => b.bin_id === selectedBinId) || null,
    [bins, selectedBinId]
  );

  // Core Data Fetcher
  const refreshData = useCallback(async () => {
    try {
      const [
        fetchedBins,
        fetchedAlerts,
        fetchedAnalytics,
        fetchedPriority,
        fetchedReports,
        fetchedTasks,
        fetchedWorkers,
        fetchedSupervisors,
      ] = await Promise.all([
        api.getBins(),
        api.getAlerts(false),
        api.getAnalyticsSummary(),
        api.getPriorityQueue(),
        api.getReports(),
        api.getTasks(),
        api.getWorkers(),
        api.getSupervisors(),
      ]);

      if (fetchedBins.length > 0) setBins(fetchedBins);
      setAlerts(fetchedAlerts);
      if (fetchedAnalytics) setAnalytics(fetchedAnalytics);
      if (fetchedPriority) setPriorityQueue(fetchedPriority);
      setReports(fetchedReports);
      setTasks(fetchedTasks);
      setWorkers(fetchedWorkers);
      setSupervisors(fetchedSupervisors);
      setLastUpdateTimestamp(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('[CONTEXT] Error refreshing municipal data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch history when selectedBinId changes
  useEffect(() => {
    if (!selectedBinId) {
      setSelectedBinHistory([]);
      return;
    }

    let isMounted = true;
    api.getBinHistory(selectedBinId, 24).then((history) => {
      if (isMounted) setSelectedBinHistory(history);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedBinId]);

  const selectedBinIdRef = useRef<string | null>(selectedBinId);
  useEffect(() => {
    selectedBinIdRef.current = selectedBinId;
  }, [selectedBinId]);

  // Handle single bin update (Section 7: ONLY specified bin updates!)
  const handleBinUpdate = useCallback((updatedBin: Bin, telemetry?: TelemetryRecord) => {
    setLastUpdateTimestamp(new Date().toLocaleTimeString());

    // 1. Update bin in master array (or append if newly introduced)
    setBins((prev) => {
      const exists = prev.some((b) => b.bin_id === updatedBin.bin_id);
      if (!exists) {
        return [updatedBin, ...prev];
      }
      return prev.map((b) => (b.bin_id === updatedBin.bin_id ? { ...b, ...updatedBin } : b));
    });

    // 2. If this is the currently selected bin, update its history series
    if (telemetry && updatedBin.bin_id === selectedBinIdRef.current) {
      setSelectedBinHistory((prev) => [...prev.slice(-23), telemetry]);
    }

    // 3. Update priority queue re-sorting
    setPriorityQueue((prev) => {
      const updated = prev.map((b) => (b.bin_id === updatedBin.bin_id ? updatedBin : b));
      const statusWeight: Record<BinStatus, number> = { FULL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return updated.sort((a, b) => {
        const diff = statusWeight[b.current_status] - statusWeight[a.current_status];
        if (diff !== 0) return diff;
        return b.current_fill_percent - a.current_fill_percent;
      });
    });
  }, []);

  // Connect Real-time SSE on mount with polling fallback
  useEffect(() => {
    refreshData();

    const disconnectSSE = api.connectSSE({
      onConnectionChange: (connected) => {
        setIsLiveConnected(connected);
      },
      onBinUpdated: (bin, tel) => {
        handleBinUpdate(bin, tel);
      },
      onBinCreated: (bin) => {
        setBins((prev) => (prev.some((b) => b.bin_id === bin.bin_id) ? prev : [bin, ...prev]));
      },
      onAlertCreated: (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      },
      onAlertResolved: ({ id, bin_id }) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id && (!bin_id || a.bin_id !== bin_id)));
      },
      onReportCreated: (newReport) => {
        setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
      },
      onReportUpdated: (upReport) => {
        setReports((prev) => prev.map((r) => (r.id === upReport.id ? upReport : r)));
      },
      onTaskCreated: (newTask) => {
        setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
      },
      onTaskUpdated: (upTask) => {
        setTasks((prev) => prev.map((t) => (t.id === upTask.id ? upTask : t)));
      },
      onTaskCompleted: (compTask) => {
        setTasks((prev) => prev.map((t) => (t.id === compTask.id ? compTask : t)));
        // Refresh workers & bins to reflect freed worker and lowered fill
        refreshData();
      },
      onTaskVerified: (verTask) => {
        setTasks((prev) => prev.map((t) => (t.id === verTask.id ? verTask : t)));
      },
      onDemoStep: () => {
        setLastUpdateTimestamp(new Date().toLocaleTimeString());
      },
    });

    // 15-second background polling fallback
    const pollInterval = setInterval(() => {
      refreshData();
    }, 15000);

    return () => {
      disconnectSSE();
      clearInterval(pollInterval);
    };
  }, [refreshData, handleBinUpdate]);

  // Alert resolution action
  const resolveAlert = useCallback(async (id: string) => {
    await api.resolveAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Simulate collection
  const simulateCollection = useCallback(async (id: string) => {
    await api.simulateCollection(id);
    await refreshData();
  }, [refreshData]);

  // Step demo
  const triggerDemoStep = useCallback(async () => {
    await api.triggerDemoStep();
    await refreshData();
  }, [refreshData]);

  // Toggle demo simulation
  const toggleDemoSimulation = useCallback(async (enabled: boolean) => {
    setDemoRunning(enabled);
    await api.toggleDemoSimulation(enabled);
  }, []);

  // Inject hardware telemetry
  const injectHardwareTelemetry = useCallback(async (data: {
    bin_id: string;
    distance_cm: number;
    fill_percent?: number;
    apiKey?: string;
  }) => {
    const res = await api.injectTelemetry(data);
    if (res?.success && res.data) {
      handleBinUpdate(res.data);
    }
    return res;
  }, [handleBinUpdate]);

  // Citizen & Task Actions
  const submitCitizenReport = useCallback(async (data: any) => {
    const res = await api.createReport(data);
    if (res) {
      setReports((prev) => [res, ...prev]);
    }
    return res;
  }, []);

  const updateReportStatus = useCallback(async (id: string, updates: any) => {
    const res = await api.updateReportStatus(id, updates);
    if (res) {
      setReports((prev) => prev.map((r) => (r.id === id ? res : r)));
    }
    return res;
  }, []);

  const createCollectionTask = useCallback(async (data: any) => {
    const res = await api.createTask(data);
    if (res) {
      setTasks((prev) => [res, ...prev]);
    }
    return res;
  }, []);

  const updateTaskStatus = useCallback(async (id: string, status: string) => {
    const res = await api.updateTaskStatus(id, status);
    if (res) {
      setTasks((prev) => prev.map((t) => (t.id === id ? res : t)));
    }
    return res;
  }, []);

  const completeTaskWithProof = useCallback(async (
    id: string,
    proof: { completion_photo?: string; after_fill_percent?: number; notes?: string }
  ) => {
    const res = await api.completeTask(id, proof);
    if (res) {
      setTasks((prev) => prev.map((t) => (t.id === id ? res : t)));
      await refreshData();
    }
    return res;
  }, [refreshData]);

  const verifyTask = useCallback(async (
    id: string,
    verification: { approved: boolean; supervisor_id?: string; notes?: string }
  ) => {
    const res = await api.verifyTask(id, verification);
    if (res) {
      setTasks((prev) => prev.map((t) => (t.id === id ? res : t)));
      await refreshData();
    }
    return res;
  }, [refreshData]);

  const createBin = useCallback(async (binData: any) => {
    const res = await api.createBin(binData);
    if (res) {
      setBins((prev) => [res, ...prev]);
    }
    return res;
  }, []);

  const updateBin = useCallback(async (id: string, updates: any) => {
    const res = await api.updateBin(id, updates);
    if (res) {
      setBins((prev) => prev.map((b) => (b.bin_id === id ? res : b)));
    }
    return res;
  }, []);

  const value = useMemo(
    () => ({
      bins,
      realBins,
      demoBins,
      alerts,
      analytics,
      priorityQueue,
      reports,
      tasks,
      workers,
      supervisors,
      currentRole,
      currentWorkerId,
      currentSupervisorId,
      selectedBinId,
      selectedBin,
      selectedBinHistory,
      isLiveConnected,
      isLoading,
      dataSourceFilter,
      statusFilter,
      searchQuery,
      lastUpdateTimestamp,
      demoRunning,
      setCurrentRole,
      setCurrentWorkerId,
      setCurrentSupervisorId,
      setSelectedBinId,
      setDataSourceFilter,
      setStatusFilter,
      setSearchQuery,
      refreshData,
      resolveAlert,
      simulateCollection,
      triggerDemoStep,
      toggleDemoSimulation,
      injectHardwareTelemetry,
      submitCitizenReport,
      updateReportStatus,
      createCollectionTask,
      updateTaskStatus,
      completeTaskWithProof,
      verifyTask,
      createBin,
      updateBin,
    }),
    [
      bins,
      realBins,
      demoBins,
      alerts,
      analytics,
      priorityQueue,
      reports,
      tasks,
      workers,
      supervisors,
      currentRole,
      currentWorkerId,
      currentSupervisorId,
      selectedBinId,
      selectedBin,
      selectedBinHistory,
      isLiveConnected,
      isLoading,
      dataSourceFilter,
      statusFilter,
      searchQuery,
      lastUpdateTimestamp,
      demoRunning,
      refreshData,
      resolveAlert,
      simulateCollection,
      triggerDemoStep,
      toggleDemoSimulation,
      injectHardwareTelemetry,
      submitCitizenReport,
      updateReportStatus,
      createCollectionTask,
      updateTaskStatus,
      completeTaskWithProof,
      verifyTask,
      createBin,
      updateBin,
    ]
  );

  return <MunicipalContext.Provider value={value}>{children}</MunicipalContext.Provider>;
};

export function useMunicipal(): MunicipalContextType {
  const context = useContext(MunicipalContext);
  if (!context) {
    throw new Error('useMunicipal must be used within a MunicipalProvider');
  }
  return context;
}
