export type ClinicType = 'dental' | 'aesthetic';
export type Plan = 'basic' | 'advanced';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface VoiceExample {
  id: string;
  patientMsg: string;
  approvedReply: string;
}

export interface BusinessKnowledge {
  hours?: string;
  doctors?: string;
  services?: string;
  pricingNotes?: string;
  insurance?: string;
  policies?: string;
  faqs: FaqEntry[];
  voiceExamples: VoiceExample[];
}

/** What the system does on its own — editable from the אוטומציה page. */
export interface AutomationSettings {
  /** periodic personalized quality-checks after treatments */
  qualityChecks: boolean;
  /** cadence for the recurring wellbeing/quality follow-up (days) */
  qualityCheckFrequencyDays: number;
  /** surface reactivation leads for dormant patients */
  reactivationLeads: boolean;
  /** nudge recently-seen patients for a review */
  reviewRequests: boolean;
  /** AI answers routine patient questions from the knowledge base */
  autoAnswer: boolean;
  /** require a clinic tap before anything goes out (safe default) */
  approveBeforeSend: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  type: ClinicType;
  address: string;
  operatorName: string;
  phone?: string;
  email?: string;
  password?: string;
  plan: Plan;
  trialEndsAt?: string;
  knowledge: BusinessKnowledge;
  automation?: AutomationSettings;
}

export type TreatmentCategory =
  // dental
  | 'cleaning' | 'whitening' | 'orthodontics' | 'implant' | 'root-canal' | 'crown' | 'night-guard' | 'checkup'
  // aesthetic
  | 'botox' | 'filler' | 'laser' | 'peeling' | 'lifting' | 'consultation';

export interface TreatmentRecord {
  id: string;
  date: string;
  category: TreatmentCategory;
  name: string;
  provider?: string;
  status: 'completed' | 'planned' | 'in-progress';
  cost: number;
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method?: 'cash' | 'card' | 'insurance' | 'transfer';
  treatmentId?: string;
}

export interface Lead {
  headline: string;
  reason: string;
  suggestedCategory: string;
  draftMessage: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  initials: string;
  avatarColor: string;
  age?: number;
  gender?: 'm' | 'f';
  firstVisit: string;
  lastVisit: string;
  treatments: TreatmentRecord[];
  payments: Payment[];
  medicalNotes?: string;
  consent: boolean;
  optedOut?: boolean;
  addedAt: string;
  /** replies distilled from outreach — builds understanding of the patient over time */
  insights?: string[];
}

export type OutreachStatus = 'draft' | 'approved' | 'sent' | 'replied' | 'declined' | 'no_reply';
export type OutreachKind = 'reactivation' | 'quality_check' | 'wellbeing' | 'review';

export interface Outreach {
  id: string;
  clinicId: string;
  patientId: string;
  kind: OutreachKind;
  channel: 'whatsapp' | 'sms';
  status: OutreachStatus;
  message: string;
  relatedTreatmentId?: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
  insight?: string;
}

export type EscalationReason = 'complex_question' | 'complaint' | 'medical_concern' | 'reschedule' | 'other';

export interface Escalation {
  id: string;
  clinicId: string;
  patientId: string;
  reason: EscalationReason;
  status: 'pending' | 'handled';
  createdAt: string;
  snippet?: string;
}
