@AGENTS.md

---

# HUNTCH — Project Intelligence

> Every Claude session starts here. This file is the single source of truth for what Huntch is, how it works, and every architectural decision made so far.

---

## What is Huntch

Israeli F&B staffing platform. Connects café/restaurant/bar owners with workers who scan a QR code at the venue. No job boards. No CVs. QR → form → WhatsApp DNA interview → ranked pool → WhatsApp invite → real interview → hired.

**Stage:** MVP in progress. Supabase integrated. QR + join form fully working. WhatsApp DNA feeder coded, awaiting credentials.
**Language:** Hebrew (RTL, `dir="rtl"`, `lang="he"`).
**Operator:** Single business owner per account (e.g. "בית קפה לינה").
**Deployed:** https://formdna.vercel.app
**GitHub:** https://github.com/Nimi5334/Huntch (branch: master)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.9 App Router** — read `node_modules/next/dist/docs/` before any routing work |
| React | **React 19** — use `React.JSX.Element`, not `JSX.Element` |
| State | **Zustand + localStorage** — store key `huntch-store-v2`, `skipHydration: true` |
| Database | **Supabase** (PostgreSQL) — project `ijbbhtljxqnjboyhrjqw.supabase.co` |
| Styling | **Tailwind v3** (`corePlugins: { preflight: false }`) + plain CSS design system in `app/globals.css` |
| Components | **shadcn/ui** in `components/ui/` |
| Animation | **framer-motion** `AnimatePresence` |
| Fonts | Heebo (Hebrew body) + Frank Ruhl Libre (Hebrew serif headings) + JetBrains Mono (numbers) |
| QR Code | **qrcode** npm package (self-hosted, no external API) |

---

## Brand — Chalk & Cedar

```css
--accent:      #4a7a5a   /* sage green — primary action */
--cedar:       #7c5c3e   /* warm cedar — secondary */
--ink:         #221b16   /* near-black */
--paper:       #fdfcfa   /* chalk paper background */
--accent-soft: #e8efe9   /* sage surface */
--cedar-soft:  #f1e9e1   /* cedar surface */
--muted:       #7c6f63
--muted2:      #a89c8f
--amber:       #c08a2e
--line:        rgba(124,92,62,0.14)
--radius:      22px
```

No emoji as icons (use SVG). No purple/blue AI gradients. Hebrew RTL at all times.

---

## Current State (as of 2026-06-24)

### ✅ Done & Working
- QR code page (`/hiring/qr`) — self-hosted, generates per-business URL, downloadable print stickers
- Join form (`/join/[businessId]`) — public, saves to Supabase (localStorage fallback if no creds)
- Supabase schema — all tables created and committed (`supabase-schema.sql`)
- Supabase client — `lib/supabase.ts` with full query helpers
- WhatsApp DNA feeder — state machine coded in `lib/whatsapp-flow.ts`, API routes ready
- DNA cold-start scoring — `computeDnaColdStart()` in `lib/dna.ts`
- Auto-login for demo — `isLoggedIn: true` by default (no login required for MVP demo)

### ⏳ Pending (Next Session)
1. **Run Supabase schema** — go to https://app.supabase.com → SQL Editor → paste `supabase-schema.sql` → Run
2. **Set Vercel env vars** — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **WhatsApp API credentials** — `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`
4. **Register WhatsApp webhook** in Meta Developer Console → points to `https://formdna.vercel.app/api/whatsapp`
5. **Connect join form → business dashboard** — so QR submissions appear live in owner's pool

---

## Environment Variables

### `.env.local` (local development)

```bash
NEXT_PUBLIC_APP_URL=https://formdna.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ijbbhtljxqnjboyhrjqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYmJodGxqeHFuamJveWhyanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODYzNTYsImV4cCI6MjA5Nzg2MjM1Nn0.jx5ooGe8ntVAmJMx9ccqKxWDdFiseGjPbkpAs8Ttltc
WHATSAPP_ACCESS_TOKEN=           # from Meta Developer Console
WHATSAPP_PHONE_NUMBER_ID=        # from Meta Developer Console
WHATSAPP_VERIFY_TOKEN=huntch_webhook_secret
```

