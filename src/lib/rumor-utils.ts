import type { Rumor, RumorStatus } from '@/types';
import i18n from '@/i18n';

export function intensityColor(intensity: number, status: RumorStatus): string {
  if (status === 'debunked') return 'hsl(var(--signal-debunked))';
  if (status === 'verified-true') return 'hsl(var(--signal-verified))';
  if (intensity < 0.25) return 'hsl(var(--signal-low))';
  if (intensity < 0.5) return 'hsl(var(--signal-moderate))';
  if (intensity < 0.75) return 'hsl(var(--signal-high))';
  return 'hsl(var(--signal-viral))';
}

export function intensityLabel(intensity: number): string {
  if (intensity < 0.25) return i18n.t('intensity.low', { defaultValue: 'Low' });
  if (intensity < 0.5) return i18n.t('intensity.moderate', { defaultValue: 'Moderate' });
  if (intensity < 0.75) return i18n.t('intensity.high', { defaultValue: 'High' });
  return i18n.t('intensity.viral', { defaultValue: 'Viral' });
}

export function statusLabel(status: Rumor['status']): string {
  switch (status) {
    case 'pending': return i18n.t('statusLabel.pending', { defaultValue: 'Pending' });
    case 'approved': return i18n.t('statusLabel.approved', { defaultValue: 'Unconfirmed' });
    case 'debunked': return i18n.t('statusLabel.debunked', { defaultValue: 'Debunked' });
    case 'verified-true': return i18n.t('statusLabel.verifiedTrue', { defaultValue: 'Verified True' });
    case 'rejected': return i18n.t('statusLabel.rejected', { defaultValue: 'Rejected' });
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return i18n.t('time.justNow', { defaultValue: 'just now' });
  if (m < 60) return i18n.t('time.minutes', { defaultValue: '{{m}}m ago', m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t('time.hours', { defaultValue: '{{h}}h ago', h });
  const d = Math.floor(h / 24);
  if (d < 30) return i18n.t('time.days', { defaultValue: '{{d}}d ago', d });
  return new Date(iso).toLocaleDateString(i18n.resolvedLanguage);
}
