export type ClinicType = 'dental' | 'aesthetic';
export type Plan = 'basic' | 'advanced';

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
}

export type OutreachStatus = 'draft' | 'approved' | 'sent' | 'replied' | 'declined' | 'no_reply';
/** Every outreach is a periodic personalized reactivation message — this is the app's one job. */
export type OutreachKind = 'reactivation';

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
}
