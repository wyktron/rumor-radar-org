import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge, IntensityBar } from '@/components/RumorBits';
import { Check, X, ShieldCheck, ShieldAlert, Activity, Users, Sliders, Languages, Loader2, KeyRound, Radar, Heart, Copy, ExternalLink } from 'lucide-react';
import { relativeTime } from '@/lib/rumor-utils';
import { toast } from 'sonner';
import { RolesAdmin } from '@/components/admin/RolesAdmin';

export default function DashboardPage() {
  // Authentication state comes from Supabase, not from client-side localStorage.
  // Roles are loaded server-side from the user_roles table via AuthContext.
  const { user, loading, isStaff, roles } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (isStaff) return <ModeratorDashboard />;
  if (roles.includes('cso_member')) return <CSODashboard />;
  return <Navigate to="/" replace />;
}

function ModeratorDashboard() {
  const {
    rumors, csos, submissions, debunkSubmissions, csoRegistrations,
    approveSubmission, rejectSubmission, approveDebunk, rejectDebunk,
    approveCSORegistration, rejectCSORegistration, updateRumorIntensity,
    approveRumor, rejectRumor, bulkApproveRumors,
  } = useApp();
  const { user, isAdmin } = useAuth();
  const displayName = (user?.user_metadata as { display_name?: string } | undefined)?.display_name
    ?? user?.email
    ?? 'operator';
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  async function handleTranslate(rumorId: string) {
    setTranslatingId(rumorId);
    try {
      const { data, error } = await supabase.functions.invoke('translate-rumor', {
        body: { rumorId },
      });
      if (error) throw error;
      toast.success(`Translated to ${(data?.languages ?? []).length} languages`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Translation failed';
      toast.error(msg);
    } finally {
      setTranslatingId(null);
    }
  }

  const stats = useMemo(() => ({
    total: rumors.length,
    debunked: rumors.filter((r) => r.status === 'debunked').length,
    verified: rumors.filter((r) => r.status === 'verified-true').length,
    pending: rumors.filter((r) => r.status === 'pending').length,
    csos: csos.length,
  }), [rumors, csos]);

  return (
    <div className="container py-6 space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Moderator console</div>
        <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending-rumors">
            Pending rumors <span className="ml-1.5 text-[10px] text-warning">{rumors.filter((r) => r.status === 'pending').length}</span>
          </TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions <span className="ml-1.5 text-[10px] text-warning">{submissions.filter((s) => s.status === 'pending').length}</span>
          </TabsTrigger>
          <TabsTrigger value="debunks">
            Debunks <span className="ml-1.5 text-[10px] text-warning">{debunkSubmissions.filter((d) => d.status === 'pending').length}</span>
          </TabsTrigger>
          <TabsTrigger value="registrations">
            CSOs <span className="ml-1.5 text-[10px] text-warning">{csoRegistrations.filter((r) => r.status === 'pending').length}</span>
          </TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="roles" className="gap-1.5">
              <KeyRound className="h-3 w-3" /> Roles
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={<Activity />} label="Total rumors" value={stats.total} />
            <StatCard icon={<ShieldCheck className="text-signal-debunked" />} label="Debunked" value={stats.debunked} />
            <StatCard icon={<ShieldCheck className="text-signal-verified" />} label="Verified true" value={stats.verified} />
            <StatCard icon={<ShieldAlert className="text-warning" />} label="Pending" value={stats.pending} />
            <StatCard icon={<Users className="text-primary" />} label="CSO partners" value={stats.csos} />
          </div>
          <ScrapeRumorsPanel />
          <HelpLovedOnePanel />
        </TabsContent>

        <TabsContent value="pending-rumors" className="space-y-2">
          <PendingRumorsPanel
            rumors={rumors.filter((r) => r.status === 'pending')}
            onApprove={approveRumor}
            onReject={rejectRumor}
            onBulkApprove={bulkApproveRumors}
          />
        </TabsContent>

        <TabsContent value="submissions" className="space-y-2">
          {submissions.filter((s) => s.status === 'pending').length === 0 && <Empty>No pending submissions.</Empty>}
          {submissions.filter((s) => s.status === 'pending').map((s) => (
            <Card key={s.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="text-xs font-mono text-muted-foreground">Origin: {s.originCountry}{s.subjectCountry && s.subjectCountry !== s.originCountry && ` → about ${s.subjectCountry}`} · {s.topic} · {relativeTime(s.submittedAt)}{s.source && ` · via ${s.source}`}</div>
                  <h4 className="font-semibold">{s.claim}</h4>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="border-success/40 text-success hover:bg-success/10" onClick={() => { approveSubmission(s.id); toast.success('Approved & published to map'); }}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { rejectSubmission(s.id); toast('Rejected'); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="debunks" className="space-y-2">
          {debunkSubmissions.filter((d) => d.status === 'pending').length === 0 && <Empty>No pending debunks.</Empty>}
          {debunkSubmissions.filter((d) => d.status === 'pending').map((d) => {
            const r = rumors.find((rr) => rr.id === d.rumorId);
            return (
              <Card key={d.id} className="glass-panel p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-muted-foreground">
                      {d.csoName} · {d.submissionType === 'debunk' ? 'Debunk' : 'Verify true'} · {relativeTime(d.submittedAt)}
                    </div>
                    <h4 className="font-semibold mt-1">Re: {r?.title ?? d.rumorId}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{d.content}</p>
                    {d.sources.length > 0 && (
                      <ul className="mt-2 text-xs space-y-0.5">
                        {d.sources.map((s) => <li key={s}><a className="text-primary hover:underline" href={s} target="_blank" rel="noreferrer">{s}</a></li>)}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="border-success/40 text-success hover:bg-success/10" onClick={() => { approveDebunk(d.id); toast.success('Debunk published'); }}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { rejectDebunk(d.id); toast('Rejected'); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="registrations" className="space-y-2">
          {csoRegistrations.filter((r) => r.status === 'pending').length === 0 && <Empty>No pending CSO registrations.</Empty>}
          {csoRegistrations.filter((r) => r.status === 'pending').map((r) => (
            <Card key={r.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-xs font-mono text-muted-foreground">{r.country} · {relativeTime(r.submittedAt)}</div>
                  <h4 className="font-semibold">{r.organizationName}</h4>
                  <div className="text-xs text-muted-foreground">Contact: {r.contactName} ({r.contactEmail}){r.website && ` · ${r.website}`}</div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="border-success/40 text-success hover:bg-success/10" onClick={() => { approveCSORegistration(r.id); toast.success('CSO admitted to network'); }}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { rejectCSORegistration(r.id); toast('Rejected'); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trending" className="space-y-2">
          <Card className="glass-panel p-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
              <Sliders className="h-3.5 w-3.5" /> Adjust signal intensity per rumor — updates the heatmap in real time
            </div>
            <div className="space-y-3">
              {rumors.filter((r) => r.status === 'pending').slice(0, 12).map((r) => (
                <div key={r.id} className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-center border-b border-border/50 pb-3 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-muted-foreground font-mono">{r.originCountry}</span>
                    </div>
                    <div className="text-sm font-medium line-clamp-1">{r.title}</div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] gap-1 text-primary"
                      disabled={translatingId === r.id}
                      onClick={() => handleTranslate(r.id)}
                    >
                      {translatingId === r.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Languages className="h-3 w-3" />}
                      Translate (AI)
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Slider
                      value={[r.intensity * 100]}
                      onValueChange={([v]) => updateRumorIntensity(r.id, v / 100)}
                      max={100}
                      step={1}
                    />
                    <div className="text-[10px] font-mono text-right text-muted-foreground">{Math.round(r.intensity * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="roles">
            <RolesAdmin />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function CSODashboard() {
  const { rumors, debunkSubmissions, submitDebunk } = useApp();
  const { user } = useAuth();
  const displayName = (user?.user_metadata as { display_name?: string } | undefined)?.display_name
    ?? user?.email
    ?? 'partner';
  // Resolve the CSO membership for this authenticated user from the database.
  // Never trust client-stored role/csoId.
  const [csoId, setCsoId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('cso_members')
        .select('cso_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setCsoId(data?.cso_id ?? null);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const myDebunks = debunkSubmissions.filter((d) => d.csoId === csoId);
  const [rumorId, setRumorId] = useState('');
  const [type, setType] = useState<'debunk' | 'verify-true'>('debunk');
  const [content, setContent] = useState('');
  const [sourcesText, setSourcesText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csoId) {
      toast.error('No CSO membership found for your account. Contact a moderator.');
      return;
    }
    if (!rumorId || content.trim().length < 10) {
      toast.error('Please pick a rumor and write at least 10 characters');
      return;
    }
    const sources = sourcesText.split(/\s+/).filter((s) => /^https?:\/\//.test(s));
    if (sources.length === 0) {
      toast.error('Add at least one valid source URL (https://…)');
      return;
    }
    submitDebunk({
      rumorId,
      csoId,
      content,
      sources,
      submissionType: type,
    });
    toast.success('Submission sent for moderator review');
    setRumorId(''); setContent(''); setSourcesText('');
  }

  return (
    <div className="container py-6 space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">CSO console</div>
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
      </div>

      <Tabs defaultValue="submit" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="submit">Submit debunk</TabsTrigger>
          <TabsTrigger value="mine">My submissions ({myDebunks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <Card className="glass-panel p-5">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Target rumor</Label>
                <Select value={rumorId} onValueChange={setRumorId}>
                  <SelectTrigger><SelectValue placeholder="Select a rumor to review" /></SelectTrigger>
                  <SelectContent>
                    {reviewableRumors.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No rumors awaiting review right now.</div>
                    )}
                    {reviewableRumors.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Verdict</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'debunk' | 'verify-true')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debunk">Debunk — false / misleading</SelectItem>
                    <SelectItem value="verify-true">Verify — true</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Analysis</Label>
                <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} maxLength={1500} placeholder="Explain your investigation findings…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sources (one URL per line)</Label>
                <Textarea rows={3} value={sourcesText} onChange={(e) => setSourcesText(e.target.value)} placeholder="https://example.org/report" />
              </div>
              <Button type="submit" className="font-mono uppercase tracking-wider text-xs">Transmit verdict</Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="mine" className="space-y-2">
          {myDebunks.length === 0 && <Empty>You have not submitted any debunks yet.</Empty>}
          {myDebunks.map((d) => {
            const r = rumors.find((rr) => rr.id === d.rumorId);
            return (
              <Card key={d.id} className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                    d.status === 'approved' ? 'border-success/40 text-success' :
                    d.status === 'rejected' ? 'border-destructive/40 text-destructive' :
                    'border-warning/40 text-warning'
                  }`}>{d.status}</span>
                  <span className="text-xs font-mono text-muted-foreground">{d.submissionType} · {relativeTime(d.submittedAt)}</span>
                </div>
                <div className="font-semibold">Re: {r?.title ?? d.rumorId}</div>
                <p className="text-sm text-muted-foreground mt-1">{d.content}</p>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="glass-panel p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </div>
      <div className="text-3xl font-bold font-mono">{value}</div>
    </Card>
  );
}

const SCRAPE_PHASES = [
  { id: 'europe', label: 'Europe' },
  { id: 'americas', label: 'Americas' },
  { id: 'mena', label: 'MENA' },
  { id: 'africa', label: 'Sub-Saharan Africa' },
  { id: 'asia-oceania', label: 'Asia & Oceania' },
] as const;

type PhaseId = typeof SCRAPE_PHASES[number]['id'];

function ScrapeRumorsPanel() {
  const [running, setRunning] = useState<PhaseId | 'all' | null>(null);
  const [log, setLog] = useState<string[]>([]);

  function append(line: string) {
    setLog((l) => [...l.slice(-30), line]);
  }

  async function runPhase(phase: PhaseId): Promise<{ inserted: number; extracted: number } | null> {
    append(`▶ Starting ${phase}…`);
    const { data, error } = await supabase.functions.invoke('scrape-rumors-perplexity', {
      body: { phase },
    });
    if (error) {
      append(`✗ ${phase}: ${error.message}`);
      toast.error(`${phase}: ${error.message}`);
      return null;
    }
    if (data?.error) {
      append(`✗ ${phase}: ${data.error}`);
      toast.error(`${phase}: ${data.error}`);
      return null;
    }
    append(`✓ ${phase}: extracted ${data.extracted}, inserted ${data.inserted}`);
    return { inserted: data.inserted ?? 0, extracted: data.extracted ?? 0 };
  }

  async function runAll() {
    setRunning('all');
    let totalInserted = 0;
    for (const p of SCRAPE_PHASES) {
      const res = await runPhase(p.id);
      if (res) totalInserted += res.inserted;
    }
    setRunning(null);
    toast.success(`Scrape complete. ${totalInserted} new rumors added.`);
  }

  async function runOne(phase: PhaseId) {
    setRunning(phase);
    await runPhase(phase);
    setRunning(null);
  }

  return (
    <Card className="glass-panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <Radar className="h-3 w-3" /> AI Rumor Scraper
          </div>
          <h3 className="text-base font-semibold mt-0.5">Pull this week's misinformation from the open web</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Uses real-time web search across Reddit, Telegram, fringe news and social media, then classifies
            each item with AI and drops it on the map as <span className="text-warning font-mono">pending</span> for review.
          </p>
        </div>
        <Button onClick={runAll} disabled={running !== null} className="shrink-0">
          {running === 'all' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Radar className="h-4 w-4 mr-1.5" />}
          Run all phases
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {SCRAPE_PHASES.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            size="sm"
            disabled={running !== null}
            onClick={() => runOne(p.id)}
            className="justify-start text-xs"
          >
            {running === p.id ? (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
            )}
            {p.label}
          </Button>
        ))}
      </div>

      {log.length > 0 && (
        <div className="rounded border border-border bg-background/50 p-2 max-h-48 overflow-auto font-mono text-[11px] space-y-0.5">
          {log.map((line, i) => (
            <div key={i} className={line.startsWith('✗') ? 'text-destructive' : line.startsWith('✓') ? 'text-success' : 'text-muted-foreground'}>
              {line}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PendingRumorsPanel({
  rumors,
  onApprove,
  onReject,
  onBulkApprove,
}: {
  rumors: ReturnType<typeof useApp>['rumors'];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onBulkApprove: (ids: string[]) => Promise<number>;
}) {
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rumors;
    return rumors.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.originCountry.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q),
    );
  }, [rumors, query]);

  async function handleBulkApproveAll() {
    if (filtered.length === 0) return;
    if (!confirm(`Approve all ${filtered.length} pending rumors? They will appear on the public map immediately.`)) return;
    setBusy(true);
    const n = await onBulkApprove(filtered.map((r) => r.id));
    setBusy(false);
    if (n > 0) toast.success(`Approved ${n} rumors`);
  }

  if (rumors.length === 0) {
    return <Empty>No pending rumors. Run the AI scraper from the Overview tab.</Empty>;
  }

  return (
    <Card className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Pending rumors</div>
          <h3 className="text-base font-semibold mt-0.5">
            {rumors.length} rumors awaiting review
            {filtered.length !== rumors.length && ` (${filtered.length} filtered)`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            These were ingested by the AI scraper or other automated sources. Approve to publish on the public map.
          </p>
        </div>
        <Button onClick={handleBulkApproveAll} disabled={busy || filtered.length === 0} className="shrink-0">
          {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Approve all ({filtered.length})
        </Button>
      </div>

      <Input
        placeholder="Filter by title, country or topic…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="space-y-2 max-h-[600px] overflow-auto pr-1">
        {filtered.map((r) => (
          <div key={r.id} className="border border-border/50 rounded p-3 space-y-2 bg-background/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className="text-primary">{r.originCountry}</span>
                  <span>·</span>
                  <span>{r.topic}</span>
                  <span>·</span>
                  <span>{relativeTime(r.submittedAt)}</span>
                </div>
                <h4 className="font-semibold text-sm mt-1">{r.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-success/40 text-success hover:bg-success/10"
                  onClick={async () => { await onApprove(r.id); toast.success('Published to map'); }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={async () => { await onReject(r.id); toast('Rejected'); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">{children}</Card>;
}

// ---------------------------------------------------------------------------
// Help a loved one — staff-only access point + referral link generator.
// The public page is unlisted: callers receive a personal referral link.
// ---------------------------------------------------------------------------
function HelpLovedOnePanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [code, setCode] = useState('');

  useEffect(() => {
    supabase
      .from('loved_one_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(25)
      .then(({ data }) => setRequests(data ?? []));
  }, []);

  const link = `${window.location.origin}/help-a-loved-one${code ? `?ref=${encodeURIComponent(code)}` : ''}`;

  function generate() {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    setCode(`CALL-${rand}`);
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Heart className="h-4 w-4 text-primary" /> Help a loved one
        </h3>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/help-a-loved-one">
            <ExternalLink className="h-3.5 w-3.5" /> Open the form
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        The page is unlisted. Send a referral link only to people who have already used the hotline —
        every requester must pass identity verification before the request is accepted.
      </p>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="secondary" onClick={generate}>Generate referral link</Button>
        <Input readOnly value={link} className="flex-1 min-w-[220px] font-mono text-xs" />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast.success('Copied successfully');
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Recent requests ({requests.length})
        </p>
        {requests.length === 0 && <p className="text-xs text-muted-foreground">No outreach requests yet.</p>}
        {requests.map((r) => (
          <div key={r.id} className="rounded-md border border-border p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold">
                {r.relationship} · {r.country} · {r.contact_method}
              </span>
              <span className="text-muted-foreground">{relativeTime(r.submitted_at)}</span>
            </div>
            <p className="text-muted-foreground">{r.notes}</p>
            <div className="flex gap-2 flex-wrap text-[11px] text-muted-foreground">
              <span>Requester: {r.requester_full_name ?? '—'}</span>
              <span>ID: {r.id_verification_status ?? 'unverified'}</span>
              {r.referral_code && <span>Ref: {r.referral_code}</span>}
              <span>Status: {r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