### Vercel (production)
Set these in: https://vercel.com → formdna project → Settings → Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://formdna.vercel.app`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN` = `huntch_webhook_secret`

---

## Demo Credentials

```
Business: בית קפה לינה
Business ID: biz-1
Phone: 0500000000
Password: 533433
```

**Note:** `isLoggedIn: true` by default in `lib/store.ts` — login screen is bypassed for demo. To re-enable auth, change to `isLoggedIn: false`.

---

## The 5-Phase Worker Journey

### Phase 1 — Discovery & Onboarding (with DNA Seeding)
```
Worker scans QR at venue
  → /join/[businessId] — public page, no login needed
  → Quick form (30 seconds):
    • Name, phone, neighborhood
    • Which roles? (multi-select chips)
    • Which shifts? (multi-select chips)
    • Years of experience?
    • Expected wage (₪/hr)
    • Consent checkbox
  → Profile created → saved to Supabase candidates table
  → WhatsApp DNA feeder triggered automatically
  → 14-step WhatsApp interview begins (see DNA Feeder section)
```

### Phase 2 — Manager Search & Ranking
```
Manager opens "בית" (Home) dashboard
  → Sees role filter chips — ONLY roles with active jobs
    (demo: 1 barista job → only "בריסטה" chip shows)
  → Candidates ranked by DNA algorithm:
      distance · availability · experience · response speed · recency · reliability
  → Top 5 shown as ranked cards
```

### Phase 3 — Real-Life Interview ← IMPORTANT, often misunderstood
```
Manager selects a wanted candidate → clicks "הזמן לראיון"
  → WhatsApp API sends branded message from the business
     ("שלום מיה! נשמח להכיר — מתי נוח לך לבוא?")
  → NO new app for the worker — pure WhatsApp
  → Real face-to-face interview happens
  → Manager decides:
      ✅ Hired → worker enters Huntch as an active card (moves to store.employees)
      ❌ Not hired → stays in pool, Huntch surfaces next ranked candidate
```

### Phase 4 — Workforce Activation
```
Hired worker visible in כוח אדם → עובדים
  → Full employee card: wage, shifts, hours/week, distance, DNA score
  → Badge: 🟢 "פעיל בצוות"
  → Profile page: "פרופיל עובד" (not "פרופיל מועמד")
  → Action button: "הסר מהצוות" (not "הזמן לראיון")
```

### Phase 5 — Ongoing Management (6 AI Engines)
```
1. 🧬 DNA Engine       — reliability · response speed · recency (3 sub-bars)
2. 🎤 Voice Logging    — manager speaks → auto-tagged to worker behavioral data
3. 📅 Smart Scheduling — detects shift gaps, suggests best-fit worker, 1-tap invite
4. ⚠️ Churn Prediction — low / medium / high risk alerts
5. 💡 Retention System — suggests: raise wage, adjust hours, personal check-in
6. 📊 Activity Feed    — real-time events: responses, completions, churn alerts
```

---

## DNA Engine — How It Actually Works

### Two Phases of DNA Signal Collection

#### Phase 1A: QR Scan → Join Form (Initial seeding)
When a worker scans the QR code, they fill out the join form (`app/join/[businessId]/page.tsx`):
- Name, phone, neighborhood → basic profile
- Roles, shifts, experience, wage → availability + experience signals
- Signals seeded: `{ applicationCount: 1, priorHires: 0, responseSpeedHours: 1, lastActiveDaysAgo: 0 }`

#### Phase 1B: WhatsApp DNA Feeder (Deep seeding)
After join form submission, a 14-step WhatsApp interview starts automatically via `lib/whatsapp-flow.ts`. This is the primary data collection mechanism.

