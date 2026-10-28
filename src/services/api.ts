import {
  Bin,
  Alert,
  AnalyticsSummary,
  TelemetryRecord,
  DeviceCredential,
  CitizenReport,
  CollectionTask,
  Worker,
  Supervisor,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export class ApiService {
  private eventSource: EventSource | null = null;
  private sseListeners: {
    onBinUpdated?: (bin: Bin, telemetry?: TelemetryRecord) => void;
    onBinCreated?: (bin: Bin) => void;
    onAlertCreated?: (alert: Alert) => void;
    onAlertResolved?: (data: { id: string; bin_id?: string }) => void;
    onReportCreated?: (report: CitizenReport) => void;
    onReportUpdated?: (report: CitizenReport) => void;
    onTaskCreated?: (task: CollectionTask) => void;
    onTaskUpdated?: (task: CollectionTask) => void;
    onTaskCompleted?: (task: CollectionTask) => void;
    onTaskVerified?: (task: CollectionTask) => void;
    onDemoStep?: (data: any) => void;
    onConnectionChange?: (connected: boolean) => void;
  } = {};

  // --- REST CLIENT ---

  public async getBins(params?: {
    dataSource?: 'REAL' | 'DEMO' | 'ALL';
    status?: string;
    ward?: string;
    zone?: string;
    search?: string;
  }): Promise<Bin[]> {
    try {
      const query = new URLSearchParams();
      if (params?.dataSource) query.set('dataSource', params.dataSource);
      if (params?.status) query.set('status', params.status);
      if (params?.ward) query.set('ward', params.ward);
      if (params?.zone) query.set('zone', params.zone);
      if (params?.search) query.set('search', params.search);

      const res = await fetch(`${API_BASE}/bins?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch bins from server:', e);
      return [];
    }
  }

  public async getBinById(id: string): Promise<Bin | null> {
    try {
      const res = await fetch(`${API_BASE}/bins/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn(`[API] Could not fetch bin ${id}:`, e);
      return null;
    }
  }

  public async createBin(binData: Partial<Bin> & { device_key?: string }): Promise<Bin | null> {
    try {
      const res = await fetch(`${API_BASE}/bins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(binData),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] Error creating bin:', e);
      return null;
    }
  }

  public async updateBin(id: string, updates: Partial<Bin>): Promise<Bin | null> {
    try {
      const res = await fetch(`${API_BASE}/bins/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error(`[API] Error updating bin ${id}:`, e);
      return null;
    }
  }

  public async getBinHistory(id: string, limit: number = 30): Promise<TelemetryRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/bins/${encodeURIComponent(id)}/history?limit=${limit}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn(`[API] Could not fetch bin history for ${id}:`, e);
      return [];
    }
  }

  public async getAlerts(resolved?: boolean): Promise<Alert[]> {
    try {
      const q = resolved !== undefined ? `?resolved=${resolved}` : '';
      const res = await fetch(`${API_BASE}/alerts${q}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch alerts:', e);
      return [];
    }
  }

  public async resolveAlert(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  public async getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn('[API] Could not fetch analytics summary:', e);
      return null;
    }
  }

  public async getPriorityQueue(): Promise<Bin[]> {
    try {
      const res = await fetch(`${API_BASE}/priority`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch priority queue:', e);
      return [];
    }
  }

  public async simulateCollection(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/priority/collect/${encodeURIComponent(id)}`, {
        method: 'POST',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // --- CITIZEN REPORTS ---

  public async getReports(params?: {
    ward?: string;
    status?: string;
    citizenPhone?: string;
  }): Promise<CitizenReport[]> {
    try {
      const query = new URLSearchParams();
      if (params?.ward) query.set('ward', params.ward);
      if (params?.status) query.set('status', params.status);
      if (params?.citizenPhone) query.set('citizenPhone', params.citizenPhone);

      const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch citizen reports:', e);
      return [];
    }
  }

  public async getReportById(id: string): Promise<CitizenReport | null> {
    try {
      const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  }

  public async createReport(reportData: {
    citizen_name: string;
    citizen_phone?: string;
    ward: string;
    area: string;
    issue: string;
    description: string;
    photo_url?: string;
    bin_id?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<CitizenReport | null> {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] Error creating citizen report:', e);
      return null;
    }
  }

  public async updateReportStatus(
    id: string,
    updates: {
      status?: string;
      assigned_worker_id?: string;
      resolution_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<CitizenReport | null> {
    try {
      const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error(`[API] Error updating report ${id}:`, e);
      return null;
    }
  }

  // --- COLLECTION TASKS ---

  public async getTasks(params?: {
    ward?: string;
    status?: string;
    worker_id?: string;
    priority?: string;
    bin_id?: string;
  }): Promise<CollectionTask[]> {
    try {
      const query = new URLSearchParams();
      if (params?.ward) query.set('ward', params.ward);
      if (params?.status) query.set('status', params.status);
      if (params?.worker_id) query.set('worker_id', params.worker_id);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.bin_id) query.set('bin_id', params.bin_id);

      const res = await fetch(`${API_BASE}/tasks?${query.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch collection tasks:', e);
      return [];
    }
  }

  public async getTaskById(id: string): Promise<CollectionTask | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  }

  public async createTask(taskData: Partial<CollectionTask>): Promise<CollectionTask | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] Error creating task:', e);
      return null;
    }
  }

  public async updateTaskStatus(id: string, status: string): Promise<CollectionTask | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error(`[API] Error updating task status for ${id}:`, e);
      return null;
    }
  }

  public async completeTask(
    id: string,
    proof: {
      completion_photo?: string;
      after_fill_percent?: number;
      notes?: string;
    }
  ): Promise<CollectionTask | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error(`[API] Error completing task ${id}:`, e);
      return null;
    }
  }

  public async verifyTask(
    id: string,
    verification: {
      approved: boolean;
      supervisor_id?: string;
      notes?: string;
    }
  ): Promise<CollectionTask | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verification),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error(`[API] Error verifying task ${id}:`, e);
      return null;
    }
  }

  // --- FIELD STAFF ---

  public async getWorkers(params?: { ward?: string; status?: string }): Promise<Worker[]> {
    try {
      const query = new URLSearchParams();
      if (params?.ward) query.set('ward', params.ward);
      if (params?.status) query.set('status', params.status);

      const res = await fetch(`${API_BASE}/workers?${query.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch workers:', e);
      return [];
    }
  }

  public async getWorkerById(id: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/workers/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  }

  public async updateWorker(id: string, updates: Partial<Worker>): Promise<Worker | null> {
    try {
      const res = await fetch(`${API_BASE}/workers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  }

  public async getSupervisors(): Promise<Supervisor[]> {
    try {
      const res = await fetch(`${API_BASE}/supervisors`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] Could not fetch supervisors:', e);
      return [];
    }
  }

  // --- PHOTO & MEDIA UPLOAD ---

  public async uploadImage(imageData: string, fileName?: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageData, file_name: fileName }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.url || null;
    } catch (e) {
      console.error('[API] Error uploading image:', e);
      return null;
    }
  }

  // --- SIMULATION & HARDWARE CONTROLS ---

  public async triggerDemoStep(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/step`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  public async toggleDemoSimulation(enabled: boolean): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  public async injectTelemetry(data: {
    bin_id: string;
    distance_cm: number;
    fill_percent?: number;
    apiKey?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/inject-telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  public async getDeviceCredentials(): Promise<DeviceCredential[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/credentials`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      return [];
    }
  }

  // --- SSE REAL-TIME CONNECTION ---

  public connectSSE(listeners: {
    onBinUpdated?: (bin: Bin, telemetry?: TelemetryRecord) => void;
    onBinCreated?: (bin: Bin) => void;
    onAlertCreated?: (alert: Alert) => void;
    onAlertResolved?: (data: { id: string; bin_id?: string }) => void;
    onReportCreated?: (report: CitizenReport) => void;
    onReportUpdated?: (report: CitizenReport) => void;
    onTaskCreated?: (task: CollectionTask) => void;
    onTaskUpdated?: (task: CollectionTask) => void;
    onTaskCompleted?: (task: CollectionTask) => void;
    onTaskVerified?: (task: CollectionTask) => void;
    onDemoStep?: (data: any) => void;
    onConnectionChange?: (connected: boolean) => void;
  }): () => void {
    this.sseListeners = listeners;

    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(`${API_BASE}/stream`);

      this.eventSource.onopen = () => {
        this.sseListeners.onConnectionChange?.(true);
      };

      this.eventSource.onerror = () => {
        this.sseListeners.onConnectionChange?.(false);
      };

      this.eventSource.addEventListener('bin_updated', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onBinUpdated?.(parsed.bin, parsed.telemetry);
        } catch (e) {}
      });

      this.eventSource.addEventListener('bin_created', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onBinCreated?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('alert_created', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onAlertCreated?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('alert_resolved', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onAlertResolved?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('report_created', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onReportCreated?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('report_updated', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onReportUpdated?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('task_created', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onTaskCreated?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('task_updated', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onTaskUpdated?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('task_completed', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onTaskCompleted?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('task_verified', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onTaskVerified?.(parsed);
        } catch (e) {}
      });

      this.eventSource.addEventListener('demo_step', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.sseListeners.onDemoStep?.(parsed);
        } catch (e) {}
      });
    } catch (err) {
      console.warn('[SSE] Failed to establish EventSource:', err);
      this.sseListeners.onConnectionChange?.(false);
    }

    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }
}

export const api = new ApiService();
