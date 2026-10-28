---
name: smart-dustbin-platform
description: Develops and maintains the Smart Municipal Dustbin Monitoring Platform. Enforces IoT telemetry rules, Arduino/ESP8266 hardware specs, backend APIs, PostgreSQL database, Leaflet GIS maps, heatmaps, analytics, alerts, demo simulation, and the mandatory premium purple UI design system.
---

# Smart Municipal Dustbin Platform Skill

## Mission

Maintain and develop the Smart Municipal Dustbin Monitoring Platform according to the project's master development specification.
This is a production-quality, IoT-ready municipal waste-management command center connecting physical microcontrollers (Arduino UNO + ESP8266 + HC-SR04) with cloud APIs, PostgreSQL storage, GIS mapping, analytics, and alert workflows.

---

## 1. Mandatory IoT Architecture

```
HC-SR04 Ultrasonic Sensor
       ↓
  Arduino UNO (Local Controller: measurement, LCD 16x2, status computation)
       ↓ (SoftwareSerial / Voltage Divider: 1kΩ + 1kΩ)
    ESP8266 (Wi-Fi Communication Module)
       ↓ (Wi-Fi HTTP POST with X-API-Key)
   Backend API (Node.js/TypeScript / Fastify / Express)
       ↓
Database (PostgreSQL: bins, telemetry, alerts, users, device_credentials)
       ↓
Municipal Dashboard (React + Leaflet GIS + Heatmap + Analytics + Alerts)
```

- **Arduino UNO**: Measures raw distance from HC-SR04, computes fill percentage and status, updates local 16x2 I2C LCD, transmits serial packet to ESP8266.
- **ESP8266**: Network communication module. Transmits JSON telemetry to `POST /api/v1/bins/telemetry`.
- **Frontend Isolation**: Frontend NEVER communicates directly with Arduino. All data flows through the authenticated backend API and database.

---

## 2. Hardware Wiring & Pinout Rules

- **HC-SR04**:
  - VCC → Arduino 5V
  - GND → Arduino GND
  - TRIG → Arduino D7
  - ECHO → Arduino D6
- **16x2 I2C LCD**:
  - VCC → Arduino 5V
  - GND → Arduino GND
  - SDA → Arduino A4
  - SCL → Arduino A5
- **Arduino → ESP8266 Serial Level Shifting**:
  - Arduino D11 (TX) → 1kΩ resistor → Junction → ESP8266 RX (GPIO3 or D9)
  - Junction → 1kΩ resistor → GND (50% voltage divider steps 5V down to 2.5V, safe for ESP8266 3.3V logic)
  - Arduino D10 (RX) ← ESP8266 TX (GPIO1) (Direct connection, 3.3V is recognized as HIGH by Arduino 5V logic)
  - Arduino GND ↔ ESP8266 GND (Common Ground is mandatory)
  - Power: ESP8266 uses USB power during prototyping. Never connect 5V directly to ESP8266 3.3V pin.

---

## 3. Sensor & Calibration Rules

- **EMPTY_DISTANCE**: 30 cm
- **FULL_DISTANCE**: 5 cm
- **Formula**:
  $$\text{fill\_percent} = \frac{\text{EMPTY\_DISTANCE} - \text{distance\_cm}}{\text{EMPTY\_DISTANCE} - \text{FULL\_DISTANCE}} \times 100$$
- **Clamping**: Clamped strictly to `[0, 100]%`.
- **Status Thresholds**:
  - `0 – 49%`: **LOW**
  - `50 – 79%`: **MEDIUM**
  - `80 – 89%`: **HIGH**
  - `90 – 100%`: **FULL**
- The backend must validate incoming distances and re-verify fill percentage and status.

---

## 4. Device Identity & Strict Isolation Rules

### The Five Real Devices
- Identifiers: `BIN_001`, `BIN_002`, `BIN_003`, `BIN_004`, `BIN_005`
- `data_source = 'REAL'`
- Each real device has a unique `device_key` stored in `device_credentials`.
- Authenticated via header `X-API-Key: <DEVICE_KEY>`.

### The Demo Dustbins
- Identifiers: `BIN_DEMO_001` through `BIN_DEMO_050` (or `BIN_DEMO_100`).
- `data_source = 'DEMO'`
- Realistic municipal distribution across Wards and Zones.

### Isolation Invariant
- **CRITICAL**: When `BIN_001` sends telemetry, **ONLY** `BIN_001` is updated in the database and state.
- When `BIN_003` sends telemetry, **ONLY** `BIN_003` is updated.
- The demo simulator must **NEVER** modify `data_source = 'REAL'` records under any circumstances.
- Never use IP addresses, latitude/longitude, or sensor readings as primary device identities.

---

## 5. Backend & API Rules

