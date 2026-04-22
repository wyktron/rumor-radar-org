import type { Rumor, RumorStatus } from '@/types';

export function intensityColor(intensity: number, status: RumorStatus): string {
  if (status === 'debunked') return 'hsl(var(--signal-debunked))';
  if (status === 'verified-true') return 'hsl(var(--signal-verified))';
  if (intensity < 0.25) return 'hsl(var(--signal-low))';
  if (intensity < 0.5) return 'hsl(var(--signal-moderate))';
  if (intensity < 0.75) return 'hsl(var(--signal-high))';
  return 'hsl(var(--signal-viral))';
}

export function intensityLabel(intensity: number): string {
  if (intensity < 0.25) return 'Low';
  if (intensity < 0.5) return 'Moderate';
  if (intensity < 0.75) return 'High';
  return 'Viral';
}

export function statusLabel(status: Rumor['status']): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'approved': return 'Approved';
    case 'debunked': return 'Debunked';
    case 'verified-true': return 'Verified True';
    case 'rejected': return 'Rejected';
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
