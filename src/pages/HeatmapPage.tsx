import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HeatmapMap } from '@/components/map/HeatmapMap';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import type { Rumor } from '@/types';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, IntensityBar } from '@/components/RumorBits';
import { RumorDetailDialog } from '@/components/RumorDetailDialog';
import { Filter, ShieldCheck, Send, Info, X, MapPin, HelpCircle, Crosshair, Eye, EyeOff } from 'lucide-react';
import { relativeTime } from '@/lib/rumor-utils';
import { cn } from '@/lib/utils';

export default function HeatmapPage() {
  const { rumors } = useApp();
  const { isStaff } = useAuth();
  const { t } = useTranslation();
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

  const isModerator = isStaff;

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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[450]">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-lg bg-background/85 backdrop-blur-xl text-xs"
            onClick={() => setPanelsHidden((v) => !v)}
          >
            {panelsHidden ? (
              <>
                <Eye className="h-3.5 w-3.5" /> {t('heatmap.showPanels')}
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" /> {t('heatmap.hidePanels')}
              </>
            )}
          </Button>
        </div>
      )}

      {/* TOP-LEFT: LIVE stats panel */}
      <div className={cn('absolute top-4 left-4 z-[410] glass-panel rounded-lg p-2 sm:p-3 w-36 sm:w-52 shadow-lg', panelsHidden && 'hidden')}>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-success">
          <span className="inline-block h-2 w-2 rounded-full ticker-blink bg-success shadow-glow" />
          {t('heatmap.live')}
        </div>
        <div className="mt-1 text-3xl font-bold font-mono leading-none">{stats.total}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{t('heatmap.activeRumors')}</div>
        <div className="mt-3 space-y-1 text-xs font-mono">
          <Stat label={t('heatmap.debunked')} value={stats.debunked} color="text-success" />
          <Stat label={t('heatmap.verifiedTrue')} value={stats.verified} color="text-signal-verified" />
          <Stat label={t('heatmap.viral')} value={stats.viral} color="text-viral" />
          <Stat label={t('heatmap.high')} value={stats.high} color="text-warning" />
        </div>
      </div>

      {/* TOP-RIGHT: Submit a Rumor */}
      <div className={cn('absolute top-16 right-4 z-[410] sm:top-4', panelsHidden && 'hidden')}>
        <Button className="gap-1.5 shadow-lg" onClick={startSubmitFlow}>
          <Send className="h-3.5 w-3.5" /> {t('heatmap.submit')}
        </Button>
      </div>

      {/* PICK MODE banner — appears across the top once the user accepts the explainer */}
      {pickMode && (
        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[500] glass-panel rounded-full px-4 py-2 shadow-lg flex items-center gap-3 animate-fade-in">
          <Crosshair className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            <Trans i18nKey="heatmap.pickBanner" components={[<strong />]} />
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPickMode(false)}>
            {t('heatmap.cancel')}
          </Button>
        </div>
      )}

      {/* Submit-flow explainer dialog */}
      <Dialog open={submitInfoOpen} onOpenChange={setSubmitInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> {t('heatmap.explainerTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('heatmap.explainerDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> {t('heatmap.markTitle')}
              </div>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-[13px]">
                <li>{t('heatmap.markBullet1')}</li>
                <li>{t('heatmap.markBullet2')}</li>
              </ul>
            </div>
            <div className="rounded-md border border-warning/40 bg-warning/5 p-3 space-y-1">
              <div className="font-semibold">{t('heatmap.onlineTitle')}</div>
              <p className="text-muted-foreground text-[13px]">
                {t('heatmap.onlineDesc')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('heatmap.reviewNote')}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={enterPickMode} className="w-full gap-2">
              <Crosshair className="h-4 w-4" /> {t('heatmap.explainerCta')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BOTTOM-LEFT: Trending scale legend — anchors above the bottom nav (which can change height when wrapping on mobile) */}
      <div
        className={cn(
          'absolute left-4 z-[400] glass-panel rounded-lg p-3 w-44 sm:w-56 shadow-lg hidden sm:block',
          panelsHidden && 'hidden',
        )}
        style={{ bottom: 'calc(var(--bottom-nav-h, 56px) + 0.75rem)' }}
      >
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {t('heatmap.trendingScale')}
        </div>
        <div className="space-y-1 text-xs">
          <LegendRow color="hsl(var(--signal-low))" label={t('heatmap.low')} />
          <LegendRow color="hsl(var(--signal-moderate))" label={t('heatmap.moderate')} />
          <LegendRow color="hsl(var(--signal-high))" label={t('heatmap.highRange')} />
          <LegendRow color="hsl(var(--signal-viral))" label={t('heatmap.viralRange')} />
          <div className="h-px bg-border/60 my-1.5" />
          <LegendRow color="hsl(var(--signal-debunked))" label={t('heatmap.debunkedLegend')} />
          <LegendRow color="hsl(var(--signal-verified))" label={t('heatmap.verifiedLegend')} />
        </div>
        <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
          {isModerator ? t('heatmap.dragHint') : t('heatmap.clickHint')}
        </div>
      </div>

      {/* BOTTOM: Filters anchor above the nav; on mobile it spans the viewport so nothing can sit underneath it. */}
      {!panelsHidden && (
      <div
        className="absolute inset-x-3 z-[390] glass-panel rounded-lg p-3 shadow-lg overflow-y-auto sm:inset-x-auto sm:right-4 sm:w-72 sm:z-[420]"
        style={{
          bottom: 'calc(var(--bottom-nav-h, 56px) + 0.75rem)',
          maxHeight: 'min(44dvh, calc(100dvh - var(--bottom-nav-h, 56px) - 5rem))',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Filter className="h-3 w-3" /> {t('heatmap.filterRumors')}
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline"
            >
              {t('heatmap.clear')}
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
                <strong>{t('heatmap.howToRead')}</strong> <Trans i18nKey="heatmap.howToReadDesc" components={[<strong />]} />
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <FilterField label={t('heatmap.originCountry')}>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('heatmap.allCountries')}</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label={t('heatmap.topic')}>
            <div className="flex flex-wrap gap-1">
              <ChipBtn active={topic === 'all'} onClick={() => setTopic('all')}>{t('heatmap.all')}</ChipBtn>
              {TOPICS.map((t) => (
                <ChipBtn key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</ChipBtn>
              ))}
            </div>
          </FilterField>

          <FilterField label={t('heatmap.status')}>
            <div className="flex flex-wrap gap-1">
              <ChipBtn active={status === 'all'} onClick={() => setStatus('all')}>{t('heatmap.all')}</ChipBtn>
              <ChipBtn active={status === 'debunked'} onClick={() => setStatus('debunked')}>{t('heatmap.debunkedLegend')}</ChipBtn>
              <ChipBtn active={status === 'verified-true'} onClick={() => setStatus('verified-true')}>{t('heatmap.verifiedTrueChip')}</ChipBtn>
              <ChipBtn active={status === 'pending'} onClick={() => setStatus('pending')}>{t('heatmap.pending')}</ChipBtn>
            </div>
          </FilterField>

          <div className="text-[10px] font-mono text-muted-foreground pt-1.5 border-t border-border/60">
            {t('heatmap.signals', { count: filtered.length, total: rumors.length })}
            {isModerator && <span className="ml-2 text-primary">{t('heatmap.dragMode')}</span>}
          </div>
        </div>
      </div>
      )}

      <RumorDetailDialog rumor={open} onClose={() => setOpen(null)} />
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

