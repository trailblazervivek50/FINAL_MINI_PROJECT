import { StatusLevel } from '../types';

export interface FillThresholds {
  normalMax: number;
  moderateMax: number;
  highMax: number;
  criticalMin: number;
}

export const THRESHOLDS: FillThresholds = {
  normalMax: 50,
  moderateMax: 70,
  highMax: 85,
  criticalMin: 86,
};

export function getStatusFromFill(fillPercentage: number): StatusLevel {
  if (fillPercentage <= THRESHOLDS.normalMax) {
    return 'NORMAL';
  }
  if (fillPercentage <= THRESHOLDS.moderateMax) {
    return 'MODERATE';
  }
  if (fillPercentage <= THRESHOLDS.highMax) {
    return 'HIGH';
  }
  return 'CRITICAL';
}

export const STATUS_COLORS: Record<string, { text: string; bg: string; border: string; hex: string }> = {
  NORMAL: {
    text: 'text-[#5D7A62]',
    bg: 'bg-[#5D7A62]/10',
    border: 'border-[#5D7A62]/30',
    hex: '#5D7A62',
  },
  LOW: {
    text: 'text-[#5D7A62]',
    bg: 'bg-[#5D7A62]/10',
    border: 'border-[#5D7A62]/30',
    hex: '#5D7A62',
  },
  MODERATE: {
    text: 'text-[#7A8B58]',
    bg: 'bg-[#7A8B58]/10',
    border: 'border-[#7A8B58]/30',
    hex: '#7A8B58',
  },
  MEDIUM: {
    text: 'text-[#7A8B58]',
    bg: 'bg-[#7A8B58]/10',
    border: 'border-[#7A8B58]/30',
    hex: '#7A8B58',
  },
  HIGH: {
    text: 'text-[#B8892D]',
    bg: 'bg-[#B8892D]/10',
    border: 'border-[#B8892D]/30',
    hex: '#B8892D',
  },
  CRITICAL: {
    text: 'text-[#A63D40]',
    bg: 'bg-[#A63D40]/10',
    border: 'border-[#A63D40]/30',
    hex: '#A63D40',
  },
  FULL: {
    text: 'text-[#A63D40]',
    bg: 'bg-[#A63D40]/10',
    border: 'border-[#A63D40]/30',
    hex: '#A63D40',
  },
};

export const BIN_TOTAL_HEIGHT_CM = 100; // Reference height for ultrasonic sensor calculation
