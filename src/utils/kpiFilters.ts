import { Bin } from '../types';

export type KpiFilterType = 'all' | 'online' | 'offline' | 'full' | 'high' | 'real';

export interface KpiMeta {
  type: KpiFilterType;
  title: string;
  description: string;
  cardLabel: string;
  supportingText: string;
}

export const KPI_METAS: Record<KpiFilterType, KpiMeta> = {
  all: {
    type: 'all',
    title: 'Total Bins',
    description: 'All registered dustbins in the system',
    cardLabel: 'TOTAL BINS',
    supportingText: '5 Real + 60 Demo',
  },
  online: {
    type: 'online',
    title: 'Online Bins',
    description: 'Bins with recent data (< 5 minutes)',
    cardLabel: 'ONLINE',
    supportingText: '< 5 min heartbeats',
  },
  offline: {
    type: 'offline',
    title: 'Offline Bins',
    description: 'Bins inactive for more than 15 minutes',
    cardLabel: 'OFFLINE',
    supportingText: '> 15 min inactive',
  },
  full: {
    type: 'full',
    title: 'Full Bins (≥ 90%)',
    description: 'Bins requiring urgent collection',
    cardLabel: 'FULL BINS ( ≥ 90% )',
    supportingText: 'Urgent pickup',
  },
  high: {
    type: 'high',
    title: 'High Bins (80 - 89%)',
    description: 'Bins with elevated fill level',
    cardLabel: 'HIGH BINS ( 80 - 89% )',
    supportingText: 'Elevated fill',
  },
  real: {
    type: 'real',
    title: 'Real Devices',
    description: 'Physical IoT devices (BIN_001 - 005)',
    cardLabel: 'REAL DEVICES',
    supportingText: 'BIN_001 ... BIN_005',
  },
};

/**
 * Single source of truth for filtering bins across both
 * Dashboard KPI cards and the 6 filtered bin-list views.
 */
export function filterBinsByKpi(bins: Bin[], filterType: KpiFilterType): Bin[] {
  switch (filterType) {
    case 'online':
      return bins.filter((b) => b.connection_state === 'ONLINE' || (b.connection_state !== 'OFFLINE' && b.online));
    case 'offline':
      return bins.filter((b) => b.connection_state === 'OFFLINE' || (!b.online && b.connection_state !== 'ONLINE'));
    case 'full':
      return bins.filter((b) => b.current_fill_percent >= 90);
    case 'high':
      return bins.filter((b) => b.current_fill_percent >= 80 && b.current_fill_percent < 90);
    case 'real':
      return bins.filter((b) => b.data_source === 'REAL');
    case 'all':
    default:
      return bins;
  }
}
