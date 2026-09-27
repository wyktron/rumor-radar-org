import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import type { Rumor } from '@/types';
import { FluidBackground, type Palette } from '@/components/feed/FluidBackground';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/RumorBits';
import { relativeTime } from '@/lib/rumor-utils';
import { MapPin, Share2, ChevronUp, Flame, X, Hand, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

const PALETTES: Record<string, Palette> = {
  'verified-true': { top: hex('#055c40'), mid: hex('#059669'), bottom: hex('#052e26') },
  debunked: { top: hex('#1f3b8a'), mid: hex('#2764ec'), bottom: hex('#0d1a4d') },
  default: { top: hex('#4d1c94'), mid: hex('#7d3bec'), bottom: hex('#210f42') },
};

function paletteFor(r?: Rumor): Palette {
  if (!r) return PALETTES.default;
  if (r.status === 'debunked') return PALETTES.debunked;
  if (r.status === 'verified-true') return PALETTES['verified-true'];
  return PALETTES.default;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RumorDeck({ open, onClose }: Props) {
  const { rumors } = useApp();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only reviewed outcomes go into the feed — never unconfirmed claims.
  const pool = useMemo(
    () => rumors.filter((r) => r.title && (r.status === 'debunked' || r.status === 'verified-true')),
    [rumors],
  );


  const [deck, setDeck] = useState<Rumor[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (open && pool.length && deck.length === 0) setDeck(shuffle(pool));
  }, [open, pool, deck.length]);

  // Scroll lock while the deck is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes the deck.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pool.length) return;
    const h = Math.max(1, el.clientHeight);
    setActiveIdx(Math.round(el.scrollTop / h));
    const remaining = (el.scrollHeight - el.scrollTop - el.clientHeight) / h;
    if (remaining < 2) setDeck((d) => [...d, ...shuffle(pool)]);
  }, [pool]);

  const share = async (r: Rumor) => {
    const url = `${window.location.origin}/?rumor=${r.id}`;
    try {
      if (navigator.share) await navigator.share({ title: r.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied' });
      }
    } catch {
      /* dismissed */
    }
  };

  const locate = (r: Rumor) => {
    onClose();
    navigate(`/?rumor=${r.id}`);
    window.dispatchEvent(
      new CustomEvent('rumorradar:flyto', {
        detail: { lat: r.coordinates[0], lng: r.coordinates[1], id: r.id },
      }),

    );
  };

  if (!open) return null;

  const active = deck[activeIdx];

  return createPortal(
    <div className="fixed inset-0 z-[3000] h-full w-full overflow-hidden bg-background">
      <FluidBackground palette={paletteFor(active)} scrollRef={scrollRef} />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close deck"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="deck-scroller relative h-full w-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {deck.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-white/80">
            Loading rumors…
          </div>
        )}

        {deck.map((r, i) => (
          <section
            key={`${r.id}-${i}`}
            className="deck-slide relative flex h-full w-full flex-col justify-center px-5 pb-16 pt-16"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            <div className="mx-auto flex max-h-[78vh] w-full max-w-xl flex-col overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-2xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-secondary-foreground">
                  {r.topic}
                </span>
                {r.intensity >= 0.75 && (
                  <span className="flex items-center gap-1 rounded-full border border-viral/30 bg-viral/10 px-2.5 py-0.5 text-[11px] font-medium text-viral">
                    <Flame className="h-3 w-3" /> Viral
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-semibold leading-snug text-card-foreground">{r.title}</h2>

              {(r.debunkedBy || r.verifiedBy) && (
                <div
                  className={cn(
                    'mt-3 flex items-center gap-2.5 rounded-md border p-2.5',
                    r.status === 'debunked'
                      ? 'border-signal-debunked/30 bg-signal-debunked/5'
                      : 'border-signal-verified/30 bg-signal-verified/5',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      r.status === 'debunked'
                        ? 'bg-signal-debunked/15 text-signal-debunked'
                        : 'bg-signal-verified/15 text-signal-verified',
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {r.status === 'debunked' ? 'Debunked by' : 'Verified by'}
                    </div>
                    <div className="truncate text-sm font-semibold leading-tight">
                      {r.status === 'debunked' ? r.debunkedBy : r.verifiedBy}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  The claim
                </div>
                <p
                  className={cn(
                    'mt-1 line-clamp-5 text-sm leading-relaxed text-muted-foreground',
                    r.status === 'debunked' && 'line-through',
                  )}
                >
                  {r.description}
                </p>
              </div>

              {(r.debunkContent || r.verificationContent) && (
                <div
                  className={cn(
                    'mt-3 rounded-md border p-3',
                    r.status === 'debunked'
                      ? 'border-signal-debunked/30 bg-signal-debunked/5'
                      : 'border-signal-verified/30 bg-signal-verified/5',
                  )}
                >
                  <div
                    className={cn(
                      'text-[10px] font-mono uppercase tracking-wider',
                      r.status === 'debunked' ? 'text-signal-debunked' : 'text-signal-verified',
                    )}
                  >
                    The findings
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">
                    {r.debunkContent || r.verificationContent}
                  </p>
                  {!!(r.status === 'debunked' ? r.debunkSources : r.verificationSources)?.length && (
                    <ul className="mt-2 space-y-0.5 text-xs">
                      {(r.status === 'debunked' ? r.debunkSources : r.verificationSources)?.map((s) => (
                        <li key={s} className="truncate">
                          <a
                            className="text-primary hover:underline"
                            href={s}
                            target="_blank"
                            rel="noreferrer"
                          >
                            ↗ {s}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {r.originCountry}
                </span>
                <span>{relativeTime(r.submittedAt)}</span>
              </div>


              <div className="mt-5 flex gap-2">
                <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => locate(r)}>
                  <MapPin className="h-4 w-4" /> View on map
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => share(r)}
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            {i === 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-white/75">
                <Hand className="h-5 w-5 animate-swipe-hint" />
                <div className="flex flex-col items-center -space-y-1.5">
                  <ChevronUp className="h-4 w-4 animate-swipe-hint [animation-delay:0ms]" />
                  <ChevronUp className="h-4 w-4 animate-swipe-hint [animation-delay:150ms]" />
                  <ChevronUp className="h-4 w-4 animate-swipe-hint [animation-delay:300ms]" />
                </div>
                <span className="text-xs">Swipe for the next rumor</span>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}
