// ============================================================================
// SMART MUNICIPAL DUSTBIN MONITORING PLATFORM - UNIFIED TYPES
// ============================================================================

export type BinStatus = 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL';
export type DataSource = 'REAL' | 'DEMO';
export type ConnectionState = 'ONLINE' | 'WARNING' | 'OFFLINE';

export interface Bin {
  bin_id: string; // Logical primary identifier, e.g. 'BIN_001', 'BIN_DEMO_001'
  name: string;
  latitude: number;
  longitude: number;
  location: string;
  ward: string;
  zone: string;
  current_distance_cm: number;
  current_fill_percent: number;
  current_status: BinStatus;
  online: boolean;
  connection_state?: ConnectionState;
  last_seen: string;
  data_source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface TelemetryRecord {
  id: string;
  bin_id: string;
  distance_cm: number;
  fill_percent: number;
  status: BinStatus;
  data_source: DataSource;
  recorded_at: string;
}

export type AlertType = 'FULL' | 'HIGH' | 'OFFLINE';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Alert {
  id: string;
  bin_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  fill_percent?: number;
  resolved: boolean;
  data_source: DataSource;
  created_at: string;
  resolved_at?: string;
}

export interface AnalyticsSummary {
  totalDustbins: number;
  online: number;
  warning: number;
  offline: number;
  statusCounts: {
    full: number;
    high: number;
    medium: number;
    low: number;
  };
  dataSourceCounts: {
    real: number;
    demo: number;
  };
  averageFill: number;
  wardStats: {
    ward: string;
    total: number;
    averageFill: number;
    criticalCount: number;
  }[];
  hourlyTrends: {
    hour: string;
    averageFill: number;
    telemetryCount: number;
  }[];
  topFullBins: Bin[];
}

export interface DeviceCredential {
  bin_id: string;
  api_key: string;
  created_at: string;
}

// ============================================================================
// COMPATIBILITY TYPES (Supporting legacy components & transition modules)
// ============================================================================

export type StatusLevel = 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type UserRole = 'AUTHORITY' | 'WORKER' | 'SUPERVISOR' | 'CITIZEN';

export interface SensorReading {
  dustbinId: string;
  fillPercentage: number;
  distance: number;
  moisture: number;
  timestamp: string;
}

export interface DustbinHistoryPoint {
  timestamp: string;
  fillPercentage: number;
  distance: number;
  moisture: number;
}

export interface Dustbin {
  id: string;
  area: string;
  ward: string;
  wardId: string;
  fillPercentage: number;
  distance: number;
  moisture: number;
  status: StatusLevel;
  espConnection: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastUpdated: string;
  coordinates: [number, number];
  height: number;
  history: DustbinHistoryPoint[];
  isPhysicalHardware: boolean;
}

export interface Ward {
  id: string;
  name: string;
  areaName: string;
  criticalBins: number;
  highPriority: number;
  openReports: number;
  pendingTasks: number;
  completedToday: number;
  averageResponseTime: string;
  wastePressure: StatusLevel;
  center: [number, number];
  polygon: [number, number][];
}

export type CitizenIssueType =
  | 'Overflowing dustbin'
  | 'Garbage around dustbin'
  | 'Damaged dustbin'
  | 'Other';

export interface CitizenReport {
  id: string;
  dustbinId?: string;
  bin_id?: string;
  citizen_name?: string;
  citizen_phone?: string;
  ward: string;
  area: string;
  issue: CitizenIssueType;
  description: string;
  photoUrl?: string;
  photo_url?: string;
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  status: any;
  priority: any;
  priorityScore?: number;
  isDuplicate?: boolean;
  duplicateNotice?: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  resolution_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN PROGRESS'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED';

export interface TaskProof {
  completionPhoto?: string;
  completion_photo?: string;
  location?: [number, number];
  timestamp?: string;
  beforeFill?: number;
  afterFill?: number;
}

export interface Task {
  id: string;
  dustbinId?: string;
  bin_id?: string;
  report_id?: string;
  task_type?: 'BIN_CLEARANCE' | 'CITIZEN_REPORT' | 'INSPECTION';
  title?: string;
  ward: string;
  area?: string;
  location?: string;
  assignedToWorkerId?: string;
  assigned_worker_id?: string;
  workerName?: string;
  assigned_worker_name?: string;
  assignedAt?: string;
  deadline: string;
  status: any;
  priority: any;
  beforeFill?: number;
  before_fill_percent?: number;
  afterFill?: number;
  after_fill_percent?: number;
  proof?: TaskProof;
  completion_photo?: string;
  notes?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
}

export type CollectionTask = Task;

export interface Worker {
  id: string;
  name: string;
  ward: string;
  phone: string;
  status: 'ON DUTY' | 'ON BREAK' | 'BUSY' | 'ON_DUTY' | 'ON_BREAK' | string;
  tasksCompletedToday?: number;
  tasks_completed_today?: number;
  activeTaskId?: string;
  active_task_id?: string;
  rating: number;
}

export interface Supervisor {
  id: string;
  name: string;
  ward: string;
  phone?: string;
  pendingVerifications?: number;
  pending_verifications?: number;
}

export interface SystemMetrics {
  totalDustbins: number;
  critical: number;
  warning: number;
  activeTasks: number;
  reportsToday: number;
  resolvedToday: number;
}
