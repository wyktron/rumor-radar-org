import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Rumor,
  RumorSubmission,
  DebunkSubmission,
  CSORegistration,
  CSO,
  User,
} from '@/types';
import {
  dummyRumors,
  dummyRumorSubmissions,
  dummyDebunkSubmissions,
  dummyCSORegistrations,
  dummyCSOs,
  dummyUsers,
} from '@/data/dummyData';

interface AppState {
  rumors: Rumor[];
  csos: CSO[];
  submissions: RumorSubmission[];
  debunkSubmissions: DebunkSubmission[];
  csoRegistrations: CSORegistration[];
  user: User | null;
  // auth
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
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
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = 'rumor-radar-state-v1';
const USER_KEY = 'rumor-radar-user-v1';

interface PersistShape {
  rumors: Rumor[];
  csos: CSO[];
  submissions: RumorSubmission[];
  debunkSubmissions: DebunkSubmission[];
  csoRegistrations: CSORegistration[];
}

function loadState(): PersistShape {
  if (typeof window === 'undefined') {
    return {
      rumors: dummyRumors,
      csos: dummyCSOs,
      submissions: dummyRumorSubmissions,
      debunkSubmissions: dummyDebunkSubmissions,
      csoRegistrations: dummyCSORegistrations,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    rumors: dummyRumors,
    csos: dummyCSOs,
    submissions: dummyRumorSubmissions,
    debunkSubmissions: dummyDebunkSubmissions,
    csoRegistrations: dummyCSORegistrations,
  };
}

function loadUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [rumors, setRumors] = useState<Rumor[]>(initial.rumors);
  const [csos, setCsos] = useState<CSO[]>(initial.csos);
  const [submissions, setSubmissions] = useState<RumorSubmission[]>(initial.submissions);
  const [debunkSubmissions, setDebunkSubmissions] = useState<DebunkSubmission[]>(initial.debunkSubmissions);
  const [csoRegistrations, setCsoRegistrations] = useState<CSORegistration[]>(initial.csoRegistrations);
  const [user, setUser] = useState<User | null>(loadUser());

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rumors, csos, submissions, debunkSubmissions, csoRegistrations }),
    );
  }, [rumors, csos, submissions, debunkSubmissions, csoRegistrations]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const value = useMemo<AppState>(
    () => ({
      rumors,
      csos,
      submissions,
      debunkSubmissions,
      csoRegistrations,
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
          country: sub.location,
          topic: sub.topic,
          coordinates: sub.coordinates,
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
    }),
    [rumors, csos, submissions, debunkSubmissions, csoRegistrations, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
