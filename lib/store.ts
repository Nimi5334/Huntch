'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business, Job, Candidate, Invite, RankedCandidate, QrScan } from './types';
import { DEMO_BUSINESS, DEMO_JOB, SEED_CANDIDATES } from './seed';
import { rankPool } from './matching';

interface HuntchState {
  // Core state
  business: Business;
  jobs: Job[];
  pool: Candidate[];
  invites: Invite[];
  savedCandidateIds: string[];
  dismissedCandidateIds: string[];
  isLoggedIn: boolean;
  qrScans: QrScan[];

  // Derived / computed
  rankedForJob: (jobId: string) => RankedCandidate[];
  respondersForJob: (jobId: string) => (Candidate & { invite: Invite })[];
  invitedIdsForJob: (jobId: string) => string[];
  newCandidateCount: () => number;
  invitedCount: () => number;

  // QR actions
  addViaQr: (candidateData: Omit<Candidate, 'id' | 'businessId' | 'addedAt'>, businessId: string) => void;
  qrScansForBusiness: (businessId: string) => QrScan[];

  // Actions
  signup: (params: { name: string; type: Business['type']; address: string; operatorName: string; phone: string; password: string }) => void;
  login: (phone: string, password: string) => boolean;
  logout: () => void;
  postJob: (params: Omit<Job, 'id' | 'businessId' | 'createdAt' | 'flow' | 'status'>) => string;
  addToPool: (candidate: Omit<Candidate, 'id' | 'businessId' | 'addedAt'>) => void;
  bulkAddToPool: (candidates: Omit<Candidate, 'id' | 'businessId' | 'addedAt'>[]) => void;
  inviteCandidate: (jobId: string, candidateId: string) => void;
  bulkInvite: (jobId: string, minScore: number) => void;
  simulateResponses: (jobId: string) => void;
  saveCandidate: (candidateId: string) => void;
  dismissCandidate: (candidateId: string) => void;
  reportGap: (role: Job['role']) => string;
}

let _nextId = 100;
const uid = () => `id-${_nextId++}`;

