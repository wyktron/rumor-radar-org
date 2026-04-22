export type UserRole = 'moderator' | 'cso' | 'guest';

export type Topic =
  | 'Health'
  | 'Politics'
  | 'Migration'
  | 'Economy'
  | 'Conflict'
  | 'Environment'
  | 'Technology';

export type RumorStatus = 'pending' | 'approved' | 'debunked' | 'verified-true' | 'rejected';

export type Language = 'en' | 'fr' | 'es' | 'ar' | 'ru';

export interface CSO {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  verified: boolean;
  description: string;
  website?: string;
  contactEmail: string;
  dateJoined: string;
}

export interface Rumor {
  id: string;
  title: string;
  description: string;
  country: string;
  topic: Topic;
  coordinates: [number, number]; // [lat, lng]
  intensity: number; // 0-1
  status: RumorStatus;
  submittedAt: string;
  sourceLanguage: Language;
  // Debunk info
  debunkedBy?: string;
  debunkedAt?: string;
  debunkContent?: string;
  debunkSources?: string[];
  // Verification info
  verifiedBy?: string;
  verifiedAt?: string;
  verificationContent?: string;
  verificationSources?: string[];
}

export interface RumorSubmission {
  id: string;
  claim: string;
  description?: string;
  location: string;
  coordinates: [number, number];
  topic: Topic;
  source?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DebunkSubmission {
  id: string;
  rumorId: string;
  csoId: string;
  csoName: string;
  content: string;
  sources: string[];
  submissionType: 'debunk' | 'verify-true';
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CSORegistration {
  id: string;
  organizationName: string;
  country: string;
  contactName: string;
  contactEmail: string;
  website?: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  csoId?: string;
}
