import { useState } from 'react';
import { RumorDeck } from './RumorDeck';

export function DeckTriggerButton({ docked = false }: { docked?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open rumor deck"
        className={`deck-trigger ${docked ? 'deck-trigger--map' : 'deck-trigger--page'} group flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/50 bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-90 sm:h-14 sm:w-14`}
      >
        <svg
          viewBox="0 0 24 24"
          className="relative h-7 w-7 drop-shadow sm:h-6 sm:w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6.5" y="12" width="11" height="8" rx="2" />
          <path d="M8.5 9.5h7M10 7h4" />
          <path d="M12 5.2V2.5M10.4 4l1.6-1.6L13.6 4" />
        </svg>

        {/* Hover label (desktop) — matches the filter control */}
        <span className="map-ctl-label absolute right-full mr-3 hidden whitespace-nowrap rounded-md border border-primary/30 bg-card/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
          Rumor deck
        </span>
      </button>

      <RumorDeck open={open} onClose={() => setOpen(false)} />
    </>
  );
}
