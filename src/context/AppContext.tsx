import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
} from '@/types';
import {
  dummyRumors,
  dummyRumorSubmissions,
  dummyDebunkSubmissions,
  dummyCSORegistrations,
  dummyCSOs,
} from '@/data/dummyData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface AppState {
  rumors: Rumor[];
  csos: CSO[];
  submissions: RumorSubmission[];
  debunkSubmissions: DebunkSubmission[];
  csoRegistrations: CSORegistration[];
  lovedOneSubmissions: LovedOneSubmission[];
  // rumors
  updateRumorIntensity: (id: string, intensity: number) => void;
  updateRumorCoordinates: (id: string, coords: [number, number]) => void;
  // submissions
  submitRumor: (s: Omit<RumorSubmission, 'id' | 'submittedAt' | 'status'>) => void;
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string) => void;
  // debunks
  submitDebunk: (d: Omit<DebunkSubmission, 'id' | 'submittedAt' | 'status' | 'csoName'>) => void;
  approveDebunk: (id: string) => void;
  rejectDebunk: (id: string) => void;
  // registrations
  registerCSO: (r: Omit<CSORegistration, 'id' | 'submittedAt' | 'status'>) => void;
  approveCSORegistration: (id: string) => void;
  rejectCSORegistration: (id: string) => void;
  // loved one outreach
  addLovedOneSubmission: (s: Omit<LovedOneSubmission, 'id' | 'submittedAt' | 'status'>) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = 'rumor-radar-state-v3';

interface PersistShape {
  rumors: Rumor[];
  csos: CSO[];
  submissions: RumorSubmission[];
  debunkSubmissions: DebunkSubmission[];
  csoRegistrations: CSORegistration[];
  lovedOneSubmissions: LovedOneSubmission[];
}

