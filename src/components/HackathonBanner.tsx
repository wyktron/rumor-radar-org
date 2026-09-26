import { Trophy } from 'lucide-react';

export function HackathonBanner() {
  return (
    <div className="w-full bg-gradient-signal text-primary-foreground">
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-center">
        <Trophy className="h-3.5 w-3.5 shrink-0" />
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.12em] leading-tight">
          Demo build — Deeptech GigaHack 2026 · Open Challenge prototype
        </p>
      </div>
    </div>
  );
}
