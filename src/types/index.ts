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
  /** Country where the rumor was first heard / source is registered. Drives the map marker. */
  originCountry: string;
  /** Country/region the rumor is about (may equal origin, or be "Multiple" / "Global"). */
  subjectCountry?: string;
  topic: Topic;
  coordinates: [number, number]; // [lat, lng] — origin coordinates
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
  /** Where the submitter first heard the rumor. */
  originCountry: string;
  originCoordinates: [number, number];
  /** What the rumor is about. */
  subjectCountry?: string;
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

export type LovedOneContactMethod = 'phone' | 'sms' | 'email';
export type LovedOneCallTime = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type LovedOneStatus = 'pending' | 'contacted' | 'completed';

export interface LovedOneSubmission {
  id: string;
  contactMethod: LovedOneContactMethod;
  contactValue: string;
  bestTimeToCall?: LovedOneCallTime;
  country: string;
  relationship: string;
  notes: string;
  submittedAt: string;
  status: LovedOneStatus;
}
