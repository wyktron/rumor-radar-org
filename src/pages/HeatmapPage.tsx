import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeatmapMap } from '@/components/map/HeatmapMap';
import { useApp } from '@/context/AppContext';
import type { Rumor } from '@/types';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, IntensityBar } from '@/components/RumorBits';
import { Filter, ShieldCheck, Send, Info, X, MapPin, HelpCircle, Crosshair, Eye, EyeOff } from 'lucide-react';
import { relativeTime } from '@/lib/rumor-utils';
import { cn } from '@/lib/utils';

export default function HeatmapPage() {
  const { rumors, user } = useApp();
  const navigate = useNavigate();
  const [country, setCountry] = useState<string>('all');
  const [topic, setTopic] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState<Rumor | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [submitInfoOpen, setSubmitInfoOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [panelsHidden, setPanelsHidden] = useState(false);

  const startSubmitFlow = () => setSubmitInfoOpen(true);
  const enterPickMode = () => {
    setSubmitInfoOpen(false);
    setPickMode(true);
  };
  const handlePick = (coords: [number, number]) => {
    setPickMode(false);
    navigate('/submit', { state: { originCoordinates: coords } });
  };

  const filtered = useMemo(
    () =>
      rumors.filter(
        (r) =>
          (country === 'all' || r.originCountry === country) &&
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
      verified: rumors.filter((r) => r.status === 'verified-true').length,
      viral: rumors.filter((r) => r.intensity >= 0.75 && r.status === 'pending').length,
      high: rumors.filter((r) => r.intensity >= 0.5 && r.intensity < 0.75 && r.status === 'pending').length,
    };
  }, [rumors]);

  const isModerator = user?.role === 'moderator';

  const clearAll = () => {
    setCountry('all');
    setTopic('all');
    setStatus('all');
  };
  const filtersActive = country !== 'all' || topic !== 'all' || status !== 'all';

  return (
    <div className="absolute inset-0">
      {/* Map fills the whole area */}
      <div className="absolute inset-0">
        <HeatmapMap
          rumors={filtered}
          draggable={isModerator && !pickMode}
          onSelect={pickMode ? undefined : setOpen}
          pickMode={pickMode}
          onPick={handlePick}
        />
      </div>

      {/* TOP-CENTER: Toggle floating panels */}
      {!pickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[550]">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-lg bg-background/85 backdrop-blur-xl text-xs"
            onClick={() => setPanelsHidden((v) => !v)}
          >
            {panelsHidden ? (
              <>
                <Eye className="h-3.5 w-3.5" /> Show panels
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide panels
              </>
            )}
          </Button>
        </div>
      )}

      {/* TOP-LEFT: LIVE stats panel */}
      <div className={cn('absolute top-4 left-4 z-[500] glass-panel rounded-lg p-3 w-52 shadow-lg', panelsHidden && 'hidden')}>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'hsl(140 85% 45%)' }}>
          <span
            className="inline-block h-2 w-2 rounded-full ticker-blink"
            style={{ backgroundColor: 'hsl(140 90% 50%)', boxShadow: '0 0 8px hsl(140 90% 50% / 0.9)' }}
          />
          Live
        </div>
        <div className="mt-1 text-3xl font-bold font-mono leading-none">{stats.total}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Active rumors</div>
        <div className="mt-3 space-y-1 text-xs font-mono">
          <Stat label="debunked" value={stats.debunked} color="text-success" />
          <Stat label="verified true" value={stats.verified} color="text-signal-verified" />
          <Stat label="viral" value={stats.viral} color="text-viral" />
          <Stat label="high" value={stats.high} color="text-warning" />
        </div>
      </div>

      {/* TOP-RIGHT: Submit a Rumor */}
      <div className={cn('absolute top-4 right-4 z-[500]', panelsHidden && 'hidden')}>
        <Button className="gap-1.5 shadow-lg" onClick={startSubmitFlow}>
          <Send className="h-3.5 w-3.5" /> Submit a Rumor
        </Button>
      </div>

      {/* PICK MODE banner — appears across the top once the user accepts the explainer */}
      {pickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] glass-panel rounded-full px-4 py-2 shadow-lg flex items-center gap-3 animate-fade-in">
          <Crosshair className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Click anywhere on the map to mark <strong>where you heard the rumor</strong>
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPickMode(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Submit-flow explainer dialog */}
      <Dialog open={submitInfoOpen} onOpenChange={setSubmitInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> How to Submit a Rumor
            </DialogTitle>
            <DialogDescription>
              Help us track how misinformation spreads — not where the events take place.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Mark where you heard the rumor
              </div>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-[13px]">
                <li>Click on the map to mark where you first heard this rumor.</li>
                <li>This helps us track how misinformation spreads geographically.</li>
              </ul>
            </div>
            <div className="rounded-md border border-warning/40 bg-warning/5 p-3 space-y-1">
              <div className="font-semibold">Heard it online?</div>
              <p className="text-muted-foreground text-[13px]">
                Select the capital city of the country where the service is registered, or the exact location of
                the news agency's headquarters.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your submission will be reviewed by our team before appearing on the map.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={enterPickMode} className="w-full gap-2">
              <Crosshair className="h-4 w-4" /> I understand, take me to the map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BOTTOM-LEFT: Trending scale legend — sits above the bottom nav AND above the map's built-in legend */}
      <div className={cn('absolute bottom-32 left-4 z-[500] glass-panel rounded-lg p-3 w-56 shadow-lg', panelsHidden && 'hidden')}>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Trending scale
        </div>
        <div className="space-y-1 text-xs">
          <LegendRow color="hsl(var(--signal-low))" label="Low (0–25%)" />
          <LegendRow color="hsl(var(--signal-moderate))" label="Moderate (25–50%)" />
          <LegendRow color="hsl(var(--signal-high))" label="High (50–75%)" />
          <LegendRow color="hsl(var(--signal-viral))" label="Viral (75–100%)" />
          <div className="h-px bg-border/60 my-1.5" />
          <LegendRow color="hsl(var(--signal-debunked))" label="Debunked" />
          <LegendRow color="hsl(var(--signal-verified))" label="Verified True" />
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
          {isModerator ? 'Drag points · Click for details' : 'Click point for details'}
        </div>
      </div>

      {/* BOTTOM-RIGHT: Filter panel */}
      {!panelsHidden && (
      <div className="absolute bottom-20 right-4 z-[500] glass-panel rounded-lg p-3 w-72 shadow-lg max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Filter className="h-3 w-3" /> Filter rumors
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* How to read this map */}
        {showInfo && (
          <div className="rounded-md border border-warning/40 bg-warning/5 p-2.5 mb-3 relative">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="flex gap-1.5 pr-4">
              <Info className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <strong>How to read this map:</strong> Points show where each rumor <strong>originated</strong> (spread from), not where events happened. Use filters to find rumors about each region.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <FilterField label="Origin country">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Topic">
            <div className="flex flex-wrap gap-1">
              <ChipBtn active={topic === 'all'} onClick={() => setTopic('all')}>All</ChipBtn>
              {TOPICS.map((t) => (
                <ChipBtn key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</ChipBtn>
              ))}
            </div>
          </FilterField>

          <FilterField label="Status">
            <div className="flex flex-wrap gap-1">
              <ChipBtn active={status === 'all'} onClick={() => setStatus('all')}>All</ChipBtn>
              <ChipBtn active={status === 'debunked'} onClick={() => setStatus('debunked')}>Debunked</ChipBtn>
              <ChipBtn active={status === 'verified-true'} onClick={() => setStatus('verified-true')}>Verified True</ChipBtn>
              <ChipBtn active={status === 'pending'} onClick={() => setStatus('pending')}>Pending</ChipBtn>
            </div>
          </FilterField>

          <div className="text-[10px] font-mono text-muted-foreground pt-1.5 border-t border-border/60">
            {filtered.length} / {rumors.length} signals
            {isModerator && <span className="ml-2 text-primary">● drag mode</span>}
          </div>
        </div>
      </div>
      )}

      <RumorDialog rumor={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('font-bold', color)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span>{label}</span>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded-md text-[11px] border transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/60 text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
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
                Origin · {rumor.originCountry}
                {rumor.subjectCountry && rumor.subjectCountry !== rumor.originCountry && ` · about ${rumor.subjectCountry}`}
                {' · '}{rumor.topic} · {relativeTime(rumor.submittedAt)}
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
