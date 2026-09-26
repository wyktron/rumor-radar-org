import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import type { Rumor } from '@/types';
import { FluidBackground, type Palette } from '@/components/feed/FluidBackground';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/RumorBits';
import { relativeTime } from '@/lib/rumor-utils';
import { MapPin, Share2, ChevronDown, Flame } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PALETTES: Record<string, Palette> = {
  debunked: { top: [0.05, 0.35, 0.3], mid: [0.03, 0.22, 0.24], bottom: [0.01, 0.1, 0.14] },
  'verified-true': { top: [0.08, 0.3, 0.55], mid: [0.05, 0.18, 0.4], bottom: [0.02, 0.08, 0.22] },
  viral: { top: [0.75, 0.32, 0.12], mid: [0.5, 0.14, 0.12], bottom: [0.22, 0.04, 0.08] },
  default: { top: [0.35, 0.18, 0.55], mid: [0.22, 0.1, 0.4], bottom: [0.08, 0.04, 0.18] },
};

function paletteFor(r?: Rumor): Palette {
  if (!r) return PALETTES.default;
  if (r.status === 'debunked') return PALETTES.debunked;
  if (r.status === 'verified-true') return PALETTES['verified-true'];
  if (r.intensity >= 0.75) return PALETTES.viral;
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

export default function FeedPage() {
  const { rumors } = useApp();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(
    () => rumors.filter((r) => r.title && r.status !== 'rejected'),
    [rumors],
  );

  const [deck, setDeck] = useState<Rumor[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (pool.length && deck.length === 0) setDeck(shuffle(pool));
  }, [pool, deck.length]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pool.length) return;
    const h = Math.max(1, el.clientHeight);
    setActiveIdx(Math.round(el.scrollTop / h));
    const remaining = (el.scrollHeight - el.scrollTop - el.clientHeight) / h;
    if (remaining < 2) setDeck((d) => [...d, ...shuffle(pool)]);
  }, [pool]);

  const active = deck[activeIdx];

  const share = async (r: Rumor) => {
    const url = `${window.location.origin}/?rumor=${r.id}`;
    try {
      if (navigator.share) await navigator.share({ title: r.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied' });
      }
    } catch {
      /* user dismissed */
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <FluidBackground palette={paletteFor(active)} scrollRef={scrollRef} />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="deck-scroller relative h-full overflow-y-scroll"
      >
        {deck.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-white/80">
            Loading rumors…
          </div>
        )}

        {deck.map((r, i) => (
          <article key={`${r.id}-${i}`} className="deck-slide relative h-full px-5 pb-10 pt-6">
            <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/15 bg-black/35 p-6 backdrop-blur-xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-white/85">
                  {r.topic}
                </span>
                {r.intensity >= 0.75 && (
                  <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] text-white">
                    <Flame className="h-3 w-3" /> Viral
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-semibold leading-snug text-white">{r.title}</h2>
              <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-white/80">{r.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {r.originCountry}
                </span>
                <span>{relativeTime(r.submittedAt)}</span>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => navigate(`/?rumor=${r.id}`)}
                >
                  <MapPin className="h-4 w-4" /> Locate on map
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => share(r)}
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            {i === 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center text-white/70">
                <ChevronDown className="h-5 w-5 animate-bounce" />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
