export function formatTimestamp(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return '12:42:18';
  }
  return d.toTimeString().split(' ')[0];
}

export function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return 'Just now';
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export function formatDistance(cm: number): string {
  return `${cm.toFixed(1)} cm`;
}

export function formatPercentage(pct: number): string {
  return `${Math.round(pct)}%`;
}
