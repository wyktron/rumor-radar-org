import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Map, Send, Info, Volume2 } from 'lucide-react';

type DemoVideo = {
  id: string;
  label: string;
  title: string;
  blurb?: string;
};

const VIDEOS: DemoVideo[] = [
  {
    id: 'JEMFMg8DH6Q',
    label: 'Part 1',
    title: 'Rumor Radar — demo walkthrough',
    blurb:
      'The live heatmap, how a claim gets submitted, how an approved fact-checking organisation reviews it, and how the result reaches the hotline and the short-form feed.',
  },
  {
    id: 'UCMv2G981Vo',
    label: 'Part 2',
    title: 'Rumor Radar — second walkthrough',
  },
];

export default function DemoPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Demo — Rumor Radar';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="container py-10 max-w-5xl space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          <PlayCircle className="h-3.5 w-3.5" />
          Demo videos
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          See Rumor Radar <span className="bg-gradient-signal bg-clip-text text-transparent">in action</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Two short recordings of the prototype, shown in order.
        </p>
      </div>

      {VIDEOS.map((video, index) => (
        <Card key={video.id} className="glass-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <PlayCircle className="h-3.5 w-3.5" />
              {video.label}
            </div>
            <p className="text-xs text-muted-foreground">{video.title}</p>
          </div>
          <div className="relative w-full aspect-video bg-secondary/40">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1`}
              title={video.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5 shrink-0" />
              {video.blurb ?? 'Sound on for the narration.'}
            </div>
            {index === 0 && (
              <div className="flex flex-wrap gap-2">
                <Link to="/">
                  <Button size="sm" className="gap-1.5">
                    <Map className="h-3.5 w-3.5" /> Open the heatmap
                  </Button>
                </Link>
                <Link to="/submit">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Submit a rumor
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="sm" variant="ghost" className="gap-1.5">
                    <Info className="h-3.5 w-3.5" /> About the project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      ))}

      <Card className="glass-panel p-5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Demo environment: the organisation directory lists real, publicly active fact-checking organisations, while
          the rumor records shown are illustrative examples used for the hackathon prototype.
        </p>
      </Card>
    </div>
  );
}
