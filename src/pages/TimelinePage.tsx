import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, TOPICS } from '@/constants/countries';
import { StatusBadge, IntensityBar, RumorMeta } from '@/components/RumorBits';

export default function TimelinePage() {
  const { rumors } = useApp();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('all');
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return [...rumors]
      .filter(
        (r) =>
          (country === 'all' || r.country === country) &&
          (topic === 'all' || r.topic === topic) &&
          (status === 'all' || r.status === status) &&
          (!ql || r.title.toLowerCase().includes(ql) || r.description.toLowerCase().includes(ql)),
      )
      .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [rumors, q, country, topic, status]);

  return (
    <div className="container py-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-sm text-muted-foreground">Chronological feed of rumors flagged by the network.</p>
      </div>

      <Card className="glass-panel p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rumors…" className="pl-8 h-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
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
          <Collapsible key={r.id} asChild>
            <Card className="glass-panel">
              <CollapsibleTrigger className="w-full text-left p-4 flex items-start gap-4 group">
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
                </div>
                <div className="w-32 shrink-0 hidden md:block">
                  <IntensityBar rumor={r} />
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 -mt-2">
                <div className="border-t border-border pt-3 space-y-3 text-sm">
                  <p>{r.description}</p>
                  <div className="md:hidden"><IntensityBar rumor={r} /></div>
                  {r.debunkContent && (
                    <div className="rounded-md border border-success/30 bg-success/5 p-3">
                      <div className="text-xs font-mono uppercase tracking-wider text-success mb-1">Debunked by {r.debunkedBy}</div>
                      <p>{r.debunkContent}</p>
                    </div>
                  )}
                  {r.verificationContent && (
                    <div className="rounded-md border border-signal-verified/30 bg-signal-verified/5 p-3">
                      <div className="text-xs font-mono uppercase tracking-wider text-signal-verified mb-1">Verified true by {r.verifiedBy}</div>
                      <p>{r.verificationContent}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
        {filtered.length === 0 && (
          <Card className="glass-panel p-8 text-center text-muted-foreground text-sm">No rumors match your filters.</Card>
        )}
      </div>
    </div>
  );
}
