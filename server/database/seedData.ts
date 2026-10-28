import { Bin, DeviceCredential, Alert, TelemetryRecord, User, Worker, Supervisor, CitizenReport, CollectionTask } from '../models/types';

// The 5 Provisioned Real Physical IoT Devices
export const REAL_DEVICE_CREDENTIALS: DeviceCredential[] = [
  { bin_id: 'BIN_001', api_key: 'KEY_BIN_001_SECRET_9871', created_at: new Date().toISOString() },
  { bin_id: 'BIN_002', api_key: 'KEY_BIN_002_SECRET_5422', created_at: new Date().toISOString() },
  { bin_id: 'BIN_003', api_key: 'KEY_BIN_003_SECRET_3319', created_at: new Date().toISOString() },
  { bin_id: 'BIN_004', api_key: 'KEY_BIN_004_SECRET_7741', created_at: new Date().toISOString() },
  { bin_id: 'BIN_005', api_key: 'KEY_BIN_005_SECRET_1120', created_at: new Date().toISOString() },
];

export const INITIAL_REAL_BINS: Bin[] = [
  {
    bin_id: 'BIN_001',
    name: 'Main Road - Subhash Chowk',
    latitude: 18.2325,
    longitude: 75.6948,
    location: 'Main Road, Ward 02',
    ward: 'Ward 02',
    zone: 'Central Zone',
    current_distance_cm: 6.8,
    current_fill_percent: 93,
    current_status: 'FULL',
    online: true,
    last_seen: new Date().toISOString(),
    data_source: 'REAL',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    bin_id: 'BIN_002',
    name: 'Market Yard APMC Complex',
    latitude: 18.2365,
    longitude: 75.7025,
    location: 'Market Area, Ward 03',
    ward: 'Ward 03',
    zone: 'East Zone',
    current_distance_cm: 18.5,
    current_fill_percent: 46,
    current_status: 'LOW',
    online: true,
    last_seen: new Date(Date.now() - 60000 * 2).toISOString(),
    data_source: 'REAL',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    bin_id: 'BIN_003',
    name: 'Barshi Railway Station Forecourt',
    latitude: 18.2432,
    longitude: 75.6920,
    location: 'Railway Station, Ward 04',
    ward: 'Ward 04',
    zone: 'North Zone',
    current_distance_cm: 8.2,
    current_fill_percent: 87,
    current_status: 'HIGH',
    online: true,
    last_seen: new Date(Date.now() - 60000 * 1).toISOString(),
    data_source: 'REAL',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    bin_id: 'BIN_004',
    name: 'Central ST Bus Stand',
    latitude: 18.2301,
    longitude: 75.6960,
    location: 'Bus Stand, Ward 05',
    ward: 'Ward 05',
    zone: 'South Zone',
    current_distance_cm: 13.5,
    current_fill_percent: 66,
    current_status: 'MEDIUM',
    online: true,
    last_seen: new Date(Date.now() - 60000 * 3).toISOString(),
    data_source: 'REAL',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    bin_id: 'BIN_005',
    name: 'Civil Hospital Road Plaza',
    latitude: 18.2280,
    longitude: 75.6985,
    location: 'Hospital Road, Ward 06',
    ward: 'Ward 06',
    zone: 'Central Zone',
    current_distance_cm: 7.1,
    current_fill_percent: 92,
    current_status: 'FULL',
    online: true,
    last_seen: new Date(Date.now() - 60000 * 4).toISOString(),
    data_source: 'REAL',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate 3 Realistic Demo Dustbins across Barshi, Solapur (Section 1: Retain 2-3 Demo Bins Maximum)
export function generateDemoBins(): Bin[] {
  const now = Date.now();

  const demoBins: Bin[] = [
    {
      bin_id: 'BIN_DEMO_001',
      name: 'Old City - Bhagwant Mandir Ward',
      latitude: 18.2355,
      longitude: 75.6955,
      location: 'Old City, Spot 4',
      ward: 'Ward 01',
      zone: 'North Zone',
      current_distance_cm: 11.5,
      current_fill_percent: 74,
      current_status: 'MEDIUM',
      online: true,
      last_seen: new Date(now - 60000 * 2).toISOString(),
      data_source: 'DEMO',
      created_at: new Date(now - 86400000 * 30).toISOString(),
      updated_at: new Date(now - 60000 * 2).toISOString(),
    },
    {
      bin_id: 'BIN_DEMO_002',
      name: 'Karmala Road Industrial Point',
      latitude: 18.2440,
      longitude: 75.6880,
      location: 'Industrial Area, Spot 2',
      ward: 'Ward 07',
      zone: 'West Zone',
      current_distance_cm: 9.0,
      current_fill_percent: 84,
      current_status: 'HIGH',
      online: true,
      last_seen: new Date(now - 60000 * 1).toISOString(),
      data_source: 'DEMO',
      created_at: new Date(now - 86400000 * 30).toISOString(),
      updated_at: new Date(now - 60000 * 1).toISOString(),
    },
    {
      bin_id: 'BIN_DEMO_003',
      name: 'Bhairavnath Garden Perimeter',
      latitude: 18.2310,
      longitude: 75.7030,
      location: 'Garden Area, Spot 5',
      ward: 'Ward 08',
      zone: 'East Zone',
      current_distance_cm: 21.3,
      current_fill_percent: 35,
      current_status: 'LOW',
      online: false,
      last_seen: new Date(now - 60000 * 30).toISOString(), // >15 min -> Offline
      data_source: 'DEMO',
      created_at: new Date(now - 86400000 * 30).toISOString(),
      updated_at: new Date(now - 60000 * 30).toISOString(),
    },
  ];

  return demoBins;
}

// Generate Realistic 24h Historical Telemetry
export function generateInitialTelemetry(bins: Bin[]): TelemetryRecord[] {
  const records: TelemetryRecord[] = [];
  const now = Date.now();

  bins.forEach((bin) => {
    // Generate 6 historical telemetry points for each bin (last 24 hours)
    for (let h = 6; h >= 0; h--) {
      const timeOffsetMs = h * 4 * 3600000; // every 4 hours
      const timestamp = new Date(now - timeOffsetMs).toISOString();
      
      // Gradually lower fill for older points
      let histFill = Math.max(10, Math.min(100, Math.round(bin.current_fill_percent - h * 7 + (bin.bin_id.length % 5))));
      let histDist = Number((30.0 - (histFill / 100.0) * 25.0).toFixed(1));
      
      let histStatus: 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL' = 'LOW';
      if (histFill >= 90) histStatus = 'FULL';
      else if (histFill >= 80) histStatus = 'HIGH';
      else if (histFill >= 50) histStatus = 'MEDIUM';

      records.push({
        id: `TEL_${bin.bin_id}_${6 - h}`,
        bin_id: bin.bin_id,
        distance_cm: histDist,
        fill_percent: histFill,
        status: histStatus,
        data_source: bin.data_source,
        recorded_at: timestamp,
      });
    }
  });

  return records;
}

// Generate Initial Active Alerts
export function generateInitialAlerts(bins: Bin[]): Alert[] {
  const alerts: Alert[] = [];
  let alertSeq = 1;

  bins.forEach((bin) => {
    if (bin.current_status === 'FULL') {
      alerts.push({
        id: `ALT_${(alertSeq++).toString().padStart(4, '0')}`,
        bin_id: bin.bin_id,
        alert_type: 'FULL',
        severity: 'CRITICAL',
        message: `${bin.data_source === 'REAL' ? '🔴 [REAL HARDWARE]' : '🔴'} ${bin.bin_id} (${bin.name}) at ${bin.current_fill_percent}% capacity. Urgent municipal collection required.`,
        fill_percent: bin.current_fill_percent,
        resolved: false,
        data_source: bin.data_source,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      });
    } else if (bin.current_status === 'HIGH') {
      alerts.push({
        id: `ALT_${(alertSeq++).toString().padStart(4, '0')}`,
        bin_id: bin.bin_id,
        alert_type: 'HIGH',
        severity: 'WARNING',
        message: `${bin.data_source === 'REAL' ? '⚠️ [REAL HARDWARE]' : '⚠️'} ${bin.bin_id} (${bin.name}) at ${bin.current_fill_percent}% capacity. Nearing critical threshold.`,
        fill_percent: bin.current_fill_percent,
        resolved: false,
        data_source: bin.data_source,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      });
    }
  });

  return alerts;
}

export const INITIAL_WORKERS: Worker[] = [
  {
    id: 'WRK_001',
    name: 'Ramesh Shinde',
    ward: 'Ward 05',
    phone: '+91 98221 44510',
    status: 'BUSY',
    tasks_completed_today: 4,
    active_task_id: 'TSK_001',
    rating: 4.85,
  },
  {
    id: 'WRK_002',
    name: 'Suresh Patil',
    ward: 'Ward 02',
    phone: '+91 98221 88721',
    status: 'ON_DUTY',
    tasks_completed_today: 6,
    rating: 4.90,
  },
  {
    id: 'WRK_003',
    name: 'Anil Jadhav',
    ward: 'Ward 04',
    phone: '+91 98223 11290',
    status: 'BUSY',
    tasks_completed_today: 3,
    active_task_id: 'TSK_002',
    rating: 4.70,
  },
  {
    id: 'WRK_004',
    name: 'Santosh Kamble',
    ward: 'Ward 08',
    phone: '+91 98224 55678',
    status: 'ON_DUTY',
    tasks_completed_today: 5,
    rating: 4.80,
  },
  {
    id: 'WRK_005',
    name: 'Ganesh More',
    ward: 'Ward 03',
    phone: '+91 98225 99012',
    status: 'ON_BREAK',
    tasks_completed_today: 2,
    rating: 4.65,
  },
];

export const INITIAL_SUPERVISORS: Supervisor[] = [
  {
    id: 'SUP_001',
    name: 'Vijay Deshmukh',
    ward: 'Ward 05',
    phone: '+91 94220 12345',
    pending_verifications: 2,
  },
  {
    id: 'SUP_002',
    name: 'Prakash Kulkarni',
    ward: 'Ward 02',
    phone: '+91 94220 67890',
    pending_verifications: 1,
  },
  {
    id: 'SUP_003',
    name: 'Mahesh Joshi',
    ward: 'Ward 04',
    phone: '+91 94220 54321',
    pending_verifications: 3,
  },
];

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'REP_001',
    bin_id: 'BIN_001',
    citizen_name: 'Pooja Sharma',
    citizen_phone: '+91 98810 22334',
    ward: 'Ward 05',
    area: 'Shivajinagar Market Main Gate',
    issue: 'Overflowing dustbin',
    description: 'Fruit market waste spilling onto pedestrian footpath outside main entry gate.',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    latitude: 18.5312,
    longitude: 73.8446,
    status: 'ASSIGNED',
    priority: 'CRITICAL',
    assigned_worker_id: 'WRK_001',
    assigned_worker_name: 'Ramesh Shinde',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'REP_002',
    citizen_name: 'Amit Verma',
    citizen_phone: '+91 98811 44556',
    ward: 'Ward 02',
    area: 'FC Road near Goodluck Chowk',
    issue: 'Garbage around dustbin',
    description: 'Plastic packaging and beverage cups scattered across sidewalk.',
    photo_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
    latitude: 18.5248,
    longitude: 73.8418,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigned_worker_id: 'WRK_002',
    assigned_worker_name: 'Suresh Patil',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const INITIAL_TASKS: CollectionTask[] = [
  {
    id: 'TSK_001',
    bin_id: 'BIN_001',
    report_id: 'REP_001',
    task_type: 'BIN_CLEARANCE',
    title: 'Urgent Clearance: Shivajinagar Market Main Gate (BIN_001)',
    ward: 'Ward 05',
    location: 'Shivajinagar Market, Ward 05',
    priority: 'CRITICAL',
    assigned_worker_id: 'WRK_001',
    assigned_worker_name: 'Ramesh Shinde',
    status: 'IN_PROGRESS',
    before_fill_percent: 93,
    deadline: new Date(Date.now() + 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    started_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'TSK_002',
    bin_id: 'BIN_005',
    task_type: 'BIN_CLEARANCE',
    title: 'Clear Station Forecourt: Pune Central (BIN_005)',
    ward: 'Ward 03',
    location: 'Railway Station Plaza, Ward 03',
    priority: 'CRITICAL',
    assigned_worker_id: 'WRK_005',
    assigned_worker_name: 'Ganesh More',
    status: 'ASSIGNED',
    before_fill_percent: 92,
    deadline: new Date(Date.now() + 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'TSK_003',
    bin_id: 'BIN_003',
    task_type: 'BIN_CLEARANCE',
    title: 'High Capacity Pickup: Deccan Bus Terminal (BIN_003)',
    ward: 'Ward 04',
    location: 'Deccan Gymkhana Stop, Ward 04',
    priority: 'HIGH',
    assigned_worker_id: 'WRK_003',
    assigned_worker_name: 'Anil Jadhav',
    status: 'ASSIGNED',
    before_fill_percent: 87,
    deadline: new Date(Date.now() + 3600000 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'TSK_004',
    bin_id: 'BIN_002',
    task_type: 'BIN_CLEARANCE',
    title: 'Completed Collection: FC Road Promenade (BIN_002)',
    ward: 'Ward 02',
    location: 'Fergusson College Road, Ward 02',
    priority: 'LOW',
    assigned_worker_id: 'WRK_002',
    assigned_worker_name: 'Suresh Patil',
    status: 'COMPLETED',
    before_fill_percent: 85,
    after_fill_percent: 12,
    completion_photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    notes: 'Collected 180kg dry and wet waste. Bin emptied and sensor cleaned.',
    deadline: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    started_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR_001',
    username: 'admin',
    name: 'Chief Municipal Officer (Admin)',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // sha256 of 'admin123'
    role: 'ADMIN',
    created_at: new Date().toISOString(),
  },
  {
    id: 'USR_002',
    username: 'operator',
    name: 'Command Center Dispatcher',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // sha256 of 'admin123'
    role: 'OPERATOR',
    created_at: new Date().toISOString(),
  },
  {
    id: 'USR_003',
    username: 'supervisor',
    name: 'Vijay Deshmukh (Ward 05 Supervisor)',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // sha256 of 'admin123'
    role: 'SUPERVISOR',
    assigned_ward: 'Ward 05',
    supervisor_id: 'SUP_001',
    created_at: new Date().toISOString(),
  },
  {
    id: 'USR_004',
    username: 'worker',
    name: 'Ramesh Shinde (Sanitation Crew)',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // sha256 of 'admin123'
    role: 'WORKER',
    assigned_ward: 'Ward 05',
    worker_id: 'WRK_001',
    created_at: new Date().toISOString(),
  },
  {
    id: 'USR_005',
    username: 'citizen',
    name: 'Pooja Sharma (Citizen)',
    password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // sha256 of 'admin123'
    role: 'CITIZEN',
    assigned_ward: 'Ward 05',
    created_at: new Date().toISOString(),
  },
];
