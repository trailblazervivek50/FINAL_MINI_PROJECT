# SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
## SYSTEM ARCHITECTURE DOCUMENTATION

---

## 1. System Topology Overview

The Smart Municipal Dustbin Monitoring Platform connects edge physical sensors to a centralized cloud GIS command center:

```
[HC-SR04 Ultrasonic Sensor]
             │ (Echo / Trigger)
             ▼
      [Arduino UNO]
   ┌─────────┴────────────────────────┐
   │ 1. Raw Distance Measurement      │
   │ 2. Fill Percentage Calculation   │
   │ 3. Status Level Categorization   │
   │ 4. 16x2 I2C LCD Display          │
   └─────────┬────────────────────────┘
             │ SoftwareSerial (D11 TX & D10 RX)
             │ 1kΩ / 1kΩ Voltage Divider (5V -> 2.5V safe logic)
             ▼
        [ESP8266]
   ┌─────────┴────────────────────────┐
   │ 1. Network Gateway Engine        │
   │ 2. Wi-Fi Auto-Reconnection       │
   │ 3. Authenticated HTTP POST       │
   │    Header: X-API-Key: DEVICE_KEY │
   └─────────┬────────────────────────┘
             │ Wi-Fi / HTTPS
             ▼
    [Municipal API Gateway] (Node.js / Express / Fastify)
   ┌─────────┴────────────────────────┐
   │ 1. Device Authentication Guard   │
   │ 2. Payload Validation & Clamping │
   │ 3. BIN_ID Isolation Enforcer     │
   │ 4. Alert Threshold Engine        │
   │ 5. SSE Broadcaster               │
   └─────────┬────────────────────────┘
             │ SQL / Pool
             ▼
    [PostgreSQL Storage Engine]
   ┌──────────────────────────────────┐
   │ - bins (Master Inventory)        │
   │ - telemetry (Historical Series)  │
   │ - alerts (Incident Records)      │
   │ - device_credentials (Keys)      │
   │ - users (Operator Credentials)   │
   └─────────┬────────────────────────┘
             │ REST + Server-Sent Events (SSE)
             ▼
    [Municipal Command Center]
   ┌──────────────────────────────────┐
   │ - Leaflet GIS Interactive Map    │
   │ - Waste Accumulation Heatmap     │
   │ - Priority Dispatch Queue        │
   │ - Longitudinal Analytics (24h)   │
   │ - Demo Simulation Controller     │
   └──────────────────────────────────┘
```

---

## 2. Microcontroller Partitioning & Roles

### 2.1 Arduino UNO (Local Real-Time Controller)
The Arduino UNO handles deterministic sensor timing and physical human interface:
- **HC-SR04 Ultrasonic Sampling**: Measures trigger pulse and echoes in microseconds. Calculates distance with formula:
  $$\text{distance\_cm} = \frac{\text{duration} \times 0.0343}{2}$$
- **Physics Calibration**:
  $$\text{EMPTY\_DISTANCE} = 30.0\text{ cm},\quad \text{FULL\_DISTANCE} = 5.0\text{ cm}$$
  $$\text{fill\_percent} = \left(\frac{30.0 - \text{distance\_cm}}{30.0 - 5.0}\right) \times 100$$
  Clamped strictly to $[0, 100]\%$.
- **Status Classification**:
  - $0 - 49\%$: `LOW`
  - $50 - 79\%$: `MEDIUM`
  - $80 - 89\%$: `HIGH`
  - $90 - 100\%$: `FULL`
- **16x2 I2C LCD Display**:
  - Line 1: `BIN_001 [ 93%]`
  - Line 2: `D: 6.8cm  FULL`
- **Serial Transmission**: Sends formatted packet lines over SoftwareSerial to the ESP8266.

### 2.2 ESP8266 (Network Communications Gateway)
The ESP8266 handles Wi-Fi connectivity and cloud transport:
- Never handles ultrasonic measurement directly; avoids ESP8266 timing jitter caused by Wi-Fi background interrupts.
- Maintains persistent Wi-Fi connectivity.
- Reads telemetry packets from Arduino UNO, parses identity, and transmits authenticated HTTP POST requests to `/api/v1/bins/telemetry`.
- Transmits header `X-API-Key: DEVICE_KEY`.

---

## 3. Data Isolation Architecture

