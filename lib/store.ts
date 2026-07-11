'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Clinic, ClinicType, Patient, Outreach, TreatmentRecord, Payment, Plan,
} from './types';
import { DEMO_CLINIC, SEED_PATIENTS, SEED_OUTREACH } from './seed';

interface HuntchState {
  clinic: Clinic;
  patients: Patient[];
  outreach: Outreach[];
  isLoggedIn: boolean;

  // Computed
  patientById: (id: string) => Patient | undefined;

  // Auth
  signup: (params: { name: string; operatorName: string; address: string; phone: string; password: string }) => void;
  login: (phone: string, password: string) => boolean;
  logout: () => void;

  // Patients
  addPatient: (patient: Omit<Patient, 'id' | 'clinicId' | 'addedAt'>) => string;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  addTreatment: (patientId: string, treatment: Omit<TreatmentRecord, 'id'>) => void;
  addPayment: (patientId: string, payment: Omit<Payment, 'id'>) => void;

  // Outreach (approve-before-send periodic reactivation)
  createOutreach: (patientId: string, message: string, relatedTreatmentId?: string) => string;
  approveOutreach: (id: string) => void;
  sendOutreach: (id: string) => void;
  markReplied: (id: string) => void;
  declineOutreach: (id: string) => void;

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
      isLoggedIn: true, // auto-login to demo for MVP

      patientById: (id) => get().patients.find(p => p.id === id),

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
          },
          patients: [],
          outreach: [],
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

      createOutreach: (patientId, message, relatedTreatmentId) => {
        const id = uid();
        const out: Outreach = {
          id, clinicId: get().clinic.id, patientId, kind: 'reactivation', channel: 'whatsapp',
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

      markReplied: (id) => {
        set(s => ({
          outreach: s.outreach.map(o => o.id === id ? { ...o, status: 'replied', respondedAt: new Date().toISOString() } : o),
        }));
      },

      declineOutreach: (id) => {
        set(s => ({ outreach: s.outreach.map(o => o.id === id ? { ...o, status: 'declined' } : o) }));
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
