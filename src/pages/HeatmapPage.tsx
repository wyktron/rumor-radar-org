import { useMemo, useState } from 'react';
import { HeatmapMap } from '@/components/map/HeatmapMap';
import { useApp } from '@/context/AppContext';
import type { Rumor, Topic } from '@/types';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge, IntensityBar } from '@/components/RumorBits';
import { Filter, Activity, ShieldAlert, ShieldCheck } from 'lucide-react';
import { relativeTime } from '@/lib/rumor-utils';

export default function HeatmapPage() {
  const { rumors, user } = useApp();
  const [country, setCountry] = useState<string>('all');
  const [topic, setTopic] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState<Rumor | null>(null);

  const filtered = useMemo(
    () =>
      rumors.filter(
        (r) =>
          (country === 'all' || r.country === country) &&
          (topic === 'all' || r.topic === topic) &&
          (status === 'all' || r.status === status),
      ),
    [rumors, country, topic, status],
  );

  const stats = useMemo(() => {
    return {
      total: rumors.length,
      pending: rumors.filter((r) => r.status === 'pending').length,
      debunked: rumors.filter((r) => r.status === 'debunked').length,
      viral: rumors.filter((r) => r.intensity >= 0.75 && r.status === 'pending').length,
    };
  }, [rumors]);

  const isModerator = user?.role === 'moderator';

  return (
    <div className="container py-6 space-y-4">
      {/* Hero strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={<Activity className="h-4 w-4" />} label="Active signals" value={stats.total} accent="primary" />
        <StatTile icon={<ShieldAlert className="h-4 w-4" />} label="Trending viral" value={stats.viral} accent="viral" />
        <StatTile icon={<Activity className="h-4 w-4" />} label="Pending review" value={stats.pending} accent="warning" />
        <StatTile icon={<ShieldCheck className="h-4 w-4" />} label="Debunked" value={stats.debunked} accent="success" />
      </div>

      {/* Filter panel */}
      <Card className="glass-panel p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground pl-1">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Topic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="debunked">Debunked</SelectItem>
            <SelectItem value="verified-true">Verified true</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-muted-foreground font-mono">
          {filtered.length} / {rumors.length} signals
          {isModerator && <span className="ml-3 text-primary">● drag mode active</span>}
        </div>
      </Card>

      {/* Map */}
      <Card className="glass-panel overflow-hidden p-0 relative scanline">
        <div className="h-[640px]">
          <HeatmapMap rumors={filtered} draggable={isModerator} onSelect={setOpen} />
        </div>
      </Card>

      <RumorDialog rumor={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function StatTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: 'primary' | 'viral' | 'warning' | 'success' }) {
  const colors: Record<string, string> = {
    primary: 'text-primary border-primary/30',
    viral: 'text-viral border-viral/30',
    warning: 'text-warning border-warning/30',
    success: 'text-success border-success/30',
  };
  return (
    <Card className="glass-panel p-3 flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${colors[accent]} bg-background/40`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold leading-none mt-1 font-mono">{value}</div>
      </div>
    </Card>
  );
}

function RumorDialog({ rumor, onClose }: { rumor: Rumor | null; onClose: () => void }) {
  return (
    <Dialog open={!!rumor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        {rumor && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2"><StatusBadge status={rumor.status} /></div>
              <DialogTitle className="text-xl leading-tight">{rumor.title}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {rumor.country} · {rumor.topic} · {relativeTime(rumor.submittedAt)}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{rumor.description}</p>
            <IntensityBar rumor={rumor} />
            {rumor.debunkContent && (
              <div className="rounded-md border border-success/30 bg-success/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-success text-xs font-mono uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> Debunked by {rumor.debunkedBy}
                </div>
                <p className="text-sm">{rumor.debunkContent}</p>
                {rumor.debunkSources && rumor.debunkSources.length > 0 && (
                  <ul className="text-xs space-y-0.5">
                    {rumor.debunkSources.map((s) => <li key={s}><a className="text-primary hover:underline" href={s} target="_blank" rel="noreferrer">{s}</a></li>)}
                  </ul>
                )}
              </div>
            )}
            {rumor.verificationContent && (
              <div className="rounded-md border border-signal-verified/30 bg-signal-verified/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-signal-verified text-xs font-mono uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified true by {rumor.verifiedBy}
                </div>
                <p className="text-sm">{rumor.verificationContent}</p>
                {rumor.verificationSources && rumor.verificationSources.length > 0 && (
                  <ul className="text-xs space-y-0.5">
                    {rumor.verificationSources.map((s) => <li key={s}><a className="text-primary hover:underline" href={s} target="_blank" rel="noreferrer">{s}</a></li>)}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