#### Phase 1C: After hired — WhatsApp API (Live updates)
DNA is NOT static. Every WhatsApp interaction updates `PlatformSignals`.

```
QR form → initial PlatformSignals (basic)
         ↓
WhatsApp DNA interview → enriched PlatformSignals + cold-start score
         ↓
WhatsApp API events (post-hire) → live PlatformSignals updates → computeDna()
         ↓
Voice logging (manager input) → PlatformSignals override
```

### PlatformSignals (lib/types.ts)

```typescript
interface PlatformSignals {
  applicationCount:    number   // how many times invited/contacted total
  priorHires:          number   // how many times actually hired
  responseSpeedHours:  number   // avg hours to respond to a WhatsApp message
  lastActiveDaysAgo:   number   // days since last WhatsApp interaction
  formCompletionSec?:  number   // passive: seconds to complete join form
  firstReplyLatencySec?: number // passive: seconds from first WA message to first reply
}
```

### DNA Feeder — 3-Phase WhatsApp Mini-Interview

**Full spec:** `DNA-FEEDER-SPEC.md` in project root.
**Implementation:** `lib/whatsapp-flow.ts` (server-only, 14-step state machine)

#### Phase 1: Core Match (~2 min, all taps)
```
Q1: Which roles? (list)            → roles
Q2: Hours per week? (buttons)      → availability.hoursPerWeek
Q3: Which shifts? (buttons)        → availability.shifts
Q4: When can you start? (buttons)  → availability.immediate, earliestStart
Q5: How do you commute? (buttons)  → hasCar
Q6: Max travel distance? (buttons) → willingRangeKm
Q7: Expected hourly wage? (text)   → expectedWageNis
```

#### Phase 2: Needs-Supplies Fit (~2 min — highest-value retention signals)
```
Q8:  What matters most? (list, pick 3) → needsSuppliesFit[]
Q9:  Fixed schedule importance? (buttons) → scheduleTolerance
Q10: Anything else? (optional text)    → needsNotes
```
**Why Phase 2 before Phase 3?** Needs-supplies fit is the single strongest predictor of turnover (β=−.58). Captured even if candidate drops off.

#### Phase 3: Experience & Behavioral (optional, ~2–4 min)
```
Q11: Years of experience? (buttons)     → experience.totalYears
Q12: Where have you worked? (text)      → experience.notableWorkplaces
Q13: Busy shift, angry customer — what do you do? (text prose)
     → interviewScores.serviceHandling (0–2, rubric-scored)
Q14: Tell us about a shift you're proud of (text prose)
     → interviewScores.ownership (0–2, rubric-scored)
```

#### Cold-Start DNA Score
```typescript
// computeDnaColdStart() in lib/dna.ts
Phase 1 confidence: 0.30  →  score = logistics*0.65 + experience*0.35
Phase 2 confidence: 0.60  →  score = retentionFit*0.45 + logistics*0.35 + exp*0.20
Phase 3 confidence: 0.90  →  score = retentionFit*0.40 + performance*0.30 + logistics*0.15 + exp*0.15

// NEVER collapse to 0 — use Empirical-Bayes shrinkage
reliability = 65  // population mean, not (priorHires / applicationCount)
display: "68 ± 12"  // Wilson confidence interval, not point estimate
```

### computeDna() Formula (lib/dna.ts)

```typescript
reliability    = (priorHires / applicationCount) × 150  // capped at 100
responseSpeed  = 100 - (responseSpeedHours × 9)         // fast reply = high score
recency        = 100 - (lastActiveDaysAgo × 7)          // active recently = high score

DNA score      = reliability×0.40 + responseSpeed×0.30 + recency×0.30

churnRisk = 'high'   if lastActiveDaysAgo > 11 OR responseSpeedHours > 9
churnRisk = 'medium' if lastActiveDaysAgo > 5  OR responseSpeedHours > 4
churnRisk = 'low'    otherwise
```

