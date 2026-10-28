import { Pool } from 'pg';
import {
  Bin,
  TelemetryRecord,
  Alert,
  DeviceCredential,
  User,
  DataSource,
  CitizenReport,
  CollectionTask,
  Worker,
  Supervisor,
} from '../models/types';
import {
  INITIAL_REAL_BINS,
  REAL_DEVICE_CREDENTIALS,
  generateDemoBins,
  generateInitialTelemetry,
  generateInitialAlerts,
  INITIAL_USERS,
  INITIAL_WORKERS,
  INITIAL_SUPERVISORS,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_TASKS,
} from './seedData';
import { config } from '../config';

class DatabaseClient {
  private pgPool: Pool | null = null;
  private isPostgresConnected: boolean = false;

  // In-Memory storage repository (mirrors PostgreSQL tables and indexes)
  private binsMap = new Map<string, Bin>();
  private telemetryStore: TelemetryRecord[] = [];
  private alertsMap = new Map<string, Alert>();
  private deviceCredentialsMap = new Map<string, DeviceCredential>();
  private usersMap = new Map<string, User>();
  private reportsMap = new Map<string, CitizenReport>();
  private tasksMap = new Map<string, CollectionTask>();
  private workersMap = new Map<string, Worker>();
  private supervisorsMap = new Map<string, Supervisor>();

  constructor() {
    this.seedMemoryStore();
  }

  private seedMemoryStore() {
    // 1. Seed Real Devices
    INITIAL_REAL_BINS.forEach((bin) => {
      this.binsMap.set(bin.bin_id, { ...bin });
    });

    REAL_DEVICE_CREDENTIALS.forEach((cred) => {
      this.deviceCredentialsMap.set(cred.bin_id, { ...cred });
    });

    // 2. Seed Demo Devices (60 dustbins)
    const demoBins = generateDemoBins();
    demoBins.forEach((bin) => {
      this.binsMap.set(bin.bin_id, { ...bin });
    });

    // 3. Seed Initial Historical Telemetry
    const allBins = Array.from(this.binsMap.values());
    this.telemetryStore = generateInitialTelemetry(allBins);

    // 4. Seed Initial Alerts
    const initialAlerts = generateInitialAlerts(allBins);
    initialAlerts.forEach((alert) => {
      this.alertsMap.set(alert.id, { ...alert });
    });

    // 5. Seed Users
    INITIAL_USERS.forEach((user) => {
      this.usersMap.set(user.username, { ...user });
    });

    // 6. Seed Workers
    INITIAL_WORKERS.forEach((worker) => {
      this.workersMap.set(worker.id, { ...worker });
    });

    // 7. Seed Supervisors
    INITIAL_SUPERVISORS.forEach((supervisor) => {
      this.supervisorsMap.set(supervisor.id, { ...supervisor });
    });

    // 8. Seed Citizen Reports
    INITIAL_CITIZEN_REPORTS.forEach((report) => {
      this.reportsMap.set(report.id, { ...report });
    });

    // 9. Seed Tasks
    INITIAL_TASKS.forEach((task) => {
      this.tasksMap.set(task.id, { ...task });
    });
  }

  public async init(): Promise<void> {
    if (config.databaseUrl) {
      try {
        this.pgPool = new Pool({
          connectionString: config.databaseUrl,
          connectionTimeoutMillis: 3000,
        });

        // Test connection
        const client = await this.pgPool.connect();
        this.isPostgresConnected = true;
        console.log('[DATABASE] Successfully connected to PostgreSQL instance');
        client.release();

        // Initialize schema and sync tables
        await this.initPostgresSchema();
      } catch (err: any) {
        console.warn(`[DATABASE] PostgreSQL not reachable at ${config.databaseUrl}. Falling back to internal engine. Error: ${err.message}`);
        this.isPostgresConnected = false;
        if (this.pgPool) {
          await this.pgPool.end().catch(() => {});
          this.pgPool = null;
        }
      }
    } else {
      console.log('[DATABASE] Running with high-performance integrated storage engine');
    }
  }

