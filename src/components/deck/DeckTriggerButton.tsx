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
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full animate-attention-shake"
      >
        <span
          aria-hidden
          className="animate-aura-breathe pointer-events-none absolute inset-0 rounded-full blur-lg"
          style={{
            background:
              'conic-gradient(from 0deg, hsl(var(--signal-verified, 152 60% 40%)), hsl(var(--signal-debunked, 221 83% 53%)), hsl(270 80% 60%), hsl(38 92% 55%), hsl(var(--signal-verified, 152 60% 40%)))',
          }}
        />
        <span
          aria-hidden
          className="animate-hue-cycle absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, hsl(152 60% 40%), hsl(221 83% 53%), hsl(270 80% 60%), hsl(38 92% 55%), hsl(152 60% 40%))',
          }}
        />
        <svg
          viewBox="0 0 24 24"
          className="relative h-5 w-5 text-white drop-shadow"
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
