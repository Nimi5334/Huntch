'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Clinic, ClinicType, Patient, Outreach, OutreachKind, Escalation, EscalationReason,
  TreatmentRecord, Payment, FaqEntry, VoiceExample, Plan,
} from './types';
import { DEMO_CLINIC, SEED_PATIENTS, SEED_OUTREACH, SEED_ESCALATIONS } from './seed';
import { checkinsDue, type CheckinDraft } from './checkins';
import { computeRoi, type RoiSummary } from './roi';

interface HuntchState {
  clinic: Clinic;
  patients: Patient[];
  outreach: Outreach[];
  escalations: Escalation[];
  isLoggedIn: boolean;

  // Computed
  patientById: (id: string) => Patient | undefined;
  pendingEscalationCount: () => number;
  checkinsDueToday: () => CheckinDraft[];
  roiSummary: () => RoiSummary;

  // Auth
  signup: (params: { name: string; operatorName: string; address: string; phone: string; password: string }) => void;
  login: (phone: string, password: string) => boolean;
  logout: () => void;

  // Patients
  addPatient: (patient: Omit<Patient, 'id' | 'clinicId' | 'addedAt'>) => string;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  addTreatment: (patientId: string, treatment: Omit<TreatmentRecord, 'id'>) => void;
  addPayment: (patientId: string, payment: Omit<Payment, 'id'>) => void;

  // Outreach (approve-before-send)
  createOutreach: (patientId: string, kind: OutreachKind, message: string, relatedTreatmentId?: string) => string;
  approveOutreach: (id: string) => void;
  sendOutreach: (id: string) => void;
  markReplied: (id: string, insight?: string) => void;
  declineOutreach: (id: string) => void;

  // Escalations
  escalate: (patientId: string, reason: EscalationReason, snippet?: string) => void;
  resolveEscalation: (id: string) => void;

  // AI brain
  updateKnowledge: (patch: Partial<Clinic['knowledge']>) => void;
  addFaq: (faq: Omit<FaqEntry, 'id'>) => void;
  removeFaq: (id: string) => void;
  addVoiceExample: (example: Omit<VoiceExample, 'id'>) => void;

  // Billing
  setPlan: (plan: Plan) => void;
}

let _nextId = 1000;
const uid = () => `id-${_nextId++}`;
const today = () => new Date().toISOString().slice(0, 10);

function initialsAndColor(name: string): { initials: string; avatarColor: string } {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  const palette = ['oklch(0.63 0.18 38)', 'oklch(0.55 0.14 160)', 'oklch(0.52 0.17 295)', 'oklch(0.60 0.15 52)', 'oklch(0.54 0.14 22)'];
  const avatarColor = palette[name.length % palette.length];
  return { initials, avatarColor };
}

