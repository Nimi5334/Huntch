/**
 * Supabase client wrapper for Huntch.
 *
 * Client-side: `import { supabase } from '@/lib/supabase'` (anon key, RLS-scoped to the signed-in clinic).
 * Server-only, cross-tenant (webhooks, AI routes): `import { supabaseAdmin } from '@/lib/supabase'`
 *   — uses the service-role key, which bypasses RLS by design. NEVER import supabaseAdmin from a
 *   client component; NEVER send SUPABASE_SERVICE_ROLE_KEY to the browser.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Clinic, Patient, Outreach, EscalationReason } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Client-side instance — respects RLS, only sees the signed-in user's clinic. */
export const supabase = createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: { persistSession: true },
});

/** Server-only instance for cross-tenant lookups (webhooks, AI routes). Bypasses RLS. */
export const supabaseAdmin = createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', serviceRoleKey || supabaseAnonKey || 'placeholder', {
  auth: { persistSession: false },
});

function rowToClinic(row: Database['public']['Tables']['clinics']['Row']): Clinic {
  return {
    id: row.id, name: row.name, type: row.type as Clinic['type'], address: row.address,
    operatorName: row.operator_name, phone: row.phone ?? undefined, email: row.email ?? undefined,
    plan: row.plan as Clinic['plan'], trialEndsAt: row.trial_ends_at ?? undefined,
    knowledge: row.knowledge,
  };
}

function rowToPatient(row: Database['public']['Tables']['patients']['Row']): Patient {
  return {
    id: row.id, clinicId: row.clinic_id, name: row.name, phone: row.phone,
    initials: row.initials ?? '', avatarColor: row.avatar_color ?? '',
    age: row.age ?? undefined, gender: (row.gender as 'm' | 'f') ?? undefined,
    firstVisit: row.first_visit, lastVisit: row.last_visit,
    treatments: [], payments: [],
    medicalNotes: row.medical_notes ?? undefined, consent: row.consent, optedOut: row.opted_out,
    addedAt: row.added_at, insights: row.insights ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-tenant lookups used by the WhatsApp webhook (service role only)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchClinicByWaPhoneNumberId(waPhoneNumberId: string): Promise<Clinic | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabaseAdmin.from('clinics').select('*').eq('wa_phone_number_id', waPhoneNumberId).single();
  if (error || !data) return null;
  return rowToClinic(data);
}

export async function fetchPatientByPhone(clinicId: string, phone: string): Promise<Patient | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabaseAdmin.from('patients').select('*').eq('clinic_id', clinicId).eq('phone', phone).single();
  if (error || !data) return null;
  return rowToPatient(data);
}

function rowToOutreach(row: Database['public']['Tables']['outreach']['Row']): Outreach {
  return {
    id: row.id, clinicId: row.clinic_id, patientId: row.patient_id, kind: row.kind as Outreach['kind'],
    channel: row.channel as Outreach['channel'], status: row.status as Outreach['status'], message: row.message,
    relatedTreatmentId: row.related_treatment_id ?? undefined, createdAt: row.created_at,
    sentAt: row.sent_at ?? undefined, respondedAt: row.responded_at ?? undefined, insight: row.insight ?? undefined,
  };
}

export async function fetchLatestSentOutreach(clinicId: string, patientId: string): Promise<Outreach | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabaseAdmin
    .from('outreach').select('*')
    .eq('clinic_id', clinicId).eq('patient_id', patientId).eq('status', 'sent')
    .order('sent_at', { ascending: false }).limit(1).single();
  if (error || !data) return null;
  return rowToOutreach(data);
}

export async function updateOutreachRow(id: string, patch: { status: string; respondedAt: string; insight: string }): Promise<void> {
  if (!isSupabaseConfigured) return;
  await (supabaseAdmin.from('outreach') as any).update({ status: patch.status, responded_at: patch.respondedAt, insight: patch.insight }).eq('id', id);
}

export async function createEscalationRow(clinicId: string, patientId: string, reason: EscalationReason, snippet: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await (supabaseAdmin.from('escalations') as any).insert([{
    id: `esc-${Date.now()}`, clinic_id: clinicId, patient_id: patientId, reason, status: 'pending', snippet,
  }]);
}

export async function appendPatientInsight(patientId: string, insight: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data } = await supabaseAdmin.from('patients').select('insights').eq('id', patientId).single();
  const existing: string[] = (data as { insights: string[] } | null)?.insights ?? [];
  await (supabaseAdmin.from('patients') as any).update({ insights: [insight, ...existing] }).eq('id', patientId);
}
