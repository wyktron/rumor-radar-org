import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Rumor,
  RumorSubmission,
  DebunkSubmission,
  CSORegistration,
  CSO,
  LovedOneSubmission,
  Topic,
  RumorStatus,
  Language,
  LovedOneContactMethod,
  LovedOneCallTime,
  LovedOneStatus,
} from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ---------- Row → domain mappers ----------

type RumorRow = {
  id: string;
  title: string;
  description: string;
  origin_country: string;
  subject_country: string | null;
  topic: string;
  latitude: number;
  longitude: number;
  intensity: number;
  status: RumorStatus;
  source_language: string;
  submitted_at: string;
  debunked_by: string | null;
  debunked_at: string | null;
  debunk_content: string | null;
  debunk_sources: string[] | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_content: string | null;
  verification_sources: string[] | null;
};

function rowToRumor(row: RumorRow): Rumor {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    originCountry: row.origin_country,
    subjectCountry: row.subject_country ?? undefined,
    topic: row.topic as Topic,
    coordinates: [Number(row.latitude), Number(row.longitude)],
    intensity: Number(row.intensity),
    status: row.status,
    submittedAt: row.submitted_at,
    sourceLanguage: (row.source_language || 'en') as Language,
    debunkedBy: row.debunked_by ?? undefined,
    debunkedAt: row.debunked_at ?? undefined,
    debunkContent: row.debunk_content ?? undefined,
    debunkSources: row.debunk_sources ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    verificationContent: row.verification_content ?? undefined,
    verificationSources: row.verification_sources ?? undefined,
  };
}

type CSORow = {
  id: string;
  name: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  description: string;
  website: string | null;
  contact_email: string | null;
  date_joined: string;
};

function rowToCSO(row: CSORow): CSO {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    coordinates: [Number(row.latitude ?? 0), Number(row.longitude ?? 0)],
    verified: row.verified,
    description: row.description,
    website: row.website ?? undefined,
    contactEmail: row.contact_email ?? '',
    dateJoined: row.date_joined,
  };
}

type SubmissionRow = {
  id: string;
  claim: string;
  description: string | null;
  origin_country: string;
  origin_latitude: number | null;
  origin_longitude: number | null;
  subject_country: string | null;
  topic: string;
  source: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
};

function rowToSubmission(row: SubmissionRow): RumorSubmission {
  return {
    id: row.id,
    claim: row.claim,
    description: row.description ?? undefined,
    originCountry: row.origin_country,
    originCoordinates: [Number(row.origin_latitude ?? 0), Number(row.origin_longitude ?? 0)],
    subjectCountry: row.subject_country ?? undefined,
    topic: row.topic as Topic,
    source: row.source ?? undefined,
    submittedAt: row.submitted_at,
    status: row.status,
  };
}

type DebunkRow = {
  id: string;
  rumor_id: string;
  cso_id: string;
  cso_name: string;
  content: string;
  sources: string[];
  submission_type: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
};

function rowToDebunk(row: DebunkRow): DebunkSubmission {
  return {
    id: row.id,
    rumorId: row.rumor_id,
    csoId: row.cso_id,
    csoName: row.cso_name,
    content: row.content,
    sources: row.sources ?? [],
    submissionType: (row.submission_type === 'verify-true' ? 'verify-true' : 'debunk'),
    submittedAt: row.submitted_at,
    status: row.status,
  };
}

type CSORegRow = {
  id: string;
  organization_name: string;
  country: string;
  contact_name: string;
  contact_email: string;
  website: string | null;
  description: string;
  submitted_at: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
};

function rowToCSORegistration(row: CSORegRow): CSORegistration {
  // Map DB enum to UI enum (UI only knows pending/approved/rejected).
  const status: 'pending' | 'approved' | 'rejected' =
    row.status === 'approved' ? 'approved' :
    row.status === 'rejected' ? 'rejected' : 'pending';
  return {
    id: row.id,
    organizationName: row.organization_name,
    country: row.country,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    website: row.website ?? undefined,
    description: row.description,
    submittedAt: row.submitted_at,
    status,
  };
}

