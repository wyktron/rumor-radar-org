import { useState } from 'react';
import { RumorDeck } from './RumorDeck';

export function DeckTriggerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open rumor deck"
        title="Rumor deck"
        className="deck-trigger flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/50 bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-90"
      >
        <svg
          viewBox="0 0 24 24"
          className="relative h-6 w-6 drop-shadow"
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
      </button>

      <RumorDeck open={open} onClose={() => setOpen(false)} />
    </>
  );
}