function loadState(): PersistShape {
  const fallback: PersistShape = {
    rumors: dummyRumors,
    csos: dummyCSOs,
    submissions: dummyRumorSubmissions,
    debunkSubmissions: dummyDebunkSubmissions,
    csoRegistrations: dummyCSORegistrations,
    lovedOneSubmissions: [],
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistShape>;
      return { ...fallback, ...parsed, lovedOneSubmissions: parsed.lovedOneSubmissions ?? [] };
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [rumors, setRumors] = useState<Rumor[]>(initial.rumors);
  const [csos, setCsos] = useState<CSO[]>(initial.csos);
  const [submissions, setSubmissions] = useState<RumorSubmission[]>(initial.submissions);
  const [debunkSubmissions, setDebunkSubmissions] = useState<DebunkSubmission[]>(initial.debunkSubmissions);
  const [csoRegistrations, setCsoRegistrations] = useState<CSORegistration[]>(initial.csoRegistrations);
  const [lovedOneSubmissions, setLovedOneSubmissions] = useState<LovedOneSubmission[]>(initial.lovedOneSubmissions);

  // One-time cleanup of any legacy auth payload that older builds may have
  // persisted in localStorage. The legacy login path has been removed in favor
  // of Supabase-backed authentication (AuthContext).
  useEffect(() => {
    try {
      localStorage.removeItem('rumor-radar-user-v1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rumors, csos, submissions, debunkSubmissions, csoRegistrations, lovedOneSubmissions }),
    );
  }, [rumors, csos, submissions, debunkSubmissions, csoRegistrations, lovedOneSubmissions]);

  // Merge any live (Supabase) rumors on top of the dummy seed and subscribe
  // to realtime changes so newly-approved rumors appear instantly on the heatmap.
  useEffect(() => {
    let cancelled = false;
    const PUBLIC_STATUSES: RumorStatus[] = ['approved', 'debunked', 'verified-true'];

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

    // Track previous status per rumor so we only toast on real transitions
    // (e.g. pending → approved), not on every UPDATE echo or initial load.
    const lastStatus = new Map<string, RumorStatus>();

    (async () => {
      const { data, error } = await supabase
        .from('rumors')
        .select(
          'id, title, description, origin_country, subject_country, topic, latitude, longitude, intensity, status, source_language, submitted_at, debunked_by, debunked_at, debunk_content, debunk_sources, verified_by, verified_at, verification_content, verification_sources',
        )
        .in('status', PUBLIC_STATUSES)
        .order('submitted_at', { ascending: false })
        .limit(500);
      if (error) {
        console.warn('[rumors] initial load failed', error.message);
        return;
      }
      const rows = (data ?? []) as RumorRow[];
      // Seed the status map so we don't toast for rumors already approved
      // before the user opened the page.
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
          if (!PUBLIC_STATUSES.includes(row.status)) {
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
  }, []);


  const value = useMemo<AppState>(
    () => ({
      rumors,
      csos,
      submissions,
      debunkSubmissions,
      csoRegistrations,
      lovedOneSubmissions,
      user,
      login(email, password) {
        const found = dummyUsers.find((u) => u.email === email && u.password === password);
        if (!found) return { ok: false, error: 'Invalid credentials' };
        const { password: _pw, ...safe } = found;
        setUser(safe);
        return { ok: true };
      },
      logout() {
        setUser(null);
      },
      updateRumorIntensity(id, intensity) {
        setRumors((rs) => rs.map((r) => (r.id === id ? { ...r, intensity } : r)));
      },
      updateRumorCoordinates(id, coords) {
        setRumors((rs) => rs.map((r) => (r.id === id ? { ...r, coordinates: coords } : r)));
      },
      submitRumor(s) {
        const sub: RumorSubmission = {
          ...s,
          id: 'sub-' + uid(),
          submittedAt: new Date().toISOString(),
          status: 'pending',
        };
        setSubmissions((arr) => [sub, ...arr]);
      },
      approveSubmission(id) {
        const sub = submissions.find((s) => s.id === id);
        if (!sub) return;
        setSubmissions((arr) => arr.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)));
        const newRumor: Rumor = {
          id: 'r-' + uid(),
          title: sub.claim,
          description: sub.description ?? sub.claim,
          originCountry: sub.originCountry,
          subjectCountry: sub.subjectCountry,
          topic: sub.topic,
          coordinates: sub.originCoordinates,
          intensity: 0.5,
          status: 'pending',
          submittedAt: sub.submittedAt,
          sourceLanguage: 'en',
        };
        setRumors((rs) => [newRumor, ...rs]);
      },
      rejectSubmission(id) {
        setSubmissions((arr) => arr.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)));
      },
      submitDebunk(d) {
        const cso = csos.find((c) => c.id === d.csoId);
        const deb: DebunkSubmission = {
          ...d,
          csoName: cso?.name ?? 'Unknown CSO',
          id: 'deb-' + uid(),
          submittedAt: new Date().toISOString(),
          status: 'pending',
        };
        setDebunkSubmissions((arr) => [deb, ...arr]);
      },
      approveDebunk(id) {
        const deb = debunkSubmissions.find((d) => d.id === id);
        if (!deb) return;
        setDebunkSubmissions((arr) =>
          arr.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)),
        );
        setRumors((rs) =>
          rs.map((r) => {
            if (r.id !== deb.rumorId) return r;
            if (deb.submissionType === 'debunk') {
              return {
                ...r,
                status: 'debunked',
                debunkedBy: deb.csoName,
                debunkedAt: new Date().toISOString(),
                debunkContent: deb.content,
                debunkSources: deb.sources,
              };
            }
            return {
              ...r,
              status: 'verified-true',
              verifiedBy: deb.csoName,
              verifiedAt: new Date().toISOString(),
              verificationContent: deb.content,
              verificationSources: deb.sources,
            };
          }),
        );
      },
      rejectDebunk(id) {
        setDebunkSubmissions((arr) =>
          arr.map((d) => (d.id === id ? { ...d, status: 'rejected' } : d)),
        );
      },
      registerCSO(r) {
        const reg: CSORegistration = {
          ...r,
          id: 'reg-' + uid(),
          submittedAt: new Date().toISOString(),
          status: 'pending',
        };
        setCsoRegistrations((arr) => [reg, ...arr]);
      },
      approveCSORegistration(id) {
        const reg = csoRegistrations.find((r) => r.id === id);
        if (!reg) return;
        setCsoRegistrations((arr) =>
          arr.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)),
        );
        const cso: CSO = {
          id: 'cso-' + uid(),
          name: reg.organizationName,
          country: reg.country,
          coordinates: [0, 0],
          verified: true,
          description: reg.description,
          website: reg.website,
          contactEmail: reg.contactEmail,
          dateJoined: new Date().toISOString(),
        };
        setCsos((cs) => [cso, ...cs]);
      },
      rejectCSORegistration(id) {
        setCsoRegistrations((arr) =>
          arr.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)),
        );
      },
      addLovedOneSubmission(s) {
        const sub: LovedOneSubmission = {
          ...s,
          id: 'loved-' + uid(),
          submittedAt: new Date().toISOString(),
          status: 'pending',
        };
        setLovedOneSubmissions((arr) => [sub, ...arr]);
      },
    }),
    [rumors, csos, submissions, debunkSubmissions, csoRegistrations, lovedOneSubmissions, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
