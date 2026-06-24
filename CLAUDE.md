@AGENTS.md

---

# HUNTCH — Project Intelligence

> Every Claude session starts here. This file is the single source of truth for what Huntch is, how it works, and every architectural decision made so far.

---

## What is Huntch

Israeli F&B staffing platform. Connects café/restaurant/bar owners with workers who scan a QR code at the venue. No job boards. No CVs. QR → AI interview → ranked pool → WhatsApp invite → real interview → hired.

**Stage:** Demo / MVP. No real backend — Zustand + localStorage only.
**Language:** Hebrew (RTL, `dir="rtl"`, `lang="he"`).
**Operator:** Single business owner per account (e.g. "בית קפה לינה").

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.9 App Router** — read `node_modules/next/dist/docs/` before any routing work |
| React | **React 19** — use `React.JSX.Element`, not `JSX.Element` |
| State | **Zustand + localStorage** — store key `huntch-store-v1`, `skipHydration: true` |
| Styling | **Tailwind v3** (`corePlugins: { preflight: false }`) + plain CSS design system in `app/globals.css` |
| Components | **shadcn/ui** in `components/ui/` |
| Animation | **framer-motion** `AnimatePresence` |
| Fonts | Heebo (Hebrew body) + Frank Ruhl Libre (Hebrew serif headings) + JetBrains Mono (numbers) |

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

## The 5-Phase Worker Journey

This is the core product flow. Every feature maps to one of these phases.

### Phase 1 — Discovery & Onboarding
```
Worker scans QR at venue
  → 30-second AI interview (experience, availability, wage, transport)
  → Profile created, added to store.pool
  → No app download required
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

### The Signal Source: WhatsApp API

DNA is NOT a static score. It is computed from `PlatformSignals` — a live feed of behavioral events that come **primarily from WhatsApp API interactions**.

Every time Huntch sends a message to a worker via WhatsApp API and the worker responds (or doesn't), that event is logged and feeds the DNA engine.

```
WhatsApp API event → PlatformSignals update → computeDna() → updated score
```

### PlatformSignals (lib/types.ts)

```typescript
interface PlatformSignals {
  applicationCount:    number   // how many times invited/contacted total
  priorHires:          number   // how many times actually hired
  responseSpeedHours:  number   // avg hours to respond to a WhatsApp message
  lastActiveDaysAgo:   number   // days since last WhatsApp interaction
}
```

### What feeds each signal

| Signal | WhatsApp API event that updates it |
|---|---|
| `applicationCount` | Every invite message sent to worker |
| `priorHires` | Worker accepted + showed up → confirmed by manager |
| `responseSpeedHours` | Time between message sent and worker reply |
| `lastActiveDaysAgo` | Days since last any reply from worker |

### computeDna() formula (lib/dna.ts)

```typescript
reliability    = (priorHires / applicationCount) × 150  // capped at 100
responseSpeed  = 100 - (responseSpeedHours × 9)         // fast reply = high score
recency        = 100 - (lastActiveDaysAgo × 7)          // active recently = high score

DNA score      = reliability×0.40 + responseSpeed×0.30 + recency×0.30

churnRisk = 'high'   if lastActiveDaysAgo > 11 OR responseSpeedHours > 9
churnRisk = 'medium' if lastActiveDaysAgo > 5  OR responseSpeedHours > 4
churnRisk = 'low'    otherwise
```

### Demo vs Production

**Demo (current):** `PlatformSignals` is seeded statically in `lib/seed.ts` — hardcoded numbers per candidate. `computeDna()` reads them as if they were real.

**Production (Phase 2):** WhatsApp Business API webhook receives delivery/read/reply events → a backend "DNA Feeder" service parses each event → writes to `PlatformSignals` in the database → next time `computeDna()` runs, it picks up the real behavioral data.

The DNA feeder is therefore the **bridge between WhatsApp API events and the DNA scoring engine**. The formula in `lib/dna.ts` stays the same — only the data source changes from seed to live.

### Voice Logging also feeds DNA
When the manager uses voice input ("דניאל איחר ב-15 דקות"), the extracted event:
- Decrements reliability for Daniel
- Updates `lastActiveDaysAgo` context
- May trigger a churnRisk re-evaluation

So DNA has two live input channels in production: **WhatsApp API** (automatic) and **voice logging** (manual override by manager).

---

## Data Model — THE MOST IMPORTANT THING

Three separate concepts. Do NOT confuse them.

### `store.pool` — QR Applicants
- People who scanned the QR code and filled in their details
- **Shown on: Home page ("בית")** as ranked candidates
- NOT active employees

### `store.employees` — Active Staff
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

## Venue → Role Mapping (`lib/venue.ts`)

Every place roles are listed must import from here. Never hardcode role lists.

```typescript
import { venueRoles, ROLE_HE, ROLE_ICON } from '@/lib/venue'

// Get roles for current business:
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

**Home page role filter chips** = `store.jobs.filter(j => j.status === 'active').map(j => j.role)` — unique roles only. Demo has 1 barista job → 1 chip.

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
      qr/page.tsx                   # QR code display + stats
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
  join/[businessId]/page.tsx        # Outside shell — public (QR landing form)

lib/
  store.ts                          # Zustand store — pool, employees, jobs, invites
  seed.ts                           # Demo data: DEMO_BUSINESS, DEMO_JOB, SEED_CANDIDATES, SEED_EMPLOYEES
  types.ts                          # All TypeScript types (Candidate, Job, Invite, etc.)
  venue.ts                          # Venue → role mapping (SINGLE SOURCE OF TRUTH)
  matching.ts                       # DNA ranking algorithm (Haversine distance, 6-factor scoring)
  dna.ts                            # computeDna() → reliability, responseSpeed, recency, churnRisk, tags

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

**Business:** בית קפה לינה — `type: 'cafe'` — Tel Aviv area

**Active job:** 1 barista position (`job-1`)

**SEED_CANDIDATES (store.pool):** ~10 barista applicants who scanned QR
- Used for home page ranking and job candidate lists

**SEED_EMPLOYEES (store.employees):** 5 active café staff
- מיה לוי, דניאל כהן, סופיה מולר, אורי שפירו, לירון ביטון
- Shown in workforce עובדים tab

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

Mobile-first. `html, body { max-width: 100%; overflow-x: hidden; }` — no horizontal scroll ever.

---

## Git Rules

- **Always push directly to master** — never leave changes on feature branches only
- Worktree: `festive-antonelli-8f139a`
- If push rejected (non-fast-forward): `git fetch origin && git rebase origin/master && git push origin HEAD:master`

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
