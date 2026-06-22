# Huntch — Production Plan
**Last updated:** 2026-06-18  
**Status:** Clickable mockup complete → production build

---

## Where we are

The clickable Next.js mockup is complete and running at `localhost:3001`. It proves the UX loop end-to-end: login → post job → ranked match list → invite → responders → pool → apply form → replacement trigger. All scoring, distance, and badge logic is real and computable. State persists across navigation via Zustand. Design is pixel-matched to the brand template.

**What the mockup is NOT:** no real auth, no database, no WhatsApp API, no payments, no legal compliance layer.

---

## Production architecture overview

```
Workers (mobile PWA / WhatsApp)
        ↕
  WhatsApp Business API (Meta direct BSP)
        ↕
  Huntch API (Next.js API routes / Edge Functions)
        ↕
  Supabase (Postgres + Auth + Realtime + Storage)
        ↕
  Huntch Web App (Next.js App Router)
        ↕
  Business owners (web + PWA)
```

---

## Phase 0 — Legal & compliance (BEFORE enrolling any worker)
**Timeline: Week 1 before anything else**

| Task | Owner | Notes |
|---|---|---|
| Retain Israeli privacy attorney | Founder | ₪3,000-6,000 one-time |
| Register as data controller | Attorney | Israeli Privacy Protection Law 5741-1981 |
| Draft worker consent language (Hebrew) | Attorney | Explicit, specific, revocable |
| Draft employer data processing agreement | Attorney | B2B consent for candidate data |
| Implement STOP/unsubscribe flow | Dev | Required on every WhatsApp channel message |
| Set up data deletion workflow | Dev | Workers can request full removal |

---

## Phase 1 — Backend foundation
**Timeline: Weeks 2-4**

### 1.1 Database (Supabase)
Replace Zustand seed data with real Postgres.

**Tables:**
```sql
businesses (id, owner_phone, name, type, address, lat, lng, created_at)
jobs (id, business_id, role, location, shifts[], requirements, status, created_at)
candidates (id, phone_hash, name, neighborhood, lat, lng, roles[], availability, skills[], languages[], wage_min, consent_at, consent_source, last_active)
invites (id, job_id, candidate_id, status, sent_at, responded_at)
applications (id, job_id, candidate_id, source, created_at)
```

**Row-Level Security:**
- Businesses only see their own jobs + invites
- Candidates never exposed directly to businesses (Huntch is the intermediary)
- Admin role for operations oversight

### 1.2 Authentication (Supabase Auth + phone OTP)
Replace the simulated OTP with real SMS auth.

- Supabase Auth with phone provider (uses Twilio under the hood OR direct SMS gateway)
- For Israel: use **MessageBird** or **Vonage** for Hebrew SMS delivery (better Israeli carrier routing than Twilio)
- OTP flow: send 6-digit code → verify → JWT issued → stored in httpOnly cookie
- Session refresh: Supabase handles automatically

**Cost:** ~₪0.08/SMS OTP. Estimate 500 verifications/month early stage = ₪40/mo.

### 1.3 API routes
Convert all Zustand actions to server-side API routes:

```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/businesses              — create business profile
POST /api/jobs                    — post a job
GET  /api/jobs/[id]/matches       — ranked candidates (server-side scoring)
POST /api/jobs/[id]/invite        — trigger WhatsApp outreach
GET  /api/jobs/[id]/responders    — who said yes
POST /api/pool/import             — CSV import → candidates
POST /api/apply/[jobId]           — public apply form → candidate + consent
DELETE /api/candidates/[id]       — GDPR/privacy deletion
```

### 1.4 Move matching engine to server
The `scoreCandidate` and `rankPool` functions in `lib/matching.ts` are already pure TypeScript — move them to API route handlers. No rewrite needed, just import and call server-side.

---

## Phase 2 — WhatsApp Business API (Meta direct BSP)
**Timeline: Weeks 4-8**

### 2.1 Meta Business Setup
- Create Meta Business Manager account for Huntch
- Apply for WhatsApp Business API access (direct, not 360dialog)
- Get a dedicated WhatsApp Business number (Israeli +972 number preferred for trust)
- Submit business verification documents
- **Timeline to approval:** 2-4 weeks after document submission

### 2.2 Message Templates
WhatsApp requires pre-approved templates for outbound messages (HSM templates). Submit these:

**Template: shift_offer (category: UTILITY)**
```
שלום {{1}}, 
עסק בתחום {{2}} ב{{3}} מחפש {{4}} ל{{5}}.
מרחק ממך: {{6}} ק"מ.

מעוניין/ת? ענה/י כן/לא
לביטול קבלת הצעות: שלח STOP
```

**Template: reminder_24h (category: UTILITY)**
```
{{1}}, תזכורת: יש הזדמנות עבודה שמחכה לתגובתך.
ענה/י כן/לא כדי שנוכל לשריין אותך.
```

**Timeline to template approval:** 24-72 hours per template.

### 2.3 Webhook Handler
```
POST /api/whatsapp/webhook        — receives replies from workers
GET  /api/whatsapp/webhook        — verify token for Meta
```

Worker replies (`כן` / `לא` / `STOP`) update invite status in Supabase and trigger real-time update for the business owner.

### 2.4 Rate limiting & compliance
- Max 1 message per worker per 24 hours
- Max 3 active invites per worker at once
- STOP → immediately remove from all future outreach, flag in DB
- Daily send limits enforced in API middleware

