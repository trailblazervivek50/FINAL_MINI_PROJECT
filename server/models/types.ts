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
  last_seen: string; // ISO 8601 string
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

export interface DeviceCredential {
  bin_id: string;
  api_key: string;
  created_at: string;
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'SUPERVISOR' | 'WORKER' | 'CITIZEN' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  name?: string;
  password_hash: string;
  role: UserRole;
  assigned_ward?: string;
  worker_id?: string;
  supervisor_id?: string;
  created_at: string;
}

export interface TelemetryPayload {
  bin_id: string;
  distance_cm: number;
  fill_percent?: number;
  status?: string;
}

// --- Citizen Garbage Reporting ---
export type CitizenIssueType =
  | 'Overflowing dustbin'
  | 'Garbage around dustbin'
  | 'Damaged dustbin'
  | 'Other';

export type CitizenReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export interface CitizenReport {
  id: string;
  bin_id?: string;
  citizen_name: string;
  citizen_phone?: string;
  ward: string;
  area: string;
  issue: CitizenIssueType;
  description: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  status: CitizenReportStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  rejection_reason?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Municipal Collection Tasks ---
export type TaskStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CollectionTask {
  id: string;
  bin_id?: string;
  report_id?: string;
  task_type: 'BIN_CLEARANCE' | 'CITIZEN_REPORT' | 'INSPECTION';
  title: string;
  ward: string;
  location: string;
  priority: TaskPriority;
  assigned_worker_id: string;
  assigned_worker_name: string;
  status: TaskStatus;
  before_fill_percent?: number;
  after_fill_percent?: number;
  completion_photo?: string;
  notes?: string;
  deadline: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
}

// --- Field Personnel ---
export interface Worker {
  id: string;
  name: string;
  ward: string;
  phone: string;
  status: 'ON_DUTY' | 'ON_BREAK' | 'BUSY';
  tasks_completed_today: number;
  active_task_id?: string;
  rating: number;
}

export interface Supervisor {
  id: string;
  name: string;
  ward: string;
  phone: string;
  pending_verifications: number;
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
  openReportsCount?: number;
  activeTasksCount?: number;
  completedTasksCount?: number;
  wardStats: {
    ward: string;
    total: number;
    averageFill: number;
    criticalCount: number;
    openReports?: number;
  }[];
  hourlyTrends: {
    hour: string;
    averageFill: number;
    telemetryCount: number;
  }[];
  topFullBins: Bin[];
}
