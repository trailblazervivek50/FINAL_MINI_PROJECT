# SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
## REST API & SSE STREAM SPECIFICATION

Base URL: `http://localhost:5000/api/v1`

---

## 1. Hardware Telemetry Ingestion

### `POST /api/v1/bins/telemetry`
Ingests real-time sensor measurement from physical microcontrollers (ESP32-CAM) or automated systems.

#### Headers:
| Header | Type | Description |
|---|---|---|
| `Content-Type` | `string` | Must be `application/json` |
| `X-API-Key` | `string` | Provisioned secret device key (Mandatory for `REAL` devices) |

#### Request Payload:
```json
{
  "bin_id": "BIN_001",
  "distance_cm": 6.8,
  "fill_percent": 93,
  "status": "FULL"
}
```

#### Field Rules:
- `bin_id`: Permanent logical identity (e.g. `BIN_001` .. `BIN_005`).
- `distance_cm`: Non-negative decimal representing ultrasonic distance to garbage.
- `fill_percent` (optional): Client computed fill percentage. Server re-verifies and clamps to $[0, 100]\%$.
- `status` (optional): `LOW` | `MEDIUM` | `HIGH` | `FULL`. Recalculated by server based on canonical calibration.

#### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Telemetry ingested successfully",
  "data": {
    "bin_id": "BIN_001",
    "name": "Shivajinagar Market Main Gate",
    "latitude": 18.5312,
    "longitude": 73.8446,
    "location": "Shivajinagar Market, Ward 05",
    "ward": "Ward 05",
    "zone": "Central Zone",
    "current_distance_cm": 6.8,
    "current_fill_percent": 93,
    "current_status": "FULL",
    "online": true,
    "last_seen": "2026-10-09T10:15:20.123Z",
    "data_source": "REAL"
  }
}
```

---

## 2. Dustbins Management

### `GET /api/v1/bins`
Query parameters: `dataSource` (`REAL` | `DEMO` | `ALL`), `status`, `ward`, `zone`, `search`.

### `POST /api/v1/bins`
Registers a new physical or simulated dustbin.
```json
{
  "bin_id": "BIN_006",
  "name": "Aundh Commercial Center",
  "latitude": 18.5580,
  "longitude": 73.8075,
  "location": "Aundh Road, Ward 02",
  "ward": "Ward 02",
  "zone": "West Zone",
  "data_source": "REAL",
  "device_key": "REAL_DEVICE_KEY_006"
}
```

### `GET /api/v1/bins/:id`
Retrieves dustbin details, online state, and recent 24-point telemetry curve.

### `PATCH /api/v1/bins/:id`
Updates location, name, ward, or coordinates.

### `GET /api/v1/bins/:id/history?limit=50`
Retrieves timestamped telemetry time-series for analytics charts.

---

## 3. Citizen Garbage Reporting

### `GET /api/v1/reports`
Filters: `ward`, `status` (`SUBMITTED` | `UNDER_REVIEW` | `ASSIGNED` | `IN_PROGRESS` | `RESOLVED` | `REJECTED`), `citizenPhone`.

### `POST /api/v1/reports`
Submits a citizen waste report with optional geotagged photo.
```json
{
  "bin_id": "BIN_001",
  "citizen_name": "Pooja Deshmukh",
  "citizen_phone": "+91 98220 99887",
  "ward": "Ward 05",
  "area": "Shivajinagar Market",
  "issue": "Overflowing dustbin",
  "description": "Bin lid broken and garbage spilling onto walkway.",
  "photo_url": "https://example.com/uploads/proof_123.jpg",
  "latitude": 18.5314,
  "longitude": 73.8446
}
```

### `PATCH /api/v1/reports/:id/status`
Updates lifecycle status and optionally dispatches to a sanitation worker.
```json
{
  "status": "ASSIGNED",
  "assigned_worker_id": "WRK_001",
  "resolution_notes": "Assigned to Ward 05 sanitation crew."
}
```

---

## 4. Municipal Collection Tasks

### `GET /api/v1/tasks`
Filters: `ward`, `status` (`ASSIGNED` | `ACCEPTED` | `IN_PROGRESS` | `COMPLETED` | `VERIFIED`), `worker_id`, `priority`, `bin_id`.

### `POST /api/v1/tasks`
Manually dispatches a sanitation task. (Note: $\ge 90\%$ full bins are auto-dispatched).
```json
{
  "bin_id": "BIN_002",
  "task_type": "BIN_CLEARANCE",
  "title": "Clear FC Road Promenade Bin",
  "ward": "Ward 05",
  "location": "FC Road Promenade",
  "priority": "HIGH",
  "assigned_worker_id": "WRK_002"
}
```

### `PATCH /api/v1/tasks/:id/status`
Worker moves task from `ASSIGNED` &rarr; `ACCEPTED` &rarr; `IN_PROGRESS`.

### `POST /api/v1/tasks/:id/complete`
Worker marks task completed with after-clearance fill % and photo proof.
```json
{
  "completion_photo": "https://example.com/uploads/after_clear.jpg",
  "after_fill_percent": 10,
  "notes": "Cleared receptacle and disinfected perimeter."
}
```

### `POST /api/v1/tasks/:id/verify`
Supervisor verifies task quality and signs off or rejects.
```json
{
  "approved": true,
  "supervisor_id": "SUP_001",
  "notes": "Verified clean via photographic evidence."
}
```

---

## 5. Field Personnel & Staff

### `GET /api/v1/workers`
Returns sanitation workers with duty status (`ON_DUTY`, `ON_BREAK`, `BUSY`) and daily task counts.

### `PATCH /api/v1/workers/:id`
Updates worker duty state or rating.

### `GET /api/v1/supervisors`
Returns ward supervisors and pending verification counts.

---

## 6. Photo & Evidence Upload

### `POST /api/v1/upload/image`
Uploads base64 or multipart image to local secure storage.
```json
{
  "image_data": "data:image/jpeg;base64,...",
  "file_name": "evidence.jpg"
}
```
Response:
```json
{
  "success": true,
  "url": "/uploads/proof_1728469200000_123.jpg"
}
```

---

## 7. Operational Alerts & Priority Queue

### `GET /api/v1/alerts?resolved=false`
Returns active `CRITICAL` (FULL $\ge 90\%$) and `WARNING` (HIGH $80-89\%$) alerts.

### `POST /api/v1/alerts/:id/resolve`
Marks alert resolved.

### `GET /api/v1/priority`
Returns collection queue ranked by:
1. Status weight (`FULL` > `HIGH` > `MEDIUM` > `LOW`)
2. Fill percentage descending.

---

## 8. Real-time Server-Sent Events (SSE) Stream

### `GET /api/v1/stream`
Permanent HTTP stream broadcasting events to dashboard clients:
- `bin_updated`: `{ bin: Bin, telemetry: TelemetryRecord }`
- `bin_created`: `Bin`
- `alert_created`: `Alert`
- `alert_resolved`: `{ id: string, bin_id: string }`
- `report_created`: `CitizenReport`
- `report_updated`: `CitizenReport`
- `task_created`: `CollectionTask`
- `task_updated`: `CollectionTask`
- `task_completed`: `CollectionTask`
- `task_verified`: `CollectionTask`
- `demo_step`: `{ timestamp: string, updatedCount: number }`
