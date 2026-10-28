/**
 * ============================================================================
 * SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
 * VIRTUAL HARDWARE NODE SIMULATOR (FOR USE WHEN PHYSICAL BOARDS ARE ABSENT)
 * ============================================================================
 *
 * This utility acts as 5 physical Arduino UNO + ESP8266 + HC-SR04 microcontrollers.
 * It sends periodic HTTP POST telemetry packets with valid X-API-Key credentials to:
 *   POST http://localhost:5000/api/v1/bins/telemetry
 *
 * Usage:
 *   npm run virtual-hardware
 */

const API_ENDPOINT = process.env.VITE_API_URL || 'http://localhost:5000/api/v1/bins/telemetry';

const REAL_DEVICES = [
  { bin_id: 'BIN_001', key: 'KEY_BIN_001_SECRET_9871', baseDistance: 6.8, name: 'Shivajinagar Market' },
  { bin_id: 'BIN_002', key: 'KEY_BIN_002_SECRET_5422', baseDistance: 18.5, name: 'FC Road Promenade' },
  { bin_id: 'BIN_003', key: 'KEY_BIN_003_SECRET_3319', baseDistance: 8.2, name: 'Deccan Gymkhana Stop' },
  { bin_id: 'BIN_004', key: 'KEY_BIN_004_SECRET_7741', baseDistance: 13.5, name: 'Swargate Metro Plaza' },
  { bin_id: 'BIN_005', key: 'KEY_BIN_005_SECRET_1120', baseDistance: 7.1, name: 'Pune Station Plaza' },
];

function calculateFill(distanceCm: number): number {
  // Formula: ((30 - dist) / 25) * 100
  const raw = ((30.0 - distanceCm) / 25.0) * 100.0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function determineStatus(fill: number): string {
  if (fill >= 90) return 'FULL';
  if (fill >= 80) return 'HIGH';
  if (fill >= 50) return 'MEDIUM';
  return 'LOW';
}

console.log('================================================================');
console.log(' [VIRTUAL HARDWARE EMULATOR] Starting 5 Physical Microcontrollers');
console.log(' Emulating: Arduino UNO + ESP32-CAM + HC-SR04 Ultrasonic Sensors');
console.log(` Target Endpoint: ${API_ENDPOINT}`);
console.log('================================================================');

async function sendTelemetryForDevice(device: typeof REAL_DEVICES[0]) {
  // Add small natural sensor jitter (+/- 0.3 cm)
  const jitter = (Math.random() - 0.5) * 0.6;
  const currentDistance = Number(Math.max(5.0, Math.min(30.0, device.baseDistance + jitter)).toFixed(1));
  const fill = calculateFill(currentDistance);
  const status = determineStatus(fill);

  const payload = {
    bin_id: device.bin_id,
    distance_cm: currentDistance,
    fill_percent: fill,
    status: status,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': device.key,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(
        `✓ [${device.bin_id}] Telemetry OK: Dist=${currentDistance}cm | Fill=${fill}% (${status}) | Key Verified`
      );
    } else {
      const errText = await response.text();
      console.warn(`✗ [${device.bin_id}] Server returned HTTP ${response.status}: ${errText}`);
    }
  } catch (err: any) {
    console.error(`✗ [${device.bin_id}] Connection error: ${err.message}. Is backend server running on port 5000?`);
  }
}

// Send initial burst to mark all 5 online immediately
async function runLoop() {
  for (const device of REAL_DEVICES) {
    await sendTelemetryForDevice(device);
  }

  // Periodic heartbeat transmissions every 12 seconds
  setInterval(async () => {
    // Pick one or two devices to send updates each cycle (simulating staggered physical Wi-Fi transmissions)
    const randomDevice = REAL_DEVICES[Math.floor(Math.random() * REAL_DEVICES.length)];
    await sendTelemetryForDevice(randomDevice);
  }, 12000);
}

runLoop();
