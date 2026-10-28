import { BinStatus } from '../models/types';
import { config } from '../config';

export interface ValidatedTelemetry {
  bin_id: string;
  distance_cm: number;
  fill_percent: number;
  status: BinStatus;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: ValidatedTelemetry;
}

/**
 * Calculates fill percentage based on ultrasonic distance:
 * fill_percent = ((EMPTY_DISTANCE - distance_cm) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100
 * Clamped strictly to [0, 100]%
 */
export function calculateFillPercent(distanceCm: number): number {
  const { emptyDistanceCm, fullDistanceCm } = config;
  const raw = ((emptyDistanceCm - distanceCm) / (emptyDistanceCm - fullDistanceCm)) * 100.0;
  const clamped = Math.max(0, Math.min(100, Math.round(raw)));
  return clamped;
}

/**
 * Determines operational status level:
 * 0 - 49%   : LOW
 * 50 - 79%  : MEDIUM
 * 80 - 89%  : HIGH
 * 90 - 100% : FULL
 */
export function determineStatus(fillPercent: number): BinStatus {
  if (fillPercent >= 90) return 'FULL';
  if (fillPercent >= 80) return 'HIGH';
  if (fillPercent >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Validates incoming telemetry payload from hardware or simulator
 */
export function validateTelemetryPayload(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const { bin_id, distance_cm, fill_percent, status } = body;

  // 1. Validate bin_id
  if (!bin_id || typeof bin_id !== 'string' || bin_id.trim().length === 0) {
    return { isValid: false, error: 'Field "bin_id" is required and must be a non-empty string' };
  }

  const cleanBinId = bin_id.trim();

  // 2. Validate distance_cm
  if (distance_cm === undefined || distance_cm === null || typeof distance_cm !== 'number' || isNaN(distance_cm)) {
    return { isValid: false, error: 'Field "distance_cm" is required and must be a valid number' };
  }

  if (distance_cm < 0 || distance_cm > 500) {
    return { isValid: false, error: 'Field "distance_cm" is out of plausible physical range (0-500 cm)' };
  }

  const roundedDistance = Number(distance_cm.toFixed(1));

  // 3. Compute fill percentage:
  // If client (hardware) provided an explicit fill_percent, honor the hardware's calibration
  // (supports custom bin sizes e.g. 10cm desktop prototype vs 30cm standard bin).
  // Otherwise, compute canonically using server calibration.
  let finalFill: number;
  if (fill_percent !== undefined && fill_percent !== null && typeof fill_percent === 'number' && !isNaN(fill_percent)) {
    finalFill = Math.max(0, Math.min(100, Math.round(fill_percent)));
  } else {
    finalFill = calculateFillPercent(roundedDistance);
  }

  // 4. Compute status:
  // If client provided a valid status string, preserve it; otherwise canonically map from finalFill
  let finalStatus: BinStatus = determineStatus(finalFill);
  if (status && typeof status === 'string') {
    const candidate = status.trim().toUpperCase() as BinStatus;
    if (['LOW', 'MEDIUM', 'HIGH', 'FULL'].includes(candidate)) {
      finalStatus = candidate;
    }
  }

  return {
    isValid: true,
    data: {
      bin_id: cleanBinId,
      distance_cm: roundedDistance,
      fill_percent: finalFill,
      status: finalStatus,
    },
  };
}