### 3.1 Logical Identity Principle
The system enforces **BIN_ID** as the permanent, immutable device identity:
- Never relies on IP address, dynamic DHCP lease, latitude/longitude, or sensor readings as identity.
- When `BIN_001` transmits telemetry, the database update is scoped strictly:
  ```sql
  UPDATE bins SET ... WHERE bin_id = 'BIN_001';
  ```
  Updating `BIN_001` leaves `BIN_002`, `BIN_003`, `BIN_004`, `BIN_005`, and all demo bins completely untouched.

### 3.2 Real vs Demo Data Isolation
- **Real Devices**: `data_source = 'REAL'`. Only 5 provisioned identities: `BIN_001`, `BIN_002`, `BIN_003`, `BIN_004`, `BIN_005`.
- **Demo Devices**: `data_source = 'DEMO'`. 60 provisioned identities: `BIN_DEMO_001` through `BIN_DEMO_060`.
- **Demo Simulator Isolation Guarantee**: The demo simulator queries `WHERE data_source = 'DEMO'`. It contains a security assertion that aborts immediately if any ID starts with `BIN_00` or has `data_source === 'REAL'`. Under zero circumstances can simulated values overwrite physical hardware records.

---

## 4. Database Schema & Indexing (PostgreSQL)

The database schema utilizes relational modeling with targeted B-tree indexes for GIS spatial queries and time-series rollups:

```sql
-- Master Dustbin Inventory
CREATE TABLE bins (
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

-- Historical Telemetry Time Series
CREATE TABLE telemetry (
    id VARCHAR(64) PRIMARY KEY,
    bin_id VARCHAR(64) NOT NULL REFERENCES bins(bin_id) ON DELETE CASCADE,
    distance_cm NUMERIC(6, 2) NOT NULL,
    fill_percent NUMERIC(5, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    data_source VARCHAR(16) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Operational Incident Alerts
CREATE TABLE alerts (
    id VARCHAR(64) PRIMARY KEY,
    bin_id VARCHAR(64) NOT NULL REFERENCES bins(bin_id) ON DELETE CASCADE,
    alert_type VARCHAR(32) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    fill_percent NUMERIC(5, 2),
    resolved BOOLEAN NOT NULL DEFAULT false,
    data_source VARCHAR(16) NOT NULL DEFAULT 'DEMO',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);
```

### Strategic Indexes:
- `idx_bins_bin_id` on `bins(bin_id)`: $O(1)$ point lookups.
- `idx_bins_lat_lng` on `bins(latitude, longitude)`: Geospatial bounding-box queries.
- `idx_bins_status` and `idx_bins_data_source`: Accelerated catalog filtering.
- `idx_telemetry_bin_id` and `idx_telemetry_recorded_at`: Rapid time-series chart rendering.

---

## 5. Offline Detection Engine

Connection states are evaluated dynamically from `last_seen` timestamps:
- **ONLINE**: $\text{elapsed} < 5\text{ minutes}$. Node is communicating on expected interval.
- **WARNING**: $5\text{ minutes} \le \text{elapsed} \le 15\text{ minutes}$. Node has missed multiple transmission cycles.
- **OFFLINE**: $\text{elapsed} > 15\text{ minutes}$. Node is marked offline; triggers operator maintenance check.

---

## 6. Scalability Architecture: 5 &rarr; 50 &rarr; 500 &rarr; 5,000 &rarr; 50,000+

The system was intentionally designed from day one to scale without structural redesign:

1. **Edge Offloading**: Sensor physics, clamping, and status computation occur at the edge on the Arduino UNO. The cloud ingestion server receives pre-validated numbers rather than raw ultrasonic waveforms.
2. **Stateless Telemetry Ingestion**: The `/api/v1/bins/telemetry` endpoint is completely stateless. Multiple instances can sit behind an NGINX or AWS ALB load balancer.
3. **Database Sharding & Partitioning**:
   - For scale $\ge 5,000$ devices, the `telemetry` table is partitioned by month using PostgreSQL declarative partitioning:
     ```sql
     CREATE TABLE telemetry_2026_10 PARTITION OF telemetry
     FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
     ```
   - Historical time-series can be retained in TimescaleDB or cold-stored in Parquet files on S3.
4. **Message Broker Evolution (MQTT)**:
   - For $\ge 50,000$ devices, the HTTP POST transport is supplemented with an MQTT broker (EMQX / Eclipse Mosquitto).
   - ESP8266 publishes to topic `muni/bins/BIN_001/telemetry`.
   - Node.js subscriber worker ingests messages to PostgreSQL using batch inserts.