type LovedOneRow = {
  id: string;
  contact_method: LovedOneContactMethod;
  contact_value: string;
  best_time_to_call: string | null;
  country: string;
  relationship: string;
  notes: string;
  submitted_at: string;
  status: 'pending' | 'contacted' | 'completed' | 'unable_to_reach';
};

function rowToLovedOne(row: LovedOneRow): LovedOneSubmission {
  const status: LovedOneStatus =
    row.status === 'contacted' ? 'contacted' :
    row.status === 'completed' ? 'completed' : 'pending';
  return {
    id: row.id,
    contactMethod: row.contact_method,
    contactValue: row.contact_value,
    bestTimeToCall: (row.best_time_to_call as LovedOneCallTime | null) ?? undefined,
    country: row.country,
    relationship: row.relationship,
    notes: row.notes,
    submittedAt: row.submitted_at,
    status,
  };
}

// ---------- Context shape ----------

interface AppState {
  rumors: Rumor[];
  csos: CSO[];
  submissions: RumorSubmission[];
  debunkSubmissions: DebunkSubmission[];
  csoRegistrations: CSORegistration[];
  lovedOneSubmissions: LovedOneSubmission[];
  // rumors
  updateRumorIntensity: (id: string, intensity: number) => Promise<void>;
  updateRumorCoordinates: (id: string, coords: [number, number]) => Promise<void>;
  approveRumor: (id: string) => Promise<void>;
  rejectRumor: (id: string) => Promise<void>;
  bulkApproveRumors: (ids: string[]) => Promise<number>;
  // submissions
  submitRumor: (s: Omit<RumorSubmission, 'id' | 'submittedAt' | 'status'>) => void;
  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string) => Promise<void>;
  // debunks
  submitDebunk: (d: Omit<DebunkSubmission, 'id' | 'submittedAt' | 'status' | 'csoName'>) => Promise<void>;
  approveDebunk: (id: string) => Promise<void>;
  rejectDebunk: (id: string) => Promise<void>;
  // registrations
  registerCSO: (r: Omit<CSORegistration, 'id' | 'submittedAt' | 'status'>) => void;
  approveCSORegistration: (id: string) => Promise<void>;
  rejectCSORegistration: (id: string) => Promise<void>;
  // loved one outreach
  addLovedOneSubmission: (s: Omit<LovedOneSubmission, 'id' | 'submittedAt' | 'status'>) => void;
}

const AppContext = createContext<AppState | null>(null);

// Columns we re-use for selects.
const RUMOR_COLS =
  'id, title, description, origin_country, subject_country, topic, latitude, longitude, intensity, status, source_language, submitted_at, debunked_by, debunked_at, debunk_content, debunk_sources, verified_by, verified_at, verification_content, verification_sources';
const PUBLIC_STATUSES: RumorStatus[] = ['approved', 'debunked', 'verified-true'];

