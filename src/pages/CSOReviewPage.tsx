import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Check,
  X,
  Loader2,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  Calendar,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { relativeTime } from '@/lib/rumor-utils';

interface CsoRequestRow {
  id: string;
  organization_name: string;
  legal_name: string | null;
  registration_number: string | null;
  country: string;
  country_code: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  description: string;
  mission_statement: string | null;
  staff_count: number | null;
  years_active: number | null;
  ifcn_signatory: boolean | null;
  methodology_url: string | null;
  corrections_policy_url: string | null;
  funding_disclosure_url: string | null;
  ownership_disclosure_url: string | null;
  status: string;
  submitted_at: string;
  reviewer_notes: string | null;
}

interface CsoDocRow {
  id: string;
  request_id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export default function CSOReviewPage() {
  const { user, isStaff, loading } = useAuth();
  const [requests, setRequests] = useState<CsoRequestRow[]>([]);
  const [docs, setDocs] = useState<Record<string, CsoDocRow[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CsoRequestRow | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  async function load() {
    const { data: reqs, error: reqErr } = await supabase
      .from('cso_verification_requests')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (reqErr) {
      toast.error('Could not load CSO requests');
      console.error(reqErr);
      return;
    }
    setRequests(reqs ?? []);
    const ids = (reqs ?? []).map((r) => r.id);
    if (ids.length === 0) {
      setDocs({});
      return;
    }
    const { data: docRows } = await supabase
      .from('cso_documents')
      .select('*')
      .in('request_id', ids);
    const grouped: Record<string, CsoDocRow[]> = {};
    for (const d of docRows ?? []) {
      grouped[d.request_id] = grouped[d.request_id] ?? [];
      grouped[d.request_id].push(d as CsoDocRow);
    }
    setDocs(grouped);
  }

  useEffect(() => {
    if (isStaff) load();
  }, [isStaff]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;

  async function approve(req: CsoRequestRow) {
    setBusy(req.id);
    const { error } = await supabase.rpc('approve_cso_request', {
      _request_id: req.id,
      _notes: null,
    });
    setBusy(null);
    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }
    toast.success(`Approved ${req.organization_name} — added to CSO network`);
    load();
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setBusy(rejectTarget.id);
    const { error } = await supabase.rpc('reject_cso_request', {
      _request_id: rejectTarget.id,
      _notes: rejectNotes || null,
    });
    setBusy(null);
    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }
    toast.success('Request rejected');
    setRejectTarget(null);
    setRejectNotes('');
    load();
  }

  async function openDoc(doc: CsoDocRow) {
    const { data, error } = await supabase.storage
      .from('cso-documents')
      .createSignedUrl(doc.file_path, 600);
    if (error || !data?.signedUrl) {
      toast.error('Could not generate document link');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const visible = tab === 'pending' ? requests.filter((r) => r.status === 'pending') : requests;

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Staff console</div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> CSO verification queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review applications from civil society organizations applying to publish debunks on Rumor Radar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === 'pending' ? 'default' : 'outline'}
            onClick={() => setTab('pending')}
          >
            Pending ({requests.filter((r) => r.status === 'pending').length})
          </Button>
          <Button size="sm" variant={tab === 'all' ? 'default' : 'outline'} onClick={() => setTab('all')}>
            All ({requests.length})
          </Button>
        </div>
      </div>

      {visible.length === 0 && (
        <Card className="glass-panel p-8 text-center text-sm text-muted-foreground">
          No CSO requests in this view.
        </Card>
      )}

      <div className="space-y-3">
        {visible.map((r) => (
          <Card key={r.id} className="glass-panel p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{r.organization_name}</h3>
                  <StatusPill status={r.status} />
                  {r.ifcn_signatory && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <ShieldCheck className="h-3 w-3" /> IFCN
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {r.country}
                  {r.legal_name && r.legal_name !== r.organization_name && ` · ${r.legal_name}`}
                  {r.registration_number && ` · #${r.registration_number}`} · {relativeTime(r.submitted_at)}
                </div>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="border-success/40 text-success hover:bg-success/10 gap-1.5"
                    variant="outline"
                    disabled={busy === r.id}
                    onClick={() => approve(r)}
                  >
                    {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
                    disabled={busy === r.id}
                    onClick={() => setRejectTarget(r)}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{r.description}</p>
            {r.mission_statement && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
                {r.mission_statement}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <DetailRow icon={<Mail className="h-3 w-3" />} label="Contact">
                {r.contact_name} — {r.contact_email}
              </DetailRow>
              {r.contact_phone && (
                <DetailRow icon={<Phone className="h-3 w-3" />} label="Phone">
                  {r.contact_phone}
                </DetailRow>
              )}
              {r.website && (
                <DetailRow icon={<Globe className="h-3 w-3" />} label="Website">
                  <a href={r.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {r.website.replace(/^https?:\/\//, '')}
                  </a>
                </DetailRow>
              )}
              {(r.years_active !== null || r.staff_count !== null) && (
                <DetailRow icon={<Calendar className="h-3 w-3" />} label="Org">
                  {r.years_active !== null && `${r.years_active} years active`}
                  {r.years_active !== null && r.staff_count !== null && ' · '}
                  {r.staff_count !== null && `${r.staff_count} staff`}
                </DetailRow>
              )}
            </div>

            {/* Documents */}
            <div className="border-t border-border pt-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Supporting documents ({(docs[r.id] ?? []).length})
              </div>
              {(docs[r.id] ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground italic">No documents attached.</div>
              ) : (
                <ul className="space-y-1">
                  {(docs[r.id] ?? []).map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="truncate">
                          <span className="font-medium">{d.file_name}</span>
                          <span className="text-muted-foreground ml-1">
                            · {d.doc_type}
                            {d.size_bytes ? ` · ${Math.round(d.size_bytes / 1024)} KB` : ''}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={() => openDoc(d)}>
                        <ExternalLink className="h-3 w-3" /> Open
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {r.reviewer_notes && (
              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                <span className="font-mono uppercase tracking-wider">Reviewer notes:</span> {r.reviewer_notes}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Optionally include a note explaining the reason. The applicant may resubmit later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Reviewer notes (optional)
            </Label>
            <Textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Need clearer evidence of editorial independence."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!!busy}>
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'approved'
      ? 'border-success/40 text-success bg-success/10'
      : status === 'rejected'
        ? 'border-destructive/40 text-destructive bg-destructive/10'
        : 'border-warning/40 text-warning bg-warning/10';
  return (
    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {status}
    </span>
  );
}
