import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlayCircle, Map, Info } from 'lucide-react';

const SEEN_KEY = 'rumor-radar.welcome-video-seen.v1';
const VIDEO_ID = 'JEMFMg8DH6Q';

export function WelcomeVideoDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <PlayCircle className="h-5 w-5 text-primary" />
            Welcome to Rumor Radar
          </DialogTitle>
          <DialogDescription>
            Watch a 2-minute presentation of how the platform spots, checks and responds to rumors — or jump straight into the live map.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full aspect-video bg-secondary/40">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
            title="Rumor Radar Presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <p className="text-xs text-muted-foreground">You can rewatch it anytime on the Demo page.</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/demo" onClick={dismiss}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Info className="h-3.5 w-3.5" /> More videos
              </Button>
            </Link>
            <Link to="/" onClick={dismiss}>
              <Button size="sm" className="gap-1.5">
                <Map className="h-3.5 w-3.5" /> Open the live map
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