export function AppProvider({ children }: { children: ReactNode }) {
  const { isStaff } = useAuth();
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [csos, setCsos] = useState<CSO[]>([]);
  const [submissions, setSubmissions] = useState<RumorSubmission[]>([]);
  const [debunkSubmissions, setDebunkSubmissions] = useState<DebunkSubmission[]>([]);
  const [csoRegistrations, setCsoRegistrations] = useState<CSORegistration[]>([]);
  const [lovedOneSubmissions, setLovedOneSubmissions] = useState<LovedOneSubmission[]>([]);

  // One-time cleanup of legacy localStorage payloads from older builds.
  useEffect(() => {
    try {
      localStorage.removeItem('rumor-radar-user-v1');
      localStorage.removeItem('rumor-radar-state-v3');
    } catch {
      /* ignore */
    }
  }, []);

  // --- Public rumors + realtime ---
  useEffect(() => {
    let cancelled = false;

    const upsertLive = (incoming: Rumor[]) => {
      if (cancelled || incoming.length === 0) return;
      setRumors((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const r of incoming) byId.set(r.id, r);
        return Array.from(byId.values());
      });
    };

    const removeLive = (id: string) => {
      if (cancelled) return;
      setRumors((prev) => prev.filter((r) => r.id !== id));
    };

    const lastStatus = new Map<string, RumorStatus>();

    // Staff users also see 'pending' rumors so the moderation dashboard works.
    const visibleStatuses: RumorStatus[] = isStaff
      ? [...PUBLIC_STATUSES, 'pending', 'rejected']
      : PUBLIC_STATUSES;

    (async () => {
      const { data, error } = await supabase
        .from('rumors')
        .select(RUMOR_COLS)
        .in('status', visibleStatuses)
        .order('submitted_at', { ascending: false })
        .limit(1000);
      if (error) {
        console.warn('[rumors] initial load failed', error.message);
        return;
      }
      const rows = (data ?? []) as RumorRow[];
      for (const row of rows) lastStatus.set(row.id, row.status);
      upsertLive(rows.map(rowToRumor));
    })();

    const announce = (rumor: Rumor, prevStatus: RumorStatus | undefined) => {
      if (prevStatus === rumor.status) return;
      if (!PUBLIC_STATUSES.includes(rumor.status)) return;
      const titleByStatus: Record<string, string> = {
        approved: '🚨 New rumor on the radar',
        debunked: '✅ Rumor debunked',
        'verified-true': '⚠️ Rumor verified as true',
      };
      toast(titleByStatus[rumor.status] ?? 'Rumor updated', {
        description: `${rumor.title} — ${rumor.originCountry}`,
        duration: 8000,
        action: {
          label: 'View',
          onClick: () => window.location.assign(`/timeline?rumor=${rumor.id}`),
        },
      });
    };

    const channel = supabase
      .channel('rumors-public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rumors' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id;
            lastStatus.delete(id);
            removeLive(id);
            return;
          }
          const row = payload.new as RumorRow;
          const prev = lastStatus.get(row.id);
          lastStatus.set(row.id, row.status);
          if (!visibleStatuses.includes(row.status)) {
            removeLive(row.id);
            return;
          }
          const rumor = rowToRumor(row);
          upsertLive([rumor]);
          announce(rumor, prev);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isStaff]);

  // --- Public CSO directory + realtime ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('csos_public')
        .select('id, name, country, latitude, longitude, verified, description, website, date_joined')
        .order('date_joined', { ascending: false });
      if (error) {
        console.warn('[csos] initial load failed', error.message);
        return;
      }
      if (cancelled) return;
      // contact_email isn't exposed in the public view — pass empty string.
      setCsos((data ?? []).map((r) => rowToCSO({ ...(r as CSORow), contact_email: null })));
    })();

    const channel = supabase
      .channel('csos-public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'csos' },
        (payload) => {
          if (cancelled) return;
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id;
            setCsos((prev) => prev.filter((c) => c.id !== id));
            return;
          }
          const row = payload.new as CSORow;
          if (!row.verified) {
            setCsos((prev) => prev.filter((c) => c.id !== row.id));
            return;
          }
          const cso = rowToCSO(row);
          setCsos((prev) => {
            const i = prev.findIndex((c) => c.id === cso.id);
            if (i === -1) return [cso, ...prev];
            const next = prev.slice();
            next[i] = cso;
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Staff-only feeds: rumor_submissions, debunk_submissions, cso_verification_requests, loved_one_submissions ---
  // RLS already gates these to staff; non-staff users will simply get empty arrays.
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      const [subs, debs, regs, loved] = await Promise.all([
        supabase
          .from('rumor_submissions')
          .select('id, claim, description, origin_country, origin_latitude, origin_longitude, subject_country, topic, source, submitted_at, status')
          .order('submitted_at', { ascending: false })
          .limit(200),
        supabase
          .from('debunk_submissions')
          .select('id, rumor_id, cso_id, cso_name, content, sources, submission_type, submitted_at, status')
          .order('submitted_at', { ascending: false })
          .limit(200),
        supabase
          .from('cso_verification_requests')
          .select('id, organization_name, country, contact_name, contact_email, website, description, submitted_at, status')
          .order('submitted_at', { ascending: false })
          .limit(200),
        supabase
          .from('loved_one_submissions')
          .select('id, contact_method, contact_value, best_time_to_call, country, relationship, notes, submitted_at, status')
          .order('submitted_at', { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;
      if (!subs.error) setSubmissions(((subs.data ?? []) as SubmissionRow[]).map(rowToSubmission));
      if (!debs.error) setDebunkSubmissions(((debs.data ?? []) as DebunkRow[]).map(rowToDebunk));
      if (!regs.error) setCsoRegistrations(((regs.data ?? []) as CSORegRow[]).map(rowToCSORegistration));
      if (!loved.error) setLovedOneSubmissions(((loved.data ?? []) as LovedOneRow[]).map(rowToLovedOne));
    };

    loadAll();

    // Reload on auth state changes so a freshly-signed-in moderator sees the queues.
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      loadAll();
    });

    const channel = supabase
      .channel('staff-queues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rumor_submissions' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debunk_submissions' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cso_verification_requests' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loved_one_submissions' }, () => loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // ---------- Mutations ----------

  const updateRumorIntensity = useCallback(async (id: string, intensity: number) => {
    // Optimistic update for the slider UX.
    setRumors((rs) => rs.map((r) => (r.id === id ? { ...r, intensity } : r)));
    const { error } = await supabase.from('rumors').update({ intensity }).eq('id', id);
    if (error) {
      toast.error('Could not save intensity', { description: error.message });
    }
  }, []);

  const updateRumorCoordinates = useCallback(async (id: string, coords: [number, number]) => {
    setRumors((rs) => rs.map((r) => (r.id === id ? { ...r, coordinates: coords } : r)));
    const { error } = await supabase
      .from('rumors')
      .update({ latitude: coords[0], longitude: coords[1] })
      .eq('id', id);
    if (error) {
      toast.error('Could not save coordinates', { description: error.message });
    }
  }, []);

  const approveRumor = useCallback(async (id: string) => {
    setRumors((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'approved' as RumorStatus } : r)));
    const { error } = await supabase.from('rumors').update({ status: 'approved' }).eq('id', id);
    if (error) toast.error('Could not approve rumor', { description: error.message });
  }, []);

  const rejectRumor = useCallback(async (id: string) => {
    setRumors((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'rejected' as RumorStatus } : r)));
    const { error } = await supabase.from('rumors').update({ status: 'rejected' }).eq('id', id);
    if (error) toast.error('Could not reject rumor', { description: error.message });
  }, []);

  const bulkApproveRumors = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return 0;
    setRumors((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status: 'approved' as RumorStatus } : r)));
    const { error } = await supabase
      .from('rumors')
      .update({ status: 'approved' })
      .in('id', ids);
    if (error) {
      toast.error('Bulk approve failed', { description: error.message });
      return 0;
    }
    return ids.length;
  }, []);

  const approveSubmission = useCallback(async (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;
    // 1) mark the submission approved
    const { error: updateErr } = await supabase
      .from('rumor_submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (updateErr) {
      toast.error('Could not approve submission', { description: updateErr.message });
      return;
    }
    // 2) promote into rumors as 'approved' so it appears on the public map
    const { data: inserted, error: insertErr } = await supabase
      .from('rumors')
      .insert({
        title: sub.claim,
        description: sub.description ?? sub.claim,
        origin_country: sub.originCountry,
        subject_country: sub.subjectCountry ?? null,
        topic: sub.topic,
        latitude: sub.originCoordinates[0],
        longitude: sub.originCoordinates[1],
        intensity: 0.5,
        status: 'approved',
        source_language: 'en',
      })
      .select('id')
      .single();
    if (insertErr) {
      toast.error('Could not publish rumor', { description: insertErr.message });
      return;
    }
    if (inserted?.id) {
      await supabase
        .from('rumor_submissions')
        .update({ resulting_rumor_id: inserted.id })
        .eq('id', id);
    }
  }, [submissions]);

  const rejectSubmission = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('rumor_submissions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Could not reject submission', { description: error.message });
  }, []);

  const submitDebunk = useCallback(async (d: Omit<DebunkSubmission, 'id' | 'submittedAt' | 'status' | 'csoName'>) => {
    const { data: cso } = await supabase
      .from('csos')
      .select('name')
      .eq('id', d.csoId)
      .maybeSingle();
    const { error } = await supabase.from('debunk_submissions').insert({
      rumor_id: d.rumorId,
      cso_id: d.csoId,
      cso_name: cso?.name ?? 'Unknown CSO',
      content: d.content,
      sources: d.sources,
      submission_type: d.submissionType,
    });
    if (error) {
      toast.error('Could not submit debunk', { description: error.message });
      throw error;
    }
  }, []);

  const approveDebunk = useCallback(async (id: string) => {
    const deb = debunkSubmissions.find((d) => d.id === id);
    if (!deb) return;
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('debunk_submissions')
      .update({ status: 'approved', reviewed_at: nowIso })
      .eq('id', id);
    if (updErr) {
      toast.error('Could not approve debunk', { description: updErr.message });
      return;
    }
    const patch =
      deb.submissionType === 'debunk'
        ? {
            status: 'debunked' as RumorStatus,
            debunked_by: deb.csoName,
            debunked_at: nowIso,
            debunk_content: deb.content,
            debunk_sources: deb.sources,
            debunked_by_cso_id: deb.csoId,
          }
        : {
            status: 'verified-true' as RumorStatus,
            verified_by: deb.csoName,
            verified_at: nowIso,
            verification_content: deb.content,
            verification_sources: deb.sources,
            verified_by_cso_id: deb.csoId,
          };
    const { error: rumErr } = await supabase.from('rumors').update(patch).eq('id', deb.rumorId);
    if (rumErr) toast.error('Could not update rumor', { description: rumErr.message });
  }, [debunkSubmissions]);

  const rejectDebunk = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('debunk_submissions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Could not reject debunk', { description: error.message });
  }, []);

  const approveCSORegistration = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('approve_cso_request', { _request_id: id });
    if (error) toast.error('Could not approve CSO', { description: error.message });
  }, []);

  const rejectCSORegistration = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('reject_cso_request', { _request_id: id });
    if (error) toast.error('Could not reject CSO', { description: error.message });
  }, []);

  // No-op stubs for the legacy local-only mirror APIs. Submissions are written
  // directly to Supabase from their respective forms; the realtime subscription
  // above will surface them in the moderator queue.
  const submitRumor = useCallback((_s: Omit<RumorSubmission, 'id' | 'submittedAt' | 'status'>) => {
    void _s;
  }, []);
  const registerCSO = useCallback((_r: Omit<CSORegistration, 'id' | 'submittedAt' | 'status'>) => {
    void _r;
  }, []);
  const addLovedOneSubmission = useCallback((_s: Omit<LovedOneSubmission, 'id' | 'submittedAt' | 'status'>) => {
    void _s;
  }, []);

  const value = useMemo<AppState>(
    () => ({
      rumors,
      csos,
      submissions,
      debunkSubmissions,
      csoRegistrations,
      lovedOneSubmissions,
      updateRumorIntensity,
      updateRumorCoordinates,
      approveRumor,
      rejectRumor,
      bulkApproveRumors,
      submitRumor,
      approveSubmission,
      rejectSubmission,
      submitDebunk,
      approveDebunk,
      rejectDebunk,
      registerCSO,
      approveCSORegistration,
      rejectCSORegistration,
      addLovedOneSubmission,
    }),
    [
      rumors, csos, submissions, debunkSubmissions, csoRegistrations, lovedOneSubmissions,
      updateRumorIntensity, updateRumorCoordinates, approveRumor, rejectRumor, bulkApproveRumors,
      submitRumor, approveSubmission, rejectSubmission,
      submitDebunk, approveDebunk, rejectDebunk, registerCSO, approveCSORegistration, rejectCSORegistration,
      addLovedOneSubmission,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