---

## Supabase — Database Layer

### Project Details
- **URL:** `https://ijbbhtljxqnjboyhrjqw.supabase.co`
- **Anon key:** See `.env.local.example` (pre-filled)
- **Schema:** `supabase-schema.sql` in project root

### Tables
| Table | Purpose |
|---|---|
| `businesses` | One record per café/restaurant/bar owner |
| `candidates` | All applicants from QR scans + manual adds |
| `employees` | Hired candidates (references candidates) |
| `jobs` | Active job listings |
| `invites` | WhatsApp invitations sent to candidates |
| `qr_scans` | Audit trail of QR code scans |
| `wa_interview_results` | Completed DNA feeder interviews |
| `wa_sessions` | Active WhatsApp conversations (replaces in-memory Map) |
| `employee_requests` | Leave/shift-swap/schedule-change requests |
| `candidate_preferences` | Saved/dismissed candidates per business |

### Setup (one-time)
1. https://app.supabase.com → your project → SQL Editor → New Query
2. Paste entire `supabase-schema.sql` → Run
3. Copy `.env.local.example` → `.env.local` (credentials pre-filled)

### How Data Flows
```
QR scan → /join/[businessId] → submit
  → createCandidate() → Supabase candidates table  ✅ wired
  → createQrScan()   → Supabase qr_scans table     ✅ wired
  → fallback to Zustand localStorage if no creds    ✅ fallback
  → /api/whatsapp/trigger → WhatsApp DNA feeder     ✅ triggered
```

---

## WhatsApp API Integration

### Files
| File | Purpose |
|---|---|
| `lib/whatsapp-client.ts` | Meta Cloud API wrapper (sendText, sendButtons, sendList) |
| `lib/whatsapp-session.ts` | Session types + in-memory Maps (replace with Supabase wa_sessions) |
| `lib/whatsapp-flow.ts` | 14-step conversation state machine — full Hebrew copy |
| `app/api/whatsapp/route.ts` | GET = hub verification, POST = incoming webhook handler |
| `app/api/whatsapp/trigger/route.ts` | POST to start a conversation |
| `app/api/whatsapp/results/[candidateId]/route.ts` | GET interview result for a candidate |

### Flow
```
1. Candidate submits join form
2. POST /api/whatsapp/trigger { candidateId, candidateName, phone, businessId, businessName }
3. lib/whatsapp-flow.ts::startSession() → sends welcome + Q1
4. Candidate replies → WhatsApp webhook → POST /api/whatsapp
5. lib/whatsapp-flow.ts::handleIncoming() → advances state machine → sends next question
6. After Q10 (or Q14) → finalizeSession() → computeDnaColdStart() → store in Supabase
```

### What's Needed to Activate
1. `WHATSAPP_ACCESS_TOKEN` from Meta Developer Console
2. `WHATSAPP_PHONE_NUMBER_ID` from Meta → WhatsApp → API Setup
3. Register webhook: Meta → Your App → WhatsApp → Configuration → Webhook URL = `https://formdna.vercel.app/api/whatsapp`
4. Set `WHATSAPP_VERIFY_TOKEN=huntch_webhook_secret` in both Vercel and Meta console

---

## Data Model — THE MOST IMPORTANT THING

Three separate concepts. Do NOT confuse them.

### `store.pool` / `supabase.candidates` — QR Applicants
- People who scanned the QR code and filled in their details
- **Shown on: Home page ("בית")** as ranked candidates
- NOT active employees

### `store.employees` / `supabase.employees` — Active Staff
- People currently working for the owner
- **Shown on: Workforce page ("כוח אדם → עובדים")**
- Hired via `store.hireFromPool(candidateId)` — moves from pool → employees

### Pool (backend concept)
- Just the internal name for `store.pool`
- **Never appears as a label in the UI**
- The sub-tab was renamed "עובדים" (not "מאגר")

