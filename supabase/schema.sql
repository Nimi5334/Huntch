-- ============================================================
-- Huntch — Supabase schema
-- Run in Supabase → SQL Editor (paste all, Run).
-- Mirrors lib/types.ts, plus live-ops fields (real phone, opt-out, webhook log).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type venue_type   as enum ('cafe','restaurant','bar','fast-food','catering','hotel');
  create type role_type     as enum ('barista','server','cook','line-cook','dishwasher','host','bartender','cashier','delivery','shift-manager');
  create type shift_type    as enum ('morning','afternoon','evening','night','weekend');
  create type language_type  as enum ('he','ar','en','ru');
  create type consent_source as enum ('apply-form','csv-import','direct','lead-ad','qr-scan');
  create type invite_status  as enum ('sent','delivered','responded','declined');
  create type job_status      as enum ('active','filled','paused');
  create type employment      as enum ('applicant','employee'); -- pool vs workforce
exception when duplicate_object then null; end $$;

-- ---------- businesses ----------
-- Linked 1:1 to a Supabase Auth user (owner). auth.uid() = owner_id.
create table if not exists businesses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid unique references auth.users(id) on delete cascade,
  name          text not null,
  type          venue_type not null,
  address       text not null,
  lat           double precision,
  lng           double precision,
  operator_name text,
  phone         text,                 -- owner's contact phone (E.164)
  staffing_state text default 'has-gaps',
  created_at    timestamptz not null default now()
);

-- ---------- candidates (workers) ----------
-- The intermediary asset. NEVER exposed directly to businesses except via ranked results
-- the server returns. Owned/scoped by the business that enrolled them.
create table if not exists candidates (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  status          employment not null default 'applicant', -- applicant (pool) | employee (workforce)
  name            text not null,
  phone           text not null,        -- E.164, used to send WhatsApp
  neighborhood    text,
  lat             double precision,
  lng             double precision,
  has_car         boolean default false,
  willing_range_km numeric default 10,
  roles           role_type[] not null default '{}',
  shifts          shift_type[] not null default '{}',
  days            text[] not null default '{}',
  hours_per_week  int default 35,
  earliest_start  date,
  immediate       boolean default false,
  experience_years int default 0,
  experience_roles role_type[] not null default '{}',
  venue_types     venue_type[] not null default '{}',
  skills          text[] not null default '{}',
  languages       language_type[] not null default '{he}',
  has_work_permit boolean default true,
  age             int,
  expected_wage_nis numeric,
  consent_source  consent_source not null,
  consent_at      timestamptz not null default now(),
  -- compliance / live-ops
  opted_out       boolean not null default false,   -- set true on "STOP"
  opted_out_at    timestamptz,
  last_active     timestamptz default now(),
  created_at      timestamptz not null default now(),
  unique (business_id, phone)
);

-- ---------- jobs ----------
create table if not exists jobs (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  role          role_type not null,
  location_address text,
  lat           double precision,
  lng           double precision,
  shifts        shift_type[] not null default '{}',
  start_date    date,
  requirements  text,
  wage_nis      numeric,
  filters       jsonb not null default '{}',   -- JobFilters
  weights       jsonb not null default '{}',   -- JobWeights
  must_haves    text[] not null default '{}',
  status        job_status not null default 'active',
  created_at    timestamptz not null default now()
);

-- ---------- invites ----------
create table if not exists invites (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references jobs(id) on delete cascade,
  candidate_id  uuid not null references candidates(id) on delete cascade,
  business_id   uuid not null references businesses(id) on delete cascade,
  status        invite_status not null default 'sent',
  wa_message    text,
  wa_message_id text,                  -- Meta message id (for delivery/read receipts)
  sent_at       timestamptz not null default now(),
  responded_at  timestamptz,
  unique (job_id, candidate_id)
);

-- ---------- applications (public apply form) ----------
create table if not exists applications (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references jobs(id) on delete set null,
  candidate_id  uuid not null references candidates(id) on delete cascade,
  business_id   uuid not null references businesses(id) on delete cascade,
  source        consent_source not null,
  created_at    timestamptz not null default now()
);

-- ---------- qr_scans (acquisition tracking) ----------
create table if not exists qr_scans (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  candidate_id  uuid references candidates(id) on delete set null,
  source        text,                  -- ?src= param (sticker, telegram, etc.)
  scanned_at    timestamptz not null default now()
);

-- ---------- whatsapp_events (webhook idempotency + audit) ----------
-- Meta retries webhooks; store the message id so we never double-process.
create table if not exists whatsapp_events (
  id            uuid primary key default gen_random_uuid(),
  wa_message_id text unique,           -- inbound message id from Meta
  from_phone    text,
  body          text,
  raw           jsonb,
  processed_at  timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_candidates_business on candidates(business_id);
create index if not exists idx_candidates_phone    on candidates(phone);
create index if not exists idx_jobs_business       on jobs(business_id);
create index if not exists idx_invites_job         on invites(job_id);
create index if not exists idx_invites_candidate   on invites(candidate_id);

-- ============================================================
-- Row-Level Security
-- Owners (auth users) can only touch their own business's rows.
-- The webhook + public opt-in forms use the SERVICE ROLE key, which bypasses RLS.
-- Candidates are never selectable by other businesses.
-- ============================================================
alter table businesses   enable row level security;
alter table candidates   enable row level security;
alter table jobs         enable row level security;
alter table invites      enable row level security;
alter table applications enable row level security;
alter table qr_scans     enable row level security;

-- businesses: an owner sees/edits only their own row
create policy biz_owner_all on businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- helper predicate: row belongs to the caller's business
-- (inlined per table since policies can't share functions cleanly without SECURITY DEFINER)
create policy cand_owner_all on candidates
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy jobs_owner_all on jobs
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy invites_owner_all on invites
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy apps_owner_all on applications
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy qr_owner_all on qr_scans
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- whatsapp_events: no RLS policies → only service role can read/write (correct).
alter table whatsapp_events enable row level security;
