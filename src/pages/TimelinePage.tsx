import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Rss, Check } from 'lucide-react';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { StatusBadge, IntensityBar, RumorMeta } from '@/components/RumorBits';
import { RumorDetailDialog } from '@/components/RumorDetailDialog';
import type { Rumor } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function TimelinePage() {
  const { rumors } = useApp();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('all');
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState<Rumor | null>(null);


  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return [...rumors]
      .filter(
        (r) =>
          (country === 'all' || r.originCountry === country) &&
          (topic === 'all' || r.topic === topic) &&
          (status === 'all' || r.status === status) &&
          (!ql || r.title.toLowerCase().includes(ql) || r.description.toLowerCase().includes(ql)),
      )
      .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [rumors, q, country, topic, status]);

  const [copied, setCopied] = useState(false);
  // Feed only carries reviewed outcomes (debunked / verified true).
  const feedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/feed/timeline.rss?status=debunked,verified-true`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast({ title: 'Copied successfully', description: feedUrl });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Could not copy link', variant: 'destructive' });
    }
  };

  return (
    <div className="container py-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-sm text-muted-foreground">Chronological feed of rumors flagged by the network.</p>
      </div>

      <Card className="glass-panel p-3 flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-warning/15 text-warning shrink-0">
          <Rss className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm font-semibold leading-tight">Subscribe to the RSS feed</div>
          <div className="text-xs text-muted-foreground">Get new rumors delivered to your reader as soon as they're flagged.</div>
        </div>
        <code className="hidden md:inline-block text-[11px] font-mono text-muted-foreground bg-secondary/60 border border-border/60 rounded px-2 py-1 truncate max-w-[260px]">
          {feedUrl}
        </code>
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-warning text-warning-foreground hover:bg-warning/90"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Rss className="h-3.5 w-3.5" />}
          {copied ? 'Copied successfully' : 'Subscribe'}
        </Button>
      </Card>

      <Card className="glass-panel p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rumors…" className="pl-8 h-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {Array.from(new Set(rumors.map((r) => r.originCountry).filter(Boolean))).sort().map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Topic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="debunked">Debunked</SelectItem>
            <SelectItem value="verified-true">Verified true</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <div className="space-y-2">
        {filtered.map((r) => (
          <Card
            key={r.id}
            className="glass-panel p-4 flex items-start gap-4 cursor-pointer hover:shadow-glow transition-shadow"
            onClick={() => setOpen(r)}
          >
            <div className="hidden md:flex flex-col items-center pt-1 w-16 shrink-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {new Date(r.submittedAt).toLocaleDateString(undefined, { month: 'short' })}
              </div>
              <div className="text-2xl font-bold leading-none font-mono">
                {new Date(r.submittedAt).getDate()}
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                <RumorMeta rumor={r} />
              </div>
              <h3 className="font-semibold leading-tight">{r.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
              <div className="md:hidden pt-1"><IntensityBar rumor={r} /></div>
            </div>
            <div className="w-32 shrink-0 hidden md:block">
              <IntensityBar rumor={r} />
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="glass-panel p-8 text-center text-muted-foreground text-sm">No rumors match your filters.</Card>
        )}
      </div>

      <RumorDetailDialog rumor={open} onClose={() => setOpen(null)} />

    </div>
  );
}
