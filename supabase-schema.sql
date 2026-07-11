-- ═══════════════════════════════════════════════════════════════════════════
-- Huntch Database Schema — AI Clinic Patient-Reactivation Platform
-- Multi-tenant: every clinic-owned table carries clinic_id and is protected
-- by Row-Level Security scoped through the memberships table.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Clinics — one tenant per row
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'dental', -- 'dental' | 'aesthetic'
  address TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'basic', -- 'basic' | 'advanced'
  trial_ends_at TIMESTAMP,
  -- WhatsApp Business routing — which registered number belongs to this clinic
  wa_phone_number_id TEXT UNIQUE,
  wa_access_token_encrypted TEXT, -- encrypted at rest; never selected by the anon key
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Memberships — maps an authenticated user to the clinic(s) they can access
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE memberships (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- 'owner' | 'staff'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, clinic_id)
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_clinic_id ON memberships(clinic_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Patients — full medical/contact profile
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  initials TEXT,
  avatar_color TEXT,
  age INTEGER,
  gender TEXT, -- 'm' | 'f'
  first_visit DATE NOT NULL,
  last_visit DATE NOT NULL,
  medical_notes TEXT,
  consent BOOLEAN NOT NULL DEFAULT TRUE,
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  added_at DATE DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_phone ON patients(phone);

-- ─────────────────────────────────────────────────────────────────────────────
-- Treatments — treatment history per patient
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE treatments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'planned' | 'in-progress'
  cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_treatments_clinic_id ON treatments(clinic_id);
CREATE INDEX idx_treatments_patient_id ON treatments(patient_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payments — billing per patient
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT, -- 'cash' | 'card' | 'insurance' | 'transfer'
  treatment_id TEXT REFERENCES treatments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Outreach — approve-before-send periodic reactivation messages (WhatsApp/SMS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE outreach (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'reactivation', -- always 'reactivation' — the app's one job
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp' | 'sms'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'sent' | 'replied' | 'declined' | 'no_reply'
  message TEXT NOT NULL,
  related_treatment_id TEXT REFERENCES treatments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  responded_at TIMESTAMP
);

CREATE INDEX idx_outreach_clinic_id ON outreach(clinic_id);
CREATE INDEX idx_outreach_patient_id ON outreach(patient_id);
CREATE INDEX idx_outreach_status ON outreach(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security — every clinic-owned table is isolated per tenant
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE clinics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach      ENABLE ROW LEVEL SECURITY;

-- Helper: clinic ids the current authenticated user belongs to
CREATE OR REPLACE FUNCTION auth_clinic_ids()
RETURNS SETOF TEXT
LANGUAGE sql STABLE
AS $$
  SELECT clinic_id FROM memberships WHERE user_id = auth.uid()
$$;

CREATE POLICY "members can read their clinic" ON clinics
  FOR SELECT USING (id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can update their clinic" ON clinics
  FOR UPDATE USING (id IN (SELECT auth_clinic_ids()));

CREATE POLICY "users can read their own memberships" ON memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "members can read their clinic's patients" ON patients
  FOR SELECT USING (clinic_id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can write their clinic's patients" ON patients
  FOR INSERT WITH CHECK (clinic_id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can update their clinic's patients" ON patients
  FOR UPDATE USING (clinic_id IN (SELECT auth_clinic_ids()));

CREATE POLICY "members can read their clinic's treatments" ON treatments
  FOR SELECT USING (clinic_id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can write their clinic's treatments" ON treatments
  FOR INSERT WITH CHECK (clinic_id IN (SELECT auth_clinic_ids()));

CREATE POLICY "members can read their clinic's payments" ON payments
  FOR SELECT USING (clinic_id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can write their clinic's payments" ON payments
  FOR INSERT WITH CHECK (clinic_id IN (SELECT auth_clinic_ids()));

CREATE POLICY "members can read their clinic's outreach" ON outreach
  FOR SELECT USING (clinic_id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can write their clinic's outreach" ON outreach
  FOR INSERT WITH CHECK (clinic_id IN (SELECT auth_clinic_ids()));
CREATE POLICY "members can update their clinic's outreach" ON outreach
  FOR UPDATE USING (clinic_id IN (SELECT auth_clinic_ids()));

-- NOTE: the WhatsApp webhook runs with the SERVICE ROLE key (server-only,
-- bypasses RLS by design) since it acts on behalf of the platform across
-- tenants, keyed by wa_phone_number_id — never expose the service-role key
-- to the client.

-- ═══════════════════════════════════════════════════════════════════════════