### Actions
```typescript
store.hireFromPool(candidateId)  // moves pool → employees
store.fireEmployee(employeeId)   // removes from employees
store.addEmployee(raw)           // adds directly to employees
```

---

## QR Code System

### How It Works
- **Page:** `app/(app)/hiring/qr/page.tsx`
- **Library:** `qrcode` npm package (self-hosted, no external API)
- **URL pattern:** `https://formdna.vercel.app/join/[businessId]`
- **Demo URL:** `https://formdna.vercel.app/join/biz-1`
- **Business ID source:** `store.business.id` (unique per business)
- **Test:** `node test-qr.mjs` — verifies generation works

### Printable Sticker Cards
Two designs downloadable as high-res PNG (900×1100px):
- **Dark** (`#1a1410` bg) — "אנחנו מגייסים!" — for venue window
- **Amber** (`#f59e0b` bg) — "מחפש/ת עבודה?" — for public spaces

### Join Form (`app/join/[businessId]/page.tsx`)
- Public route — no auth required
- Looks up business: `store.business.id === businessId ? store.business : null`
- Saves to Supabase `candidates` + `qr_scans` tables
- Falls back to Zustand localStorage if Supabase not configured
- Triggers WhatsApp DNA feeder automatically on submit
- Shows "תודה, [name]!" success screen

---

## Venue → Role Mapping (`lib/venue.ts`)

Every place roles are listed must import from here. Never hardcode role lists.

```typescript
import { venueRoles, ROLE_HE, ROLE_ICON } from '@/lib/venue'
venueRoles(store.business.type)  // e.g. ['barista','server','cashier','host','shift-manager']
```

| Venue type | Roles |
|---|---|
| `cafe` | barista, server, cashier, host, shift-manager |
| `restaurant` | server, cook, line-cook, dishwasher, host, cashier, shift-manager |
| `bar` | bartender, server, host, cashier, shift-manager |
| `fast-food` | cashier, cook, line-cook, dishwasher, delivery, shift-manager |
| `catering` | cook, line-cook, dishwasher, server, shift-manager |
| `hotel` | server, host, cashier, bartender, delivery, shift-manager |

---

## File Structure

