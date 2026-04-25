import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
import { Check, X, ShieldCheck, ShieldAlert, Activity, Users, Sliders, Languages, Loader2, KeyRound } from 'lucide-react';
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
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={<Activity />} label="Total rumors" value={stats.total} />
            <StatCard icon={<ShieldCheck className="text-success" />} label="Debunked" value={stats.debunked} />
            <StatCard icon={<ShieldCheck className="text-signal-verified" />} label="Verified true" value={stats.verified} />
            <StatCard icon={<ShieldAlert className="text-warning" />} label="Pending" value={stats.pending} />
            <StatCard icon={<Users className="text-primary" />} label="CSO partners" value={stats.csos} />
          </div>
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
                  <SelectTrigger><SelectValue placeholder="Select a pending rumor" /></SelectTrigger>
                  <SelectContent>
                    {rumors.filter((r) => r.status === 'pending').map((r) => (
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

function Empty({ children }: { children: React.ReactNode }) {
  return <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">{children}</Card>;
}
