import type { Rumor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { intensityColor, intensityLabel, statusLabel, relativeTime } from '@/lib/rumor-utils';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: Rumor['status'] }) {
  const map: Record<Rumor['status'], string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    approved: 'bg-primary/15 text-primary border-primary/30',
    debunked: 'bg-success/15 text-success border-success/30',
    'verified-true': 'bg-signal-verified/15 text-signal-verified border-signal-verified/30',
    rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px] uppercase tracking-wider', map[status])}>
      {statusLabel(status)}
    </Badge>
  );
}

export function IntensityBar({ rumor }: { rumor: Rumor }) {
  const color = intensityColor(rumor.intensity, rumor.status);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>{intensityLabel(rumor.intensity)}</span>
        <span>{Math.round(rumor.intensity * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${rumor.intensity * 100}%`,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

export function RumorMeta({ rumor }: { rumor: Rumor }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <Badge variant="outline" className="font-normal">{rumor.country}</Badge>
      <Badge variant="outline" className="font-normal">{rumor.topic}</Badge>
      <span className="text-muted-foreground font-mono">· {relativeTime(rumor.submittedAt)}</span>
    </div>
  );
}