```
app/
  layout.tsx                        # Root: html dir=rtl, fonts
  globals.css                       # Full design system (Chalk & Cedar)
  (app)/
    layout.tsx                      # Shell: Header + BottomNav + Toasts + auth guard
    page.tsx                        # 🏠 Home — QR applicants ranked for active job
    hiring/
      layout.tsx                    # Sub-nav: משרות | QR
      page.tsx                      # Funnel summary hub
      jobs/page.tsx                 # Job list
      jobs/[id]/page.tsx            # Job detail + candidate filters + ranked list
      jobs/[id]/responders/page.tsx # Responders to a job
      qr/page.tsx                   # QR code display + stats + sticker card download
    workforce/
      layout.tsx                    # Sub-nav: עובדים | לו"ז
      pool/page.tsx                 # 👥 Active employees (store.employees) — named "עובדים"
      schedule/page.tsx             # Shift schedule
    candidate/[id]/page.tsx         # Profile — works for both pool candidates AND employees
    activity/
      page.tsx                      # Automation feed ("מה קורה")
      analytics/page.tsx            # Workforce analytics dashboard
  login/page.tsx                    # Outside shell — public
  apply/[jobId]/page.tsx            # Outside shell — public (worker applies)
  join/[businessId]/page.tsx        # Outside shell — public (QR landing form) ← WIRED TO SUPABASE

  api/
    whatsapp/
      route.ts                      # GET=webhook verify, POST=incoming messages
      trigger/route.ts              # POST: start DNA feeder conversation
      results/[candidateId]/route.ts # GET: fetch completed interview result

lib/
  store.ts                          # Zustand store — pool, employees, jobs, invites
                                    #   isLoggedIn: true (auto-login for demo)
                                    #   store key: huntch-store-v2
  seed.ts                           # Demo data: DEMO_BUSINESS, DEMO_JOB, SEED_CANDIDATES, SEED_EMPLOYEES
  types.ts                          # All TypeScript types (Candidate, Job, Invite, etc.)
  venue.ts                          # Venue → role mapping (SINGLE SOURCE OF TRUTH)
  matching.ts                       # DNA ranking algorithm (Haversine distance, 6-factor scoring)
  dna.ts                            # computeDna() + computeDnaColdStart()
  supabase.ts                       # Supabase client + all query helpers ← NEW
  database.types.ts                 # TypeScript types for Supabase tables ← NEW
  whatsapp-client.ts                # Meta Cloud API wrapper (server-only) ← NEW
  whatsapp-session.ts               # WaSession type + in-memory Maps ← NEW
  whatsapp-flow.ts                  # 14-step WhatsApp state machine (server-only) ← NEW

components/
  Header.tsx                        # Top nav — desktop tabs + mobile drawer
  BottomNav.tsx                     # Mobile bottom bar (4 tabs)
  CandidateCard.tsx                 # Two-row card layout (top: avatar+info+score, bottom: actions)
  PostJobModal.tsx                  # Post new job — uses venueRoles()
  GapTriggerModal.tsx               # Quick gap report — uses venueRoles()
  Toasts.tsx                        # Toast notifications
  WorkersTable.tsx                  # Desktop table for employees
  ui/minimal-button.tsx             # Sage pill button with diagonal hatch overlay

public/
  flow.html                         # Visual flow diagram (auto-deploys with every push)

# Root files
supabase-schema.sql                 # Full DB schema — paste into Supabase SQL Editor ← NEW
.env.local.example                  # Env var template with Supabase creds pre-filled ← UPDATED
DNA-FEEDER-SPEC.md                  # WhatsApp interview spec with research citations ← NEW
SUPABASE-SETUP.md                   # Step-by-step Supabase setup guide ← NEW
QR-STATUS.md                        # QR code implementation status + testing guide ← NEW
test-qr.mjs                         # Quick test: node test-qr.mjs ← NEW
```

---

## Key Component Decisions

### CandidateCard — Two-Row Layout
Root cause of past horizontal scroll bug: single row pushed ~310px of content into a 375px mobile screen.
Fixed as two rows:
- **Top:** avatar + name/facts + score
- **Bottom:** badge + invite button + save/dismiss icons

### candidate/[id]/page.tsx — Dual-mode Profile
Looks up candidate in BOTH `store.pool` and `store.employees`.
```typescript
const cand = store.pool.find(c => c.id === id) ?? store.employees.find(c => c.id === id)
const isEmployee = store.employees.some(c => c.id === id)
```
- `isEmployee = true` → shows "פרופיל עובד", 🟢 badge, shifts card, "הסר מהצוות" button
- `isEmployee = false` → shows "פרופיל מועמד", match %, "הזמן לראיון" button

### Home page (`app/(app)/page.tsx`)
- Reads `store.pool` for candidates (NOT employees)
- Role filter chips derived from active jobs only
- `featuredJob` = job matching selected role chip, or first active job
- `newCount` = pool candidates not yet invited

### Workforce page (`app/(app)/workforce/pool/page.tsx`)
- Reads `store.employees` (NOT pool)
- Title: "צוות פעיל"
- Role filter chips from `venueRoles(store.business.type)`

---

## Demo Data (seed.ts)

**Business:** בית קפה לינה — `id: 'biz-1'` — `type: 'cafe'` — Tel Aviv area
**Demo QR URL:** `http://localhost:3000/join/biz-1` (local) or `https://formdna.vercel.app/join/biz-1` (prod)

**Active job:** 1 barista position (`job-1`)

**SEED_CANDIDATES (store.pool):** ~10 barista applicants who scanned QR
**SEED_EMPLOYEES (store.employees):** 5 active café staff
- מיה לוי, דניאל כהן, סופיה מולר, אורי שפירו, לירון ביטון