export const useStore = create<HuntchState>()(
  persist(
    (set, get) => ({
      business: DEMO_BUSINESS,
      jobs: [DEMO_JOB],
      pool: SEED_CANDIDATES,
      invites: [],
      savedCandidateIds: [],
      dismissedCandidateIds: [],
      isLoggedIn: false, // must sign up / log in
      qrScans: [],

      rankedForJob: (jobId) => {
        const job = get().jobs.find(j => j.id === jobId);
        if (!job) return [];
        const dismissed = new Set(get().dismissedCandidateIds);
        const pool = get().pool.filter(c => !dismissed.has(c.id));
        return rankPool(pool, job);
      },

      respondersForJob: (jobId) => {
        const invites = get().invites.filter(i => i.jobId === jobId && i.status === 'responded');
        const pool = get().pool;
        return invites
          .map(invite => {
            const cand = pool.find(c => c.id === invite.candidateId);
            return cand ? { ...cand, invite } : null;
          })
          .filter(Boolean) as (Candidate & { invite: Invite })[];
      },

      invitedIdsForJob: (jobId) =>
        get().invites
          .filter(i => i.jobId === jobId && ['sent','delivered','responded'].includes(i.status))
          .map(i => i.candidateId),

      newCandidateCount: () => {
        const dismissed = new Set(get().dismissedCandidateIds);
        const invited = new Set(get().invites.map(i => i.candidateId));
        return get().pool.filter(c => !dismissed.has(c.id) && !invited.has(c.id)).length;
      },

      invitedCount: () => get().invites.filter(i => i.status !== 'declined').length,

      addViaQr: (raw, businessId) => {
        const candidateId = uid();
        const today = new Date().toISOString().slice(0, 10);
        const candidate: Candidate = {
          ...raw,
          id: candidateId,
          businessId,
          addedAt: today,
          consentSource: 'qr-scan',
        };
        const scan: QrScan = {
          id: uid(),
          businessId,
          candidateId,
          scannedAt: new Date().toISOString(),
        };
        set(s => ({ pool: [candidate, ...s.pool], qrScans: [scan, ...s.qrScans] }));
      },

      qrScansForBusiness: (businessId) =>
        get().qrScans.filter(s => s.businessId === businessId),

      signup: (params) => {
        const bizId = uid();
        set({
          business: {
            id: bizId,
            name: params.name,
            type: params.type,
            address: params.address,
            location: { lat: 32.0628, lng: 34.7730 }, // default centre; geocoding is phase-2
            operatorName: params.operatorName,
            staffingState: 'has-gaps',
            phone: params.phone,
            password: params.password,
          },
          jobs: [],
          invites: [],
          savedCandidateIds: [],
          dismissedCandidateIds: [],
          qrScans: [],
          isLoggedIn: true,
        });
      },

      login: (phone, password) => {
        const biz = get().business;
        if (biz.phone === phone && biz.password === password) {
          set({ isLoggedIn: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isLoggedIn: false }),

      postJob: (params) => {
        const id = uid();
        const job: Job = {
          ...params,
          id,
          businessId: get().business.id,
          flow: 'flow2',
          status: 'active',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set(s => ({ jobs: [job, ...s.jobs] }));
        return id;
      },

      addToPool: (raw) => {
        const candidate: Candidate = {
          ...raw,
          id: uid(),
          businessId: get().business.id,
          addedAt: new Date().toISOString().slice(0, 10),
        };
        set(s => ({ pool: [candidate, ...s.pool] }));
      },

      bulkAddToPool: (raws) => {
        const bizId = get().business.id;
        const today = new Date().toISOString().slice(0, 10);
        const candidates: Candidate[] = raws.map(raw => ({
          ...raw,
          id: uid(),
          businessId: bizId,
          addedAt: today,
        }));
        set(s => ({ pool: [...candidates, ...s.pool] }));
      },

      inviteCandidate: (jobId, candidateId) => {
        const job = get().jobs.find(j => j.id === jobId);
        const cand = get().pool.find(c => c.id === candidateId);
        if (!job || !cand) return;
        const alreadyInvited = get().invites.some(
          i => i.jobId === jobId && i.candidateId === candidateId
        );
        if (alreadyInvited) return;
        const invite: Invite = {
          id: uid(),
          jobId,
          candidateId,
          status: 'sent',
          sentAt: new Date().toISOString(),
          waMessage: `שלום ${cand.name}, ${get().business.name} (${get().business.address}) מחפשים ${job.role} — האם תהיי/תהיה זמין/ה? | Huntch`,
        };
        set(s => ({ invites: [invite, ...s.invites] }));
      },

      bulkInvite: (jobId, minScore) => {
        const ranked = get().rankedForJob(jobId);
        const toInvite = ranked.filter(c => c.score >= minScore);
        toInvite.forEach(c => get().inviteCandidate(jobId, c.id));
      },

      simulateResponses: (jobId) => {
        set(s => ({
          invites: s.invites.map(inv => {
            if (inv.jobId !== jobId || inv.status !== 'sent') return inv;
            const responded = Math.random() > 0.35;
            return {
              ...inv,
              status: responded ? 'responded' : 'declined',
              respondedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      saveCandidate: (id) =>
        set(s => ({
          savedCandidateIds: s.savedCandidateIds.includes(id)
            ? s.savedCandidateIds
            : [...s.savedCandidateIds, id],
        })),

      dismissCandidate: (id) =>
        set(s => ({
          dismissedCandidateIds: s.dismissedCandidateIds.includes(id)
            ? s.dismissedCandidateIds
            : [...s.dismissedCandidateIds, id],
        })),

      reportGap: (role) => {
        const id = uid();
        const biz = get().business;
        const job: Job = {
          id,
          businessId: biz.id,
          role,
          locationAddress: biz.address,
          location: biz.location,
          shifts: ['morning', 'afternoon', 'evening'],
          startDate: new Date().toISOString().slice(0, 10),
          requirements: 'זמינות מיידית',
          filters: { roles: [role], maxDistanceKm: 8 },
          weights: { availability: 0.35, distance: 0.30, roleExperience: 0.15, skills: 0.08, compensation: 0.07, recency: 0.05 },
          mustHaves: [],
          flow: 'flow2',
          status: 'active',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set(s => ({ jobs: [job, ...s.jobs] }));
        return id;
      },
    }),
    {
      name: 'huntch-store-v1',
      skipHydration: true,
    }
  )
);