- Base route: `/api/v1`
- Telemetry endpoint: `POST /api/v1/bins/telemetry`
  - Validates `X-API-Key` against `device_credentials`.
  - Validates `bin_id` exists and is authorized for that key.
  - Validates payload numbers (`distance_cm`, `fill_percent`).
  - Updates bin current state (`current_distance_cm`, `current_fill_percent`, `current_status`, `online = true`, `last_seen = now()`).
  - Appends record to `telemetry` table.
  - Evaluates alert thresholds (creates `FULL` alert if $\ge 90\%$, `HIGH` alert if $80-89\%$).
- Offline detection logic:
  - `last_seen < 5 min`: **ONLINE**
  - `5 min <= last_seen <= 15 min`: **WARNING**
  - `last_seen > 15 min`: **OFFLINE**
- Collection Priority ordering:
  - First by status: `FULL` → `HIGH` → `MEDIUM` → `LOW`
  - Secondary by `current_fill_percent` descending.

---

## 6. Database Schema Rules (PostgreSQL)

Tables required:
1. `bins`:
   - `bin_id` (VARCHAR PK)
   - `name` (VARCHAR)
   - `latitude` (DOUBLE PRECISION)
   - `longitude` (DOUBLE PRECISION)
   - `location` (VARCHAR)
   - `ward` (VARCHAR)
   - `zone` (VARCHAR)
   - `current_distance_cm` (NUMERIC)
   - `current_fill_percent` (NUMERIC)
   - `current_status` (VARCHAR)
   - `online` (BOOLEAN)
   - `last_seen` (TIMESTAMP)
   - `data_source` (VARCHAR: 'REAL' | 'DEMO')
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)
2. `telemetry`:
   - `id` (BIGSERIAL / UUID PK)
   - `bin_id` (FK bins.bin_id)
   - `distance_cm` (NUMERIC)
   - `fill_percent` (NUMERIC)
   - `status` (VARCHAR)
   - `data_source` (VARCHAR)
   - `recorded_at` (TIMESTAMP)
3. `alerts`:
   - `id` (BIGSERIAL / UUID PK)
   - `bin_id` (FK bins.bin_id)
   - `alert_type` (VARCHAR: 'FULL' | 'HIGH' | 'OFFLINE')
   - `severity` (VARCHAR: 'CRITICAL' | 'WARNING' | 'INFO')
   - `message` (TEXT)
   - `resolved` (BOOLEAN)
   - `created_at` (TIMESTAMP)
4. `device_credentials`:
   - `bin_id` (FK bins.bin_id PK)
   - `api_key_hash` (VARCHAR)
   - `created_at` (TIMESTAMP)
5. `users`:
   - `id` (UUID PK), `username`, `password_hash`, `role`, `created_at`

Indexes:
- `bin_id`, `status`, `last_seen`, `latitude`, `longitude`, `data_source`, `recorded_at`.

---

## 7. Mandatory UI Design System & Tokens

The application must feel: **premium, elegant, calm, modern, intelligent, responsive, easy to use**.
Predominantly white/light neutral surfaces with dark readable typography.
Do **NOT** make the application overwhelmingly purple. Purple is reserved for:
- Primary actions
- Active states
- Focus rings
- Selected elements
- Important highlights
- Progress indicators
- Intelligent features

### Centralized Tokens:
- `--color-primary`: `#7C5CDB`
- `--color-primary-hover`: `#6F4FC8`
- `--color-primary-dark`: `#6042B8`
- `--color-primary-soft`: `#F1EDFF`
- Background: `#F8F9FC` or `#FFFFFF`
- Surface: `#FFFFFF`
- Border: `#E2E8F0` / `#EDE9FE`
- Status colors:
  - FULL / Critical: `#DC2626` (Red)
  - HIGH: `#EA580C` (Orange)
  - MEDIUM: `#D97706` (Amber)
  - LOW: `#16A34A` (Green)
  - OFFLINE: `#64748B` (Slate)
- Motion easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Input height: `42–48px`
- Form fields: Clear labels, inline validation, subtle purple focus rings.
- Accessibility: Never communicate status via color alone; always pair with icons and readable text badges.

---

## 8. GIS & Heatmap Specifications

- Interactive Leaflet map with configurable tile provider (default: OpenStreetMap, production: MapTiler/Mapbox).
- Marker states: LOW, MEDIUM, HIGH, FULL, OFFLINE with icons + labels.
- Selected marker: purple visual treatment (`#7C5CDB` halo/glow).
- Popup details: BIN ID, Location, Ward/Zone, Fill %, Distance cm, Status, Online State, Last Seen, Data Source.
- Heatmap layer: Intensity driven by `fill_percent`. Filters for `REAL`, `DEMO`, and `ALL`. Real bins actively contribute to geographic heat.

---

## 9. Testing & Quality Assurance

- Critical Regression Test: Sending `BIN_001` telemetry modifies **only** `BIN_001`. Sending `BIN_003` modifies **only** `BIN_003`.
- Demo simulation advances realistic numbers (e.g. 60 → 63 → 67; after collection 97 → 15) and **never** alters REAL bins.
- Offline detector triggers when `last_seen` exceeds 15 minutes.
- Sensor formula clamping is strictly enforced.
