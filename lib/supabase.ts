/**
 * Supabase Client Wrapper for Huntch
 * Handles all database operations with type safety.
 *
 * Usage:
 *   - Client-side: `import { supabase } from '@/lib/supabase'`
 *   - Server-side: `import { createServerClient } from '@/lib/supabase'`
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set — falling back to localStorage only');
}

/**
 * Client-side Supabase instance
 * Auto-refreshes auth token, handles realtime subscriptions
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
});

/**
 * Server-side Supabase instance (for API routes)
 * Use when you need server auth context
 */
export function createServerClient(
  accessToken?: string
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Business queries
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error) {
    console.error('fetchBusiness error:', error);
    return null;
  }
  return data;
}

export async function createBusiness(business: {
  id: string;
  name: string;
  type: string;
  address: string;
  location: { lat: number; lng: number };
  operator_name: string;
  phone?: string;
  password?: string;
}) {
  const { data, error } = await supabase
    .from('businesses')
    .insert([business])
    .select()
    .single();

  if (error) {
    console.error('createBusiness error:', error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidate queries
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchCandidatesForBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('business_id', businessId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('fetchCandidatesForBusiness error:', error);
    return [];
  }
  return data || [];
}

export async function fetchCandidate(candidateId: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (error) {
    console.error('fetchCandidate error:', error);
    return null;
  }
  return data;
}

export async function createCandidate(candidate: {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  initials: string;
  avatar_color: string;
  neighborhood: string;
  location: { lat: number; lng: number };
  has_car: boolean;
  willing_range_km: number;
  availability: any;
  roles: string[];
  experience: any;
  skills: string[];
  languages: string[];
  has_work_permit: boolean;
  age: number;
  expected_wage_nis: number;
  signals: any;
  consent_source: string;
}) {
  const { data, error } = await supabase
    .from('candidates')
    .insert([candidate])
    .select()
    .single();

  if (error) {
    console.error('createCandidate error:', error);
    throw error;
  }
  return data;
}

export async function updateCandidate(
  candidateId: string,
  updates: Partial<any>
) {
  const { data, error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    console.error('updateCandidate error:', error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee queries
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchEmployeesForBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*, candidate:candidates(*)')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('hired_at', { ascending: false });

  if (error) {
    console.error('fetchEmployeesForBusiness error:', error);
    return [];
  }
  return data || [];
}

export async function hireCandidate(
  businessId: string,
  candidateId: string
) {
  const { data, error } = await supabase
    .from('employees')
    .insert([
      {
        id: `emp-${Date.now()}`,
        business_id: businessId,
        candidate_id: candidateId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('hireCandidate error:', error);
    throw error;
  }
  return data;
}

export async function fireEmployee(employeeId: string) {
  const { error } = await supabase
    .from('employees')
    .update({ status: 'archived' })
    .eq('id', employeeId);

  if (error) {
    console.error('fireEmployee error:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job queries
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchJobsForBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchJobsForBusiness error:', error);
    return [];
  }
  return data || [];
}

export async function createJob(job: {
  id: string;
  business_id: string;
  role: string;
  location_address: string;
  location: { lat: number; lng: number };
  shifts: string[];
  start_date: string;
  requirements: string;
  wage_nis?: number;
  filters: any;
  weights: any;
  must_haves: string[];
}) {
  const { data, error } = await supabase
    .from('jobs')
    .insert([job])
    .select()
    .single();

  if (error) {
    console.error('createJob error:', error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite queries
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchInvitesForJob(jobId: string) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('job_id', jobId);

  if (error) {
    console.error('fetchInvitesForJob error:', error);
    return [];
  }
  return data || [];
}

export async function createInvite(invite: {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  wa_message: string;
}) {
  const { data, error } = await supabase
    .from('invites')
    .insert([invite])
    .select()
    .single();

  if (error) {
    console.error('createInvite error:', error);
    throw error;
  }
  return data;
}

export async function updateInvite(
  inviteId: string,
  updates: { status?: string; responded_at?: string }
) {
  const { data, error } = await supabase
    .from('invites')
    .update(updates)
    .eq('id', inviteId)
    .select()
    .single();

  if (error) {
    console.error('updateInvite error:', error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// QR Scan queries
// ─────────────────────────────────────────────────────────────────────────────

export async function createQrScan(scan: {
  id: string;
  business_id: string;
  candidate_id: string;
}) {
  const { error } = await supabase
    .from('qr_scans')
    .insert([scan]);

  if (error) {
    console.error('createQrScan error:', error);
    throw error;
  }
}

export async function fetchQrScansForBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('qr_scans')
    .select('*')
    .eq('business_id', businessId)
    .order('scanned_at', { ascending: false });

  if (error) {
    console.error('fetchQrScansForBusiness error:', error);
    return [];
  }
  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Interview Results
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchInterviewResult(candidateId: string) {
  const { data, error } = await supabase
    .from('wa_interview_results')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('fetchInterviewResult error:', error);
  }
  return data || null;
}

export async function createInterviewResult(result: {
  id?: string;
  candidate_id: string;
  business_id: string;
  phases_completed: number;
  answers: any;
  dna_score: number;
  dna_confidence: number;
  retention_fit: number;
  performance: number;
  churn_risk: string;
}) {
  const { data, error } = await supabase
    .from('wa_interview_results')
    .insert([result])
    .select()
    .single();

  if (error) {
    console.error('createInterviewResult error:', error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Sessions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchWaSession(phone: string) {
  const { data, error } = await supabase
    .from('wa_sessions')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('fetchWaSession error:', error);
  }
  return data || null;
}

export async function createWaSession(session: {
  phone: string;
  candidate_id: string;
  business_id: string;
  business_name: string;
  candidate_name: string;
  step: string;
  answers?: any;
}) {
  const { data, error } = await supabase
    .from('wa_sessions')
    .insert([session])
    .select()
    .single();

  if (error) {
    console.error('createWaSession error:', error);
    throw error;
  }
  return data;
}

export async function updateWaSession(
  phone: string,
  updates: Partial<any>
) {
  const { data, error } = await supabase
    .from('wa_sessions')
    .update(updates)
    .eq('phone', phone)
    .select()
    .single();

  if (error) {
    console.error('updateWaSession error:', error);
    throw error;
  }
  return data;
}

export async function deleteWaSession(phone: string) {
  const { error } = await supabase
    .from('wa_sessions')
    .delete()
    .eq('phone', phone);

  if (error) {
    console.error('deleteWaSession error:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Requests
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchEmployeeRequests(businessId: string) {
  const { data, error } = await supabase
    .from('employee_requests')
    .select('*')
    .eq('business_id', businessId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('fetchEmployeeRequests error:', error);
    return [];
  }
  return data || [];
}

export async function createEmployeeRequest(request: {
  id: string;
  business_id: string;
  employee_id: string;
  type: string;
  details?: string;
}) {
  const { data, error } = await supabase
    .from('employee_requests')
    .insert([request])
    .select()
    .single();

  if (error) {
    console.error('createEmployeeRequest error:', error);
    throw error;
  }
  return data;
}

export async function updateEmployeeRequest(
  requestId: string,
  updates: { status: string }
) {
  const { data, error } = await supabase
    .from('employee_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('updateEmployeeRequest error:', error);
    throw error;
  }
  return data;
}
