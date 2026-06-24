/**
 * In-memory session + results store for the WhatsApp DNA Feeder.
 * SERVER-ONLY — import only from API routes / lib/whatsapp-flow.ts.
 *
 * ⚠️  PRODUCTION NOTE: module-level Maps reset on every cold start in serverless
 * environments (Vercel). For production, replace with Vercel KV:
 *   https://vercel.com/docs/storage/vercel-kv
 * Swap the two Maps for KV.get / KV.set calls in whatsapp-flow.ts.
 */

import type { DnaFeederAnswers, WaInterviewResult } from './types';

export type FlowStep =
  | 'q1_roles'
  | 'q2_hours'
  | 'q3_shifts'
  | 'q4_start'
  | 'q5_transport'
  | 'q6_distance'
  | 'q7_wage'
  | 'q8_needs'
  | 'q9_schedule'
  | 'q10_notes'
  | 'p3_offer'
  | 'q11_experience'
  | 'q12_workplaces'
  | 'q13_service'
  | 'q14_ownership'
  | 'complete';

export interface WaSession {
  candidateId: string;
  businessId: string;
  businessName: string;
  candidateName: string;
  /** Normalized WA phone: 972XXXXXXXXX */
  phone: string;
  step: FlowStep;
  answers: DnaFeederAnswers;
  phasesCompleted: 0 | 1 | 2 | 3;
  startedAt: number;
  lastActivityAt: number;
  /** Passive signal: seconds from form mount to submission */
  formCompletionSec?: number;
  /** Passive signal: seconds from first WA message to first reply */
  firstReplyLatencySec?: number;
}

/** Active conversations — keyed by normalized WA phone number */
export const sessions = new Map<string, WaSession>();

/** Completed interview results — keyed by candidateId */
export const interviewResults = new Map<string, WaInterviewResult>();