export const useStore = create<HuntchState>()(
  persist(
    (set, get) => ({
      clinic: DEMO_CLINIC,
      patients: SEED_PATIENTS,
      outreach: SEED_OUTREACH,
      escalations: SEED_ESCALATIONS,
      isLoggedIn: true, // auto-login to demo for MVP

      patientById: (id) => get().patients.find(p => p.id === id),

      pendingEscalationCount: () => get().escalations.filter(e => e.status === 'pending').length,

      checkinsDueToday: () => {
        const clinic = get().clinic;
        return get().patients.filter(p => !p.optedOut).flatMap(p => checkinsDue(p, clinic));
      },

      roiSummary: () => computeRoi(get().patients, get().outreach, get().clinic.type),

      signup: (params) => {
        const clinicId = uid();
        set({
          clinic: {
            id: clinicId,
            name: params.name,
            type: 'dental' as ClinicType,
            address: params.address,
            operatorName: params.operatorName,
            phone: params.phone,
            password: params.password,
            plan: 'basic',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            knowledge: { faqs: [], voiceExamples: [] },
          },
          patients: [],
          outreach: [],
          escalations: [],
          isLoggedIn: true,
        });
      },

      login: (phone, password) => {
        const clinic = get().clinic;
        if (clinic.phone === phone && clinic.password === password) {
          set({ isLoggedIn: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isLoggedIn: false }),

      addPatient: (raw) => {
        const id = uid();
        const gen = initialsAndColor(raw.name);
        const patient: Patient = {
          ...raw,
          id,
          clinicId: get().clinic.id,
          addedAt: today(),
          initials: raw.initials || gen.initials,
          avatarColor: raw.avatarColor || gen.avatarColor,
        };
        set(s => ({ patients: [patient, ...s.patients] }));
        return id;
      },

      updatePatient: (id, patch) => {
        set(s => ({ patients: s.patients.map(p => p.id === id ? { ...p, ...patch } : p) }));
      },

      addTreatment: (patientId, treatment) => {
        const t: TreatmentRecord = { ...treatment, id: uid() };
        set(s => ({
          patients: s.patients.map(p => p.id === patientId
            ? { ...p, treatments: [t, ...p.treatments], lastVisit: t.date > p.lastVisit ? t.date : p.lastVisit }
            : p),
        }));
      },

      addPayment: (patientId, payment) => {
        const pay: Payment = { ...payment, id: uid() };
        set(s => ({
          patients: s.patients.map(p => p.id === patientId ? { ...p, payments: [pay, ...p.payments] } : p),
        }));
      },

      createOutreach: (patientId, kind, message, relatedTreatmentId) => {
        const id = uid();
        const out: Outreach = {
          id, clinicId: get().clinic.id, patientId, kind, channel: 'whatsapp',
          status: 'draft', message, relatedTreatmentId, createdAt: new Date().toISOString(),
        };
        set(s => ({ outreach: [out, ...s.outreach] }));
        return id;
      },

      approveOutreach: (id) => {
        set(s => ({ outreach: s.outreach.map(o => o.id === id ? { ...o, status: 'approved' } : o) }));
      },

      sendOutreach: (id) => {
        // Live send requires WhatsApp Business credentials; falls back to a simulated send in demo.
        set(s => ({
          outreach: s.outreach.map(o => o.id === id ? { ...o, status: 'sent', sentAt: new Date().toISOString() } : o),
        }));
      },

      markReplied: (id, insight) => {
        set(s => ({
          outreach: s.outreach.map(o => o.id === id ? { ...o, status: 'replied', respondedAt: new Date().toISOString(), insight } : o),
        }));
        if (insight) {
          const out = get().outreach.find(o => o.id === id);
          if (out) {
            set(s => ({
              patients: s.patients.map(p => p.id === out.patientId ? { ...p, insights: [insight, ...(p.insights ?? [])] } : p),
            }));
          }
        }
      },

      declineOutreach: (id) => {
        set(s => ({ outreach: s.outreach.map(o => o.id === id ? { ...o, status: 'declined' } : o) }));
      },

      escalate: (patientId, reason, snippet) => {
        const esc: Escalation = { id: uid(), clinicId: get().clinic.id, patientId, reason, status: 'pending', createdAt: new Date().toISOString(), snippet };
        set(s => ({ escalations: [esc, ...s.escalations] }));
      },

      resolveEscalation: (id) => {
        set(s => ({ escalations: s.escalations.map(e => e.id === id ? { ...e, status: 'handled' } : e) }));
      },

      updateKnowledge: (patch) => {
        set(s => ({ clinic: { ...s.clinic, knowledge: { ...s.clinic.knowledge, ...patch } } }));
      },

      addFaq: (faq) => {
        set(s => ({ clinic: { ...s.clinic, knowledge: { ...s.clinic.knowledge, faqs: [...s.clinic.knowledge.faqs, { ...faq, id: uid() }] } } }));
      },

      removeFaq: (id) => {
        set(s => ({ clinic: { ...s.clinic, knowledge: { ...s.clinic.knowledge, faqs: s.clinic.knowledge.faqs.filter(f => f.id !== id) } } }));
      },

      addVoiceExample: (example) => {
        set(s => ({ clinic: { ...s.clinic, knowledge: { ...s.clinic.knowledge, voiceExamples: [...s.clinic.knowledge.voiceExamples, { ...example, id: uid() }] } } }));
      },

      setPlan: (plan) => {
        set(s => ({ clinic: { ...s.clinic, plan } }));
      },
    }),
    {
      name: 'huntch-clinic-v1',
      skipHydration: true,
    }
  )
);