### 2.5 Fallback channel (SMS)
At opt-in, collect SMS consent in parallel (one extra tap). If WhatsApp delivery fails (number inactive, business WhatsApp on different number), SMS fires automatically.

---

## Phase 3 — Worker onboarding
**Timeline: Weeks 6-10 (parallel with Phase 2)**

### 3.1 Public opt-in page
`/join` — Hebrew, mobile-first, 30-second form.
Fields: שם, סוג עבודה (role picker), שכונה, מה אתה מחפש (shifts), שפות, explicit consent checkbox.
On submit: create candidate → send WhatsApp confirmation → they're in the pool.

### 3.2 QR sticker campaign
Each QR encodes `/join?src=sticker&loc=florentin` — tracks acquisition source per neighborhood.
Print 500 stickers (₪200 at local print shop). Place in:
- Break rooms of target businesses (with owner permission)
- Community bulletin boards
- Local Telegram/WhatsApp groups (with admin permission)

### 3.3 WhatsApp link in bio
Workers share `wa.me/972XXXXXXXXX?text=הצטרפות` with friends. Triggers opt-in flow via WhatsApp itself.

### 3.4 Referral mechanic
Worker refers a friend → both get priority match status for 30 days. Tracked via `ref` param on `/join`.

---

## Phase 4 — Business onboarding
**Timeline: Weeks 8-12**

### 4.1 Trial offer
First 3 matches: free (no credit card). Business owner sees value before paying anything.

### 4.2 Self-serve onboarding
`/onboard` → guided flow: verify business (business registration number) → set up profile → post first job → guided to match list.

### 4.3 Billing (Stripe)
```
Tier 1: Pay-per-match   ₪150/match (post-trial)
Tier 2: Monthly         ₪299/mo (unlimited matches for 1 role)
Tier 3: Pro             ₪499/mo (unlimited roles + multi-location)
Tier 4: Founding        ₪199/mo locked forever (first 50 businesses)
```

Stripe Checkout → webhook updates `businesses.tier` in Supabase.

---

## Phase 5 — Infrastructure & deployment
**Timeline: Weeks 10-14**

### 5.1 Hosting
- **Vercel** for Next.js (free tier handles early traffic; Pro at ₪90/mo when needed)
- **Supabase** free tier → Pro at $25/mo when >500MB DB
- **Domain:** huntch.co.il (Israeli ccTLD builds trust) — ~₪100/year

### 5.2 Observability
- **Sentry** — error tracking (free tier)
- **PostHog** — analytics + session replay (free tier up to 1M events)
- **Uptime** — Better Uptime or UptimeRobot free tier

### 5.3 Environment variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side only
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_ID=
META_WHATSAPP_VERIFY_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 5.4 CI/CD
- GitHub Actions: lint + type-check on every PR
- Vercel auto-deploys main branch to production
- Preview deployments for every PR

---

## Phase 6 — Growth mechanics
**Timeline: Month 3+**

### 6.1 Neighborhood saturation dashboard (internal)
Map view showing candidate density per neighborhood vs. active jobs. Drives coordinator decision: where to focus next week's supply acquisition.

### 6.2 Real-time matching
Supabase Realtime → when a new candidate joins within 2km of an active job, notify the business immediately. ("חדשה ברשימה — מישל, בריסטה, 0.8 ק"מ ממך")

### 6.3 Analytics pipeline
`analytics-officer` equivalent → weekly PostHog report:
- Match acceptance rate per neighborhood
- Time-to-first-response per worker cohort
- Retention rate (workers active >30 days)
- Revenue per business per month

---

## Phased cost estimate

| Phase | One-time | Monthly |
|---|---|---|
| Phase 0 — Legal | ₪5,000 | — |
| Phase 1 — Backend | 60h dev time | ₪0 (Supabase free) |
| Phase 2 — WhatsApp | 40h dev time | ₪200 (Meta per-message) |
| Phase 3 — Worker onboarding | ₪200 (stickers) | ₪80 (SMS fallback) |
| Phase 4 — Billing (Stripe) | 20h dev time | 2.9% + ₪1.20/transaction |
| Phase 5 — Hosting | — | ₪90 (Vercel) + ₪100 (Supabase Pro) |
| **Total pre-revenue** | **₪5,200 + ~120h dev** | **~₪470/mo** |

Break-even: 4 paying businesses at ₪299/mo tier = ₪1,196/mo covers all operating costs.

---

## The one thing to do first (before any code)

**Retain the privacy attorney.** Everything else — the database schema, the opt-in copy, the worker consent flow, the STOP mechanism — depends on having legally-sound consent language reviewed by someone who knows Israeli privacy law. Building before this risks having to tear out the consent layer entirely when the attorney comes back with required changes.

Book the attorney this week. Everything in Phase 1-6 starts the week after.

---

## Execution order (summary)

```
Week 1    Legal attorney → consent language
Week 2    Supabase setup → schema → auth
Week 3    API routes (replace Zustand)
Week 4    WhatsApp Meta application (starts parallel approval clock)
Week 5    Worker opt-in page + QR sticker campaign
Week 6    Business onboarding flow
Week 7    WhatsApp webhook handler
Week 8    Stripe billing
Week 9    Deploy to Vercel (huntch.co.il)
Week 10   First 5 real businesses onboarded (Florentin/Shenkin pilot)
Week 12   First paid match
Month 3   Expand to second neighborhood
Month 6   50 businesses, 300 active workers, ₪14,000+ MRR
```
