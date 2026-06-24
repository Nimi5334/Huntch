export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night' | 'weekend';
export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
export type Role =
  | 'barista' | 'server' | 'cook' | 'line-cook' | 'dishwasher'
  | 'host' | 'bartender' | 'cashier' | 'delivery' | 'shift-manager';
export type VenueType = 'cafe' | 'restaurant' | 'bar' | 'fast-food' | 'catering' | 'hotel';
export type Language = 'he' | 'ar' | 'en' | 'ru';
export type ConsentSource = 'apply-form' | 'csv-import' | 'direct' | 'lead-ad' | 'qr-scan';

export interface QrScan {
  id: string;
  businessId: string;
  candidateId: string;
  scannedAt: string;
}
export type BadgeTier = 'ex' | 'gd' | 'md';
export type InviteStatus = 'sent' | 'delivered' | 'responded' | 'declined';

export interface LatLng { lat: number; lng: number; }

export interface Business {
  id: string;
  name: string;
  type: VenueType;
  address: string;
  location: LatLng;
  operatorName: string;
  staffingState: 'fully-staffed' | 'has-gaps';
  phone?: string;
  password?: string;
}

export interface JobWeights {
  availability: number;
  distance: number;
  roleExperience: number;
  skills: number;
  compensation: number;
  recency: number;
}

export interface JobFilters {
  roles?: Role[];
  maxDistanceKm?: number;
  shifts?: ShiftType[];
  minExperienceYears?: number;
  languages?: Language[];
  maxWageNis?: number;
  mustHaveImmediate?: boolean;
  mustHaveWorkPermit?: boolean;
}

export interface Job {
  id: string;
  businessId: string;
  role: Role;
  locationAddress: string;
  location: LatLng;
  shifts: ShiftType[];
  startDate: string;
  requirements: string;
  wageNis?: number;
  filters: JobFilters;
  weights: JobWeights;
  mustHaves: string[];
  flow: 'flow2';
  status: 'active' | 'filled' | 'paused';
  createdAt: string;
}

export interface CandidateAvailability {
  days: DayOfWeek[];
  shifts: ShiftType[];
  hoursPerWeek: number;
  earliestStart: string;
  immediate: boolean;
}

export interface CandidateExperience {
  totalYears: number;
  roles: Role[];
  venueTypes: VenueType[];
  notableWorkplaces: string[];
}

export interface PlatformSignals {
  applicationCount: number;
  priorHires: number;
  responseSpeedHours: number;
  lastActiveDaysAgo: number;
  /** Passive signal — confidence nudge only, never displayed as quality */
  formCompletionSec?: number;
  firstReplyLatencySec?: number;
}

export interface Candidate {
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  initials: string;
  avatarColor: string;
  neighborhood: string;
  location: LatLng;
  hasCar: boolean;
  willingRangeKm: number;
  availability: CandidateAvailability;
  roles: Role[];
  experience: CandidateExperience;
  skills: string[];
  languages: Language[];
  hasWorkPermit: boolean;
  age: number;
  expectedWageNis: number;
  signals: PlatformSignals;
  consentSource: ConsentSource;
  addedAt: string;
  // ── DNA Feeder enrichment (populated via WhatsApp mini-interview) ──────────
  needsSuppliesFit?: string[];
  scheduleTolerance?: 'very' | 'nice' | 'flexible';
  interviewScores?: { serviceHandling?: number; ownership?: number };
  dnaSource?: 'cold_start' | 'platform_history' | 'hybrid';
  dnaConfidence?: number;
}

export interface RankedCandidate extends Candidate {
  score: number;
  badge: BadgeTier;
  reasonFacts: string[];
}

export interface Invite {
  id: string;
  jobId: string;
  candidateId: string;
  status: InviteStatus;
  sentAt: string;
  respondedAt?: string;
  waMessage: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  submittedAt: string;
  source: ConsentSource;
}

// ─── Employee requests (from master) ─────────────────────────────────────────

export type RequestType = 'leave' | 'shift-swap' | 'schedule-change' | 'other';

export const REQUEST_TYPE_HE: Record<RequestType, string> = {
  'leave':           'בקשת חופשה',
  'shift-swap':      'החלפת משמרת',
  'schedule-change': 'שינוי זמינות',
  'other':           'פנייה אחרת',
};

export interface EmployeeRequest {
  id: string;
  businessId: string;
  employeeId: string;
  type: RequestType;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: string;
  details?: string;
}

// ─── DNA Feeder — WhatsApp mini-interview answers ─────────────────────────────

export interface DnaFeederAnswers {
  roles?: string[];
  hoursPerWeek?: string;
  shifts?: string[];
  start?: 'immediate' | 'two_weeks' | 'one_month';
  transport?: 'car' | 'public' | 'walk';
  distanceKm?: number;
  wageNis?: number;
  needsSuppliesFit?: string[];
  scheduleTolerance?: 'very' | 'nice' | 'flexible';
  needsNotes?: string;
  experienceYears?: number;
  notableWorkplaces?: string;
  serviceHandling?: string;
  ownership?: string;
  serviceHandlingScore?: number;   // 0–2, rubric-scored
  ownershipScore?: number;         // 0–2, rubric-scored
}

export interface WaInterviewResult {
  candidateId: string;
  completedAt: string;
  phasesCompleted: 1 | 2 | 3;
  answers: DnaFeederAnswers;
  dna: {
    score: number;
    confidence: number;            // 0–1: 0.30 / 0.60 / 0.90 by phases
    retentionFit: number;          // 0–100
    performance: number;           // 0–100
    churnRisk: 'low' | 'medium' | 'high';
  };
}