Valid `Language` values: `'he' | 'ar' | 'en' | 'ru'` — never `'fr'`

---

## Navigation (4 Hubs)

| Tab | Hebrew | Route | What's there |
|---|---|---|---|
| Home | בית | `/` | Ranked QR applicants + daily AI summary |
| Hiring | גיוס | `/hiring` | Jobs, candidates, QR code |
| Workforce | כוח אדם | `/workforce` | Active employees, schedule |
| Activity | פעילות | `/activity` | Automation feed, analytics |

Global: **"דווח על עזיבה" FAB** — floating action button on all authed screens.

---

## CSS Architecture

`app/globals.css` is the design system. Tailwind utilities layer on top (`preflight: false`).

Key classes:
- `.cand` — candidate card (flex-direction: column)
- `.cand-top` / `.cand-actions` — two-row card layout
- `.fc` / `.fc-av` / `.fc-info` / `.fc-fit` — focus candidate card (home page)
- `.feed-seg` — section separator with label + link
- `.filter-chips` / `.chip` / `.chip.on` — pill filter chips
- `.job-head` / `.job-back` / `.job-title-big` / `.job-head-sub` — job detail header
- `.cand-count-card` — dark info card showing filtered candidate count
- `.dna-section` / `.dna-bar` / `.dna-sub-row` — DNA engine display
- `.prof-hero` / `.prof-body` / `.prow` / `.prof-cta` — candidate/employee profile
- `.inv-row` / `.inv-badge2` — invite status rows
- `.qr-page` / `.qr-url` / `.qr-note` / `.qr-stats` / `.qr-stat` / `.qr-actions` — QR page
- `.apply-shell` / `.apply-card` / `.apply-success` — join form

Mobile-first. `html, body { max-width: 100%; overflow-x: hidden; }` — no horizontal scroll ever.

---

## Git Rules

- **Always push directly to master** — never leave changes on feature branches only
- Worktree: `cool-pike-dfcbd7`
- If push rejected (non-fast-forward): `git fetch origin && git rebase origin/master && git push origin HEAD:master`

---

## Research Basis for DNA Feeder

| Signal | Finding | Source | Confidence |
|---|---|---|---|
| Needs-supplies fit | β=−.58 for turnover intent | PMC12480616 | High |
| Schedule instability | +50% turnover | Choper/Schneider/Harknett ILR Review 2022 | High |
| Structured interview Q's | ~.42 performance validity | Sackett et al. 2022 (meta-analysis) | High |
| Experience ceilings at ~5yr | Diminishing returns | Schmidt & Oh 2016 | High |
| Reply speed as signal | Does NOT prove quality | Hart et al. 2024 | High |

**Critical caveat:** Huntch must validate these coefficients against real retention outcomes once data accumulates.

---

## What NOT to do

- ❌ Never show "pool" or "מאגר" as a UI label for the workforce tab
- ❌ Never hardcode role lists — always use `venueRoles(business.type)`
- ❌ Never use `JSX.Element` — use `React.JSX.Element` (React 19)
- ❌ Never add `'fr'` as a Language — valid values are `he | ar | en | ru`
- ❌ Never put all candidate card content in a single horizontal row on mobile
- ❌ Never use purple/blue gradients — Chalk & Cedar palette only
- ❌ Never use emoji as navigation/UI icons — SVG only
- ❌ Never mix employees into pool or vice versa
- ❌ Never display reply latency as a quality score (passive signals affect confidence band only)
- ❌ Never collapse zero-history DNA to 0 — use Empirical-Bayes shrinkage toward population mean
- ❌ Never use `roundRect()` Canvas API — use manual path construction for browser compatibility
- ❌ Never hardcode `huntch.co.il` or `dna-form.vercel.app` — the live URL is `formdna.vercel.app`
- ❌ Never store WhatsApp credentials in `.env.local` if committing to git — server-only in Vercel