  private async initPostgresSchema(): Promise<void> {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
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
          data_source VARCHAR(16) NOT NULL DEFAULT 'DEMO',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS telemetry (
          id VARCHAR(64) PRIMARY KEY,
          bin_id VARCHAR(64) NOT NULL,
          distance_cm NUMERIC(6, 2) NOT NULL,
          fill_percent NUMERIC(5, 2) NOT NULL,
          status VARCHAR(32) NOT NULL,
          data_source VARCHAR(16) NOT NULL,
          recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS alerts (
          id VARCHAR(64) PRIMARY KEY,
          bin_id VARCHAR(64) NOT NULL,
          alert_type VARCHAR(32) NOT NULL,
          severity VARCHAR(32) NOT NULL,
          message TEXT NOT NULL,
          fill_percent NUMERIC(5, 2),
          resolved BOOLEAN NOT NULL DEFAULT false,
          data_source VARCHAR(16) NOT NULL DEFAULT 'DEMO',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS device_credentials (
          bin_id VARCHAR(64) PRIMARY KEY,
          api_key VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed PostgreSQL if empty
      const checkRes = await this.pgPool.query('SELECT COUNT(*) FROM bins');
      if (parseInt(checkRes.rows[0].count, 10) === 0) {
        console.log('[DATABASE] Seeding PostgreSQL with real and demo bins...');
        for (const bin of this.binsMap.values()) {
          await this.pgPool.query(
            `INSERT INTO bins (bin_id, name, latitude, longitude, location, ward, zone, current_distance_cm, current_fill_percent, current_status, online, last_seen, data_source, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (bin_id) DO NOTHING`,
            [
              bin.bin_id, bin.name, bin.latitude, bin.longitude, bin.location, bin.ward, bin.zone,
              bin.current_distance_cm, bin.current_fill_percent, bin.current_status, bin.online,
              bin.last_seen, bin.data_source, bin.created_at, bin.updated_at
            ]
          );
        }

        for (const cred of this.deviceCredentialsMap.values()) {
          await this.pgPool.query(
            `INSERT INTO device_credentials (bin_id, api_key, created_at)
             VALUES ($1, $2, $3) ON CONFLICT (bin_id) DO NOTHING`,
            [cred.bin_id, cred.api_key, cred.created_at]
          );
        }
      }
    } catch (e: any) {
      console.warn('[DATABASE] Notice on PG schema check:', e.message);
    }
  }

  // --- BINS API ---

  public async getAllBins(filters?: {
    dataSource?: DataSource | 'ALL';
    status?: string;
    ward?: string;
    zone?: string;
    search?: string;
  }): Promise<Bin[]> {
    let bins = Array.from(this.binsMap.values());

    if (filters) {
      if (filters.dataSource && filters.dataSource !== 'ALL') {
        bins = bins.filter((b) => b.data_source === filters.dataSource);
      }
      if (filters.status && filters.status !== 'ALL') {
        bins = bins.filter((b) => b.current_status === filters.status);
      }
      if (filters.ward && filters.ward !== 'ALL') {
        bins = bins.filter((b) => b.ward.toLowerCase() === filters.ward?.toLowerCase());
      }
      if (filters.zone && filters.zone !== 'ALL') {
        bins = bins.filter((b) => b.zone.toLowerCase() === filters.zone?.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        bins = bins.filter((b) =>
          b.bin_id.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          b.ward.toLowerCase().includes(q)
        );
      }
    }

    // Sort: REAL devices first (BIN_001..BIN_005), then DEMO devices
    return bins.sort((a, b) => {
      if (a.data_source === 'REAL' && b.data_source !== 'REAL') return -1;
      if (a.data_source !== 'REAL' && b.data_source === 'REAL') return 1;
      return a.bin_id.localeCompare(b.bin_id);
    });
  }

  public async getBinById(bin_id: string): Promise<Bin | null> {
    return this.binsMap.get(bin_id) || null;
  }

  public async updateBin(bin_id: string, updates: Partial<Bin>): Promise<Bin | null> {
    const existing = this.binsMap.get(bin_id);
    if (!existing) return null;

    const updated: Bin = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.binsMap.set(bin_id, updated);

    if (this.isPostgresConnected && this.pgPool) {
      this.pgPool.query(
        `UPDATE bins SET
           current_distance_cm = $1,
           current_fill_percent = $2,
           current_status = $3,
           online = $4,
           last_seen = $5,
           updated_at = $6
         WHERE bin_id = $7`,
        [
          updated.current_distance_cm,
          updated.current_fill_percent,
          updated.current_status,
          updated.online,
          updated.last_seen,
          updated.updated_at,
          bin_id
        ]
      ).catch((err) => console.error('[PG ERROR] updateBin:', err.message));
    }

    return updated;
  }

  // --- TELEMETRY API ---

  public async insertTelemetry(record: TelemetryRecord): Promise<void> {
    this.telemetryStore.push(record);
    // Keep max 20,000 telemetry points in memory
    if (this.telemetryStore.length > 20000) {
      this.telemetryStore.splice(0, 1000);
    }

    if (this.isPostgresConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO telemetry (id, bin_id, distance_cm, fill_percent, status, data_source, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [record.id, record.bin_id, record.distance_cm, record.fill_percent, record.status, record.data_source, record.recorded_at]
      ).catch((err) => console.error('[PG ERROR] insertTelemetry:', err.message));
    }
  }

  public async getTelemetryByBin(bin_id: string, limit: number = 30): Promise<TelemetryRecord[]> {
    const matches = this.telemetryStore
      .filter((t) => t.bin_id === bin_id)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    return matches.slice(-limit);
  }

  public async getRecentTelemetry(limit: number = 50): Promise<TelemetryRecord[]> {
    return this.telemetryStore.slice(-limit);
  }

  // --- ALERTS API ---

  public async getAlerts(filters?: { resolved?: boolean; dataSource?: DataSource | 'ALL' }): Promise<Alert[]> {
    let list = Array.from(this.alertsMap.values());
    if (filters) {
      if (filters.resolved !== undefined) {
        list = list.filter((a) => a.resolved === filters.resolved);
      }
      if (filters.dataSource && filters.dataSource !== 'ALL') {
        list = list.filter((a) => a.data_source === filters.dataSource);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async insertAlert(alert: Alert): Promise<void> {
    this.alertsMap.set(alert.id, alert);
    if (this.isPostgresConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO alerts (id, bin_id, alert_type, severity, message, fill_percent, resolved, data_source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [alert.id, alert.bin_id, alert.alert_type, alert.severity, alert.message, alert.fill_percent, alert.resolved, alert.data_source, alert.created_at]
      ).catch((err) => console.error('[PG ERROR] insertAlert:', err.message));
    }
  }

  public async resolveAlert(alert_id: string): Promise<boolean> {
    const alert = this.alertsMap.get(alert_id);
    if (!alert) return false;
    alert.resolved = true;
    alert.resolved_at = new Date().toISOString();
    return true;
  }

  public async resolveAlertsForBin(bin_id: string, alertTypes: string[]): Promise<void> {
    const now = new Date().toISOString();
    for (const alert of this.alertsMap.values()) {
      if (alert.bin_id === bin_id && alertTypes.includes(alert.alert_type) && !alert.resolved) {
        alert.resolved = true;
        alert.resolved_at = now;
      }
    }
  }

  // --- CREDENTIALS API ---

  public async getDeviceCredential(bin_id: string): Promise<DeviceCredential | null> {
    return this.deviceCredentialsMap.get(bin_id) || null;
  }

  public async getAllDeviceCredentials(): Promise<DeviceCredential[]> {
    return Array.from(this.deviceCredentialsMap.values());
  }

  // --- USERS API ---

  // --- BIN REGISTRATION & EDIT API ---

  public async createBin(bin: Bin, apiKey?: string): Promise<Bin> {
    this.binsMap.set(bin.bin_id, bin);
    if (apiKey) {
      this.deviceCredentialsMap.set(bin.bin_id, {
        bin_id: bin.bin_id,
        api_key: apiKey,
        created_at: new Date().toISOString(),
      });
    }
    if (this.isPostgresConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO bins (bin_id, name, latitude, longitude, location, ward, zone, current_distance_cm, current_fill_percent, current_status, online, last_seen, data_source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [bin.bin_id, bin.name, bin.latitude, bin.longitude, bin.location, bin.ward, bin.zone, bin.current_distance_cm, bin.current_fill_percent, bin.current_status, bin.online, bin.last_seen, bin.data_source, bin.created_at, bin.updated_at]
      ).catch((err) => console.error('[PG ERROR] createBin:', err.message));

      if (apiKey) {
        this.pgPool.query(
          `INSERT INTO device_credentials (bin_id, api_key, created_at) VALUES ($1, $2, $3)`,
          [bin.bin_id, apiKey, new Date().toISOString()]
        ).catch((err) => console.error('[PG ERROR] createBin credentials:', err.message));
      }
    }
    return bin;
  }

  public async updateBinDetails(bin_id: string, updates: Partial<Bin>): Promise<Bin | null> {
    const bin = this.binsMap.get(bin_id);
    if (!bin) return null;
    const updated: Bin = {
      ...bin,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.binsMap.set(bin_id, updated);
    return updated;
  }

  // --- CITIZEN REPORTS API ---

  public async getAllReports(filters?: { ward?: string; status?: string; citizenPhone?: string }): Promise<CitizenReport[]> {
    let list = Array.from(this.reportsMap.values());
    if (filters) {
      if (filters.ward && filters.ward !== 'ALL') {
        list = list.filter((r) => r.ward === filters.ward);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter((r) => r.status === filters.status);
      }
      if (filters.citizenPhone) {
        list = list.filter((r) => r.citizen_phone === filters.citizenPhone);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getReportById(id: string): Promise<CitizenReport | null> {
    return this.reportsMap.get(id) || null;
  }

  public async insertReport(report: CitizenReport): Promise<CitizenReport> {
    this.reportsMap.set(report.id, report);
    return report;
  }

  public async updateReport(id: string, updates: Partial<CitizenReport>): Promise<CitizenReport | null> {
    const report = this.reportsMap.get(id);
    if (!report) return null;
    const updated: CitizenReport = {
      ...report,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.reportsMap.set(id, updated);
    return updated;
  }

  // --- TASKS API ---

  public async getAllTasks(filters?: { status?: string; workerId?: string; ward?: string; priority?: string }): Promise<CollectionTask[]> {
    let list = Array.from(this.tasksMap.values());
    if (filters) {
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter((t) => t.status === filters.status);
      }
      if (filters.workerId && filters.workerId !== 'ALL') {
        list = list.filter((t) => t.assigned_worker_id === filters.workerId);
      }
      if (filters.ward && filters.ward !== 'ALL') {
        list = list.filter((t) => t.ward === filters.ward);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        list = list.filter((t) => t.priority === filters.priority);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getTaskById(id: string): Promise<CollectionTask | null> {
    return this.tasksMap.get(id) || null;
  }

  public async getActiveTaskForBin(bin_id: string): Promise<CollectionTask | null> {
    for (const task of this.tasksMap.values()) {
      if (task.bin_id === bin_id && (task.status === 'ASSIGNED' || task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS')) {
        return task;
      }
    }
    return null;
  }

  public async insertTask(task: CollectionTask): Promise<CollectionTask> {
    this.tasksMap.set(task.id, task);
    return task;
  }

  public async updateTask(id: string, updates: Partial<CollectionTask>): Promise<CollectionTask | null> {
    const task = this.tasksMap.get(id);
    if (!task) return null;
    const updated: CollectionTask = {
      ...task,
      ...updates,
    };
    this.tasksMap.set(id, updated);
    return updated;
  }

  // --- WORKERS & SUPERVISORS API ---

  public async getAllWorkers(filters?: { ward?: string; status?: string }): Promise<Worker[]> {
    let list = Array.from(this.workersMap.values());
    if (filters?.ward && filters.ward !== 'ALL') {
      list = list.filter((w) => w.ward.toLowerCase() === filters.ward?.toLowerCase());
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((w) => w.status === filters.status);
    }
    return list;
  }

  public async getWorkerById(id: string): Promise<Worker | null> {
    return this.workersMap.get(id) || null;
  }

  public async updateWorker(id: string, updates: Partial<Worker>): Promise<Worker | null> {
    const worker = this.workersMap.get(id);
    if (!worker) return null;
    const updated: Worker = { ...worker, ...updates };
    this.workersMap.set(id, updated);
    return updated;
  }

  public async getAllSupervisors(): Promise<Supervisor[]> {
    return Array.from(this.supervisorsMap.values());
  }

  public async getSupervisorById(id: string): Promise<Supervisor | null> {
    return this.supervisorsMap.get(id) || null;
  }

  // --- USERS API ---

  public async getUserByUsername(username: string): Promise<User | null> {
    return this.usersMap.get(username) || null;
  }

  public async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  // Reset database state (for testing)
  public reset(): void {
    this.binsMap.clear();
    this.telemetryStore = [];
    this.alertsMap.clear();
    this.deviceCredentialsMap.clear();
    this.usersMap.clear();
    this.reportsMap.clear();
    this.tasksMap.clear();
    this.workersMap.clear();
    this.supervisorsMap.clear();
    this.seedMemoryStore();
  }
}

export const db = new DatabaseClient();
