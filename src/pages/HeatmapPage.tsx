import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { DeckTriggerButton } from '@/components/deck/DeckTriggerButton';
import { Filter, ShieldCheck, Send, Info, X, MapPin, HelpCircle, Crosshair, Eye, EyeOff } from 'lucide-react';
import { relativeTime } from '@/lib/rumor-utils';
import { cn } from '@/lib/utils';

export default function HeatmapPage() {
  const { rumors } = useApp();
  const { isStaff } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const legendRef = useRef<HTMLDivElement>(null);

  // Publish the trending-scale legend's height as a CSS var so the filters
  // panel can stack above it on mobile (they share the bottom-left corner).
  useEffect(() => {
    const el = legendRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        '--trending-scale-h',
        `${Math.ceil(el.getBoundingClientRect().height)}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [country, setCountry] = useState<string>('all');
  const [topic, setTopic] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState<Rumor | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [submitInfoOpen, setSubmitInfoOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [panelsHidden, setPanelsHidden] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focus, setFocus] = useState<{ coords: [number, number]; key: string } | null>(null);

  // Deep link from the feed: /?rumor=<id> flies to the rumor and opens it.
  const focusId = searchParams.get('rumor');
  useEffect(() => {
    if (!focusId) return;
    const target = rumors.find((r) => r.id === focusId);
    if (!target) return;
    setFocus({ coords: target.coordinates, key: target.id });
    setOpen(target);
    searchParams.delete('rumor');
    setSearchParams(searchParams, { replace: true });
  }, [focusId, rumors]);

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
      viral: rumors.filter((r) => r.intensity >= 0.75 && (r.status === 'approved' || r.status === 'pending')).length,
      high: rumors.filter((r) => r.intensity >= 0.5 && r.intensity < 0.75 && (r.status === 'approved' || r.status === 'pending')).length,
    };
  }, [rumors]);

  const isModerator = isStaff;

  const clearAll = () => {
    setCountry('all');
    setTopic('all');
    setStatus('all');
  };
  const filtersActive = country !== 'all' || topic !== 'all' || status !== 'all';
  const activeCount = [country, topic, status].filter((v) => v !== 'all').length;
  const countryOptions = useMemo(
    () => Array.from(new Set(rumors.map((r) => r.originCountry).filter(Boolean))).sort(),
    [rumors],
  );


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
          focus={focus}
        />
      </div>

      {/* TOP-LEFT: LIVE stats panel */}
      <div className={cn('absolute top-4 left-4 z-[410] glass-panel rounded-lg p-2 sm:p-3 w-36 sm:w-52 shadow-lg', panelsHidden && 'hidden')}>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-success">
          <span className="inline-block h-2 w-2 rounded-full ticker-blink bg-success shadow-glow" />
          {t('heatmap.live')}
        </div>
        <div className="mt-1 text-3xl font-bold font-mono leading-none">{stats.total}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{t('heatmap.activeRumors')}</div>
        <div className="mt-3 space-y-1 text-xs font-mono">
          <Stat label={t('heatmap.debunked')} value={stats.debunked} color="text-foreground" />
          <Stat label={t('heatmap.verifiedTrue')} value={stats.verified} color="text-foreground" />
          <Stat label={t('heatmap.viral')} value={stats.viral} color="text-foreground" />
          <Stat label={t('heatmap.high')} value={stats.high} color="text-foreground" />
        </div>
      </div>

      {/* TOP-RIGHT: Submit a Rumor — aligned with the live tracker panel */}
      <div className={cn('absolute top-4 right-4 z-[410]', panelsHidden && 'hidden')}>
        <Button className="gap-1.5 shadow-lg h-11 sm:h-9" onClick={startSubmitFlow}>
          <Send className="h-4 w-4" /> {t('heatmap.submit')}
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

      {/* BOTTOM-LEFT: Trending scale legend — anchors above the bottom nav */}
      <div
        ref={legendRef}
        className={cn(
          'map-panel-row absolute left-3 sm:left-4 z-[400] glass-panel rounded-lg p-2.5 sm:p-3 w-36 sm:w-56 shadow-lg',
          panelsHidden && 'hidden',
        )}
      >
        <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {t('heatmap.trendingScale')}
        </div>
        <div className="space-y-1 text-[11px] sm:text-xs">
          <LegendRow color="hsl(var(--signal-low))" label={t('heatmap.low')} />
          <LegendRow color="hsl(var(--signal-moderate))" label={t('heatmap.moderate')} />
          <LegendRow color="hsl(var(--signal-high))" label={t('heatmap.highRange')} />
          <LegendRow color="hsl(var(--signal-viral))" label={t('heatmap.viralRange')} />
          <div className="h-px bg-border/60 my-1.5" />
          <LegendRow color="hsl(var(--signal-debunked))" label={t('heatmap.debunkedLegend')} />
          <LegendRow color="hsl(var(--signal-verified))" label={t('heatmap.verifiedLegend')} />
        </div>
        <div className="hidden sm:block text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
          {isModerator ? t('heatmap.dragHint') : t('heatmap.clickHint')}
        </div>
      </div>

      {/* Deck and filter controls share one stack so their spacing never changes. */}
      {!panelsHidden && (
        <div className="map-panel-row absolute right-3 z-[390] flex flex-col items-center gap-2 sm:right-4">
          <DeckTriggerButton docked />
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-label={t('heatmap.filterRumors')}
              aria-expanded={filtersOpen}
              className={cn(
                'group relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-90 sm:h-14 sm:w-14',
                filtersOpen
                  ? 'border-border bg-muted text-muted-foreground'
                  : 'border-primary/50 bg-primary text-primary-foreground',
              )}
            >
              <Filter className="h-8 w-8 drop-shadow-sm sm:h-7 sm:w-7" strokeWidth={2.5} />
              {activeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1 text-[10px] font-bold leading-none text-primary ring-2 ring-background">
                  {activeCount}
                </span>
              )}
              {/* Hover label (desktop) */}
              <span className="map-ctl-label absolute right-full mr-3 hidden whitespace-nowrap rounded-md border border-primary/30 bg-card/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
                {t('heatmap.filterRumors')}
              </span>
            </button>
          </div>
        </div>
      )}


      {/* BOTTOM-CENTER: Toggle floating panels — sits just above the bottom nav */}
      {!pickMode && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[450]"
          style={{ bottom: 'calc(var(--bottom-nav-h, 56px) + 0.75rem)' }}
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-lg bg-background/85 backdrop-blur-xl text-xs h-11 px-4 sm:h-8 sm:px-3"
            onClick={() => setPanelsHidden((v) => !v)}
          >
            {panelsHidden ? (
              <>
                <Eye className="h-4 w-4" /> {t('heatmap.showPanels')}
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" /> {t('heatmap.hidePanels')}
              </>
            )}
          </Button>
        </div>
      )}


      {/* BOTTOM: Filters — collapsed by default on all sizes; stacks above the trending scale on mobile */}
      {!panelsHidden && (
      <div
        className={cn(
          'filters-panel absolute inset-x-3 z-[390] glass-panel rounded-lg p-3 shadow-lg overflow-y-auto sm:inset-x-auto sm:right-20 sm:w-72 sm:z-[420]',
          filtersOpen ? 'block' : 'hidden',
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Filter className="h-3 w-3" /> {t('heatmap.filterRumors')}
          </div>
          <div className="flex items-center gap-2">
            {filtersActive && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline"
              >
                {t('heatmap.clear')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Collapse filters"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
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
                {countryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

