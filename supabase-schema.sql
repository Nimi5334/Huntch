-- ═══════════════════════════════════════════════════════════════════════════
-- Huntch Database Schema — Supabase PostgreSQL
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Businesses — one record per café/restaurant/bar owner
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'cafe' | 'restaurant' | 'bar' | 'fast-food' | 'catering' | 'hotel'
  address TEXT NOT NULL,
  location JSONB NOT NULL, -- { lat: number, lng: number }
  operator_name TEXT NOT NULL,
  staffing_state TEXT NOT NULL, -- 'fully-staffed' | 'has-gaps'
  phone TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Candidates — applicants from QR scans + manual adds (pool + employees)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  initials TEXT,
  avatar_color TEXT,
  neighborhood TEXT,
  location JSONB NOT NULL, -- { lat: number, lng: number }
  has_car BOOLEAN DEFAULT FALSE,
  willing_range_km INTEGER,
  availability JSONB NOT NULL, -- { days, shifts, hoursPerWeek, earliestStart, immediate }
  roles TEXT[] DEFAULT '{}', -- array of role names
  experience JSONB NOT NULL, -- { totalYears, roles, venueTypes, notableWorkplaces }
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{"he"}',
  has_work_permit BOOLEAN DEFAULT TRUE,
  age INTEGER,
  expected_wage_nis INTEGER,
  signals JSONB NOT NULL, -- { applicationCount, priorHires, responseSpeedHours, lastActiveDaysAgo, formCompletionSec, firstReplyLatencySec }
  consent_source TEXT DEFAULT 'qr-scan',
  -- DNA Feeder enrichment
  needs_supplies_fit TEXT[],
  schedule_tolerance TEXT, -- 'very' | 'nice' | 'flexible'
  interview_scores JSONB, -- { serviceHandling, ownership }
  dna_source TEXT, -- 'cold_start' | 'platform_history' | 'hybrid'
  dna_confidence NUMERIC,
  added_at DATE DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_candidates_business_id ON candidates(business_id);
CREATE INDEX idx_candidates_added_at ON candidates(added_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Employees — hired candidates (subset of candidates, marked active)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  hired_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active' | 'archived'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_business_id ON employees(business_id);
CREATE INDEX idx_employees_candidate_id ON employees(candidate_id);
CREATE INDEX idx_employees_status ON employees(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Jobs — active job listings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  location_address TEXT,
  location JSONB NOT NULL, -- { lat: number, lng: number }
  shifts TEXT[] DEFAULT '{}',
  start_date DATE,
  requirements TEXT,
  wage_nis INTEGER,
  filters JSONB, -- { roles, maxDistanceKm, shifts, minExperienceYears, languages, maxWageNis, mustHaveImmediate, mustHaveWorkPermit }
  weights JSONB, -- { availability, distance, roleExperience, skills, compensation, recency }
  must_haves TEXT[] DEFAULT '{}',
  flow TEXT DEFAULT 'flow2',
  status TEXT DEFAULT 'active', -- 'active' | 'filled' | 'paused'
  created_at DATE DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_business_id ON jobs(business_id);
CREATE INDEX idx_jobs_status ON jobs(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Invites — WhatsApp invitations sent to candidates
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE invites (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'sent' | 'delivered' | 'responded' | 'declined'
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  wa_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invites_job_id ON invites(job_id);
CREATE INDEX idx_invites_candidate_id ON invites(candidate_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- QR Scans — tracking QR code scans by business
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE qr_scans (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qr_scans_business_id ON qr_scans(business_id);
CREATE INDEX idx_qr_scans_candidate_id ON qr_scans(candidate_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- WhatsApp Interview Results — completed DNA feeder sessions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE wa_interview_results (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phases_completed SMALLINT DEFAULT 1, -- 1 | 2 | 3
  answers JSONB NOT NULL, -- DnaFeederAnswers
  dna_score NUMERIC,
  dna_confidence NUMERIC, -- 0–1: 0.30 / 0.60 / 0.90 by phases
  retention_fit NUMERIC,
  performance NUMERIC,
  churn_risk TEXT, -- 'low' | 'medium' | 'high'
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wa_results_candidate_id ON wa_interview_results(candidate_id);
CREATE INDEX idx_wa_results_business_id ON wa_interview_results(business_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- WhatsApp Sessions — active conversations (replaces in-memory Map)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE wa_sessions (
  phone TEXT PRIMARY KEY, -- normalized: 972XXXXXXXXX
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT,
  candidate_name TEXT,
  step TEXT NOT NULL, -- FlowStep enum
  answers JSONB DEFAULT '{}', -- DnaFeederAnswers (accumulates)
  phases_completed SMALLINT DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  form_completion_sec INTEGER,
  first_reply_latency_sec INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wa_sessions_business_id ON wa_sessions(business_id);
CREATE INDEX idx_wa_sessions_candidate_id ON wa_sessions(candidate_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Employee Requests — leave, shift-swap, schedule-change, etc.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE employee_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'leave' | 'shift-swap' | 'schedule-change' | 'other'
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'denied'
  details TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employee_requests_business_id ON employee_requests(business_id);
CREATE INDEX idx_employee_requests_employee_id ON employee_requests(employee_id);
CREATE INDEX idx_employee_requests_status ON employee_requests(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Saved + Dismissed Candidates — user preferences per business
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE candidate_preferences (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  saved BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_preferences_business_id ON candidate_preferences(business_id);
CREATE INDEX idx_preferences_candidate_id ON candidate_preferences(candidate_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — Data isolation per business
-- ═══════════════════════════════════════════════════════════════════════════

-- For now, RLS is disabled. In production, add:
-- 1. auth.users table (sign-up/login)
-- 2. business_users junction (maps user to business)
-- 3. RLS policies on all tables: "SELECT WHERE business_id = auth.user_business_id()"

-- ═══════════════════════════════════════════════════════════════════════════
