import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, TrendingUp, Globe, Users, Download, FileJson, FileSpreadsheet } from 'lucide-react';

export default function ImpactPage() {
  const { rumors, csos } = useApp();

  const byTopic = useMemo(() => {
    const m: Record<string, { total: number; debunked: number }> = {};
    rumors.forEach((r) => {
      m[r.topic] ??= { total: 0, debunked: 0 };
      m[r.topic].total += 1;
      if (r.status === 'debunked') m[r.topic].debunked += 1;
    });
    return Object.entries(m).map(([k, v]) => ({ topic: k, ...v }));
  }, [rumors]);

  const byCountry = useMemo(() => {
    const m: Record<string, number> = {};
    rumors.forEach((r) => { m[r.originCountry] = (m[r.originCountry] ?? 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rumors]);

  const debunkedTotal = rumors.filter((r) => r.status === 'debunked').length;
  const debunkRate = rumors.length === 0 ? 0 : Math.round((debunkedTotal / rumors.length) * 100);
  const maxTopic = Math.max(1, ...byTopic.map((t) => t.total));
  const maxCountry = byCountry[0]?.[1] ?? 1;

  return (
    <div className="container py-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Impact</h1>
        <p className="text-sm text-muted-foreground">How the network is performing across geographies and topics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigStat icon={<TrendingUp className="text-primary" />} label="Signals tracked" value={rumors.length} />
        <BigStat icon={<ShieldCheck className="text-success" />} label="Debunked" value={debunkedTotal} />
        <BigStat icon={<Users className="text-primary" />} label="CSO partners" value={csos.length} />
        <BigStat icon={<Globe className="text-warning" />} label="Debunk rate" value={`${debunkRate}%`} />
      </div>

      <Card className="glass-panel p-5">
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Signals by topic</h2>
        <div className="space-y-3">
          {byTopic.map((t) => (
            <div key={t.topic} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{t.topic}</span>
                <span className="font-mono text-muted-foreground">{t.debunked} debunked / {t.total} total</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden relative">
                <div className="h-full bg-primary/30" style={{ width: `${(t.total / maxTopic) * 100}%` }} />
                <div className="absolute inset-y-0 left-0 bg-success" style={{ width: `${(t.debunked / maxTopic) * 100}%`, boxShadow: '0 0 8px hsl(var(--success))' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-panel p-5">
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Top countries by signal volume</h2>
        <div className="space-y-2">
          {byCountry.map(([country, count]) => (
            <div key={country} className="grid grid-cols-[160px_1fr_40px] items-center gap-3 text-xs">
              <span className="truncate">{country}</span>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-signal" style={{ width: `${(count / maxCountry) * 100}%` }} />
              </div>
              <span className="font-mono text-right text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BigStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="glass-panel p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="h-4 w-4">{icon}</div>
      </div>
      <div className="text-3xl font-bold font-mono mt-2">{value}</div>
    </Card>
  );
}
