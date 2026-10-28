-- ============================================================================
-- SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
-- POSTGRESQL PRODUCTION DATABASE SCHEMA DDL
-- ============================================================================

-- 1. BINS TABLE: Master inventory of municipal dustbins
CREATE TABLE IF NOT EXISTS bins (
    bin_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location VARCHAR(255) NOT NULL,
    ward VARCHAR(64) NOT NULL,
    zone VARCHAR(64) NOT NULL,
    current_distance_cm NUMERIC(6, 2) NOT NULL DEFAULT 30.0,
    current_fill_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    current_status VARCHAR(32) NOT NULL DEFAULT 'LOW',
    online BOOLEAN NOT NULL DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(16) NOT NULL DEFAULT 'DEMO', -- 'REAL' or 'DEMO'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. TELEMETRY TABLE: Time-series historical sensor records
CREATE TABLE IF NOT EXISTS telemetry (
    id VARCHAR(64) PRIMARY KEY,
    bin_id VARCHAR(64) NOT NULL REFERENCES bins(bin_id) ON DELETE CASCADE,
    distance_cm NUMERIC(6, 2) NOT NULL,
    fill_percent NUMERIC(5, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    data_source VARCHAR(16) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ALERTS TABLE: Operational notifications and incident tracking
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    bin_id VARCHAR(64) NOT NULL REFERENCES bins(bin_id) ON DELETE CASCADE,
    alert_type VARCHAR(32) NOT NULL, -- 'FULL', 'HIGH', 'OFFLINE'
    severity VARCHAR(32) NOT NULL,   -- 'CRITICAL', 'WARNING', 'INFO'
    message TEXT NOT NULL,
    fill_percent NUMERIC(5, 2),
    resolved BOOLEAN NOT NULL DEFAULT false,
    data_source VARCHAR(16) NOT NULL DEFAULT 'DEMO',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. DEVICE CREDENTIALS TABLE: Secret keys for hardware authentication
CREATE TABLE IF NOT EXISTS device_credentials (
    bin_id VARCHAR(64) PRIMARY KEY REFERENCES bins(bin_id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. USERS TABLE: Municipal command center operators
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'OPERATOR',
    assigned_ward VARCHAR(64),
    worker_id VARCHAR(64),
    supervisor_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. CITIZEN REPORTS TABLE: Public citizen waste complaints
CREATE TABLE IF NOT EXISTS citizen_reports (
    id VARCHAR(64) PRIMARY KEY,
    bin_id VARCHAR(64) REFERENCES bins(bin_id) ON DELETE SET NULL,
    citizen_name VARCHAR(255) NOT NULL,
    citizen_phone VARCHAR(64),
    ward VARCHAR(64) NOT NULL,
    area VARCHAR(255) NOT NULL,
    issue VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    assigned_worker_id VARCHAR(64),
    assigned_worker_name VARCHAR(255),
    rejection_reason TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. WORKERS TABLE: Field municipal sanitation crew
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ward VARCHAR(64) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ON_DUTY',
    tasks_completed_today INT NOT NULL DEFAULT 0,
    active_task_id VARCHAR(64),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80
);

-- 8. SUPERVISORS TABLE: Area waste operations supervisors
CREATE TABLE IF NOT EXISTS supervisors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ward VARCHAR(64) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    pending_verifications INT NOT NULL DEFAULT 0
);

-- 9. COLLECTION TASKS TABLE: Dispatch and collection tasks
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    bin_id VARCHAR(64) REFERENCES bins(bin_id) ON DELETE SET NULL,
    report_id VARCHAR(64) REFERENCES citizen_reports(id) ON DELETE SET NULL,
    task_type VARCHAR(64) NOT NULL DEFAULT 'BIN_CLEARANCE',
    title VARCHAR(255) NOT NULL,
    ward VARCHAR(64) NOT NULL,
    location VARCHAR(255) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    assigned_worker_id VARCHAR(64) NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    assigned_worker_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED',
    before_fill_percent NUMERIC(5, 2),
    after_fill_percent NUMERIC(5, 2),
    completion_photo TEXT,
    notes TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(255)
);

-- ============================================================================
-- PERFORMANCE & GIS INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bins_bin_id ON bins(bin_id);
CREATE INDEX IF NOT EXISTS idx_bins_status ON bins(current_status);
CREATE INDEX IF NOT EXISTS idx_bins_last_seen ON bins(last_seen);
CREATE INDEX IF NOT EXISTS idx_bins_lat_lng ON bins(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bins_data_source ON bins(data_source);
CREATE INDEX IF NOT EXISTS idx_bins_ward ON bins(ward);
CREATE INDEX IF NOT EXISTS idx_bins_zone ON bins(zone);

CREATE INDEX IF NOT EXISTS idx_telemetry_bin_id ON telemetry(bin_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at ON telemetry(recorded_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_data_source ON telemetry(data_source);

CREATE INDEX IF NOT EXISTS idx_alerts_bin_id ON alerts(bin_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_reports_status ON citizen_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_ward ON citizen_reports(ward);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON citizen_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_ward ON tasks(ward);
CREATE INDEX IF NOT EXISTS idx_tasks_bin ON tasks(bin_id);
