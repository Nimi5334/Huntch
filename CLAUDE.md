@AGENTS.md

---

# HUNTCH — Project Intelligence

> Every Claude session starts here. This file is the single source of truth for what Huntch is, how it works, and every architectural decision made so far.

---

## What is Huntch

Huntch is an **AI front-desk teammate for dental and aesthetic clinics in Israel**. It holds every patient's full profile (treatment history + payments), generates a customized "lead" to bring dormant patients back, runs approve-before-send outreach in the clinic's own voice, checks in on patients after procedures, escalates tricky cases to a human, and proves the revenue it recovered.

There is **no scoring/matching system** and **no job-board concept** — this is not the staffing platform Huntch used to be. The whole product was pivoted in one continuous build (2026-07-10) from an F&B staffing app into this clinic patient-reactivation platform. Some CSS class names (`.cand`, `.prof-*`, `.dna-*`) and file layout patterns are inherited from that prior version — they're reused for the shared design system, not because this is still a staffing app.

**Stage:** MVP — full demo product built and working end-to-end on the local/demo path (Zustand + localStorage, auto-login). Multi-tenant Supabase schema + RLS are written and ready to run; WhatsApp live-send and real billing need external setup (see "What's left" below).
**Language:** Hebrew (RTL, `dir="rtl"`, `lang="he"`).
**Operator:** Single clinic per account (e.g. `מרפאת שיניים ד"ר ירון כהן`).
**Deployed:** https://formdna.vercel.app
**GitHub:** https://github.com/Nimi5334/Huntch (branch: master)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.9 App Router** — read `node_modules/next/dist/docs/` before any routing work |
| React | **React 19** — use `React.JSX.Element`, not `JSX.Element` |
| State | **Zustand + localStorage** — store key `huntch-clinic-v1`, `skipHydration: true` |
| Database | **Supabase** (PostgreSQL + Auth + RLS) — project `ijbbhtljxqnjboyhrjqw.supabase.co` |
| Styling | **Tailwind v3** (`corePlugins: { preflight: false }`) + plain CSS design system in `app/globals.css` |
| Components | **shadcn/ui** in `components/ui/` |
| Animation | **framer-motion** `AnimatePresence` |
| Fonts | Heebo (Hebrew body) + Frank Ruhl Libre (Hebrew serif headings) + JetBrains Mono (numbers) |
| AI | **Claude API** via raw `fetch` in `lib/ai.ts` (no SDK dependency), canned fallback when no key |

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

No emoji as icons (use SVG, except where explicitly used inline for warmth in copy like the ROI teaser). No purple/blue AI gradients. Hebrew RTL at all times.

---

## Demo Credentials

```
Clinic: מרפאת שיניים ד"ר ירון כהן
Clinic ID: clinic-1
Phone: 0500000000
Password: 533433
```

`isLoggedIn: true` by default in `lib/store.ts` — login screen is bypassed for demo. Sign out via the header profile panel to see the real login/signup flow.

---

## The Product — 3 pillars

### 1. Patient database + personalized leads (works in Basic and Advanced)
- **Home (`/`)** lists every patient with a system-generated **lead** (`lib/leads.ts` → `generateLead()`): incomplete treatment plan → recall-interval elapsed → long-overdue routine visit → "up to date". Each lead has a ready Hebrew WhatsApp draft message.
- **Patient profile (`/patients/[id]`)** shows the lead card (copy or approve-and-send), full treatment history, payments/billing summary, consent state, and any **insights** distilled from past replies (builds understanding of the patient over time).
- Add patients manually via `components/AddPatientModal.tsx`.

### 2. Daily briefing + automation cockpit (Advanced only)
- **`/today`** ("מה חדש היום") — today's treatments, replies from patients, pending human-intervention escalations, leads to action, **periodic quality-checks due**, and review-request nudges. Every row is one-tap approve-and-send.
- **`/inbox`** — escalation queue (complaint / medical concern / reschedule / complex question), mark "טופל" to resolve.
- **`/activity`** — ROI dashboard: recovered revenue vs. dormant potential, outreach funnel, full outreach timeline.

### 3. AI brain — "מענה אוטומטי" (Advanced only, `/auto-reply`)
- Business-knowledge form (hours, doctors, services, pricing, insurance, policies) + FAQ manager — grounds every AI answer (`lib/ai.ts` → `answerPatient()`).
- **Simulation trainer** — the clinic role-plays a patient message, the AI (via `/api/ai/simulate`) drafts a reply, the clinic edits it, and the edited version is saved as a `VoiceExample` (few-shot style example) that gets fed back into future prompts. This is how the AI learns the clinic's voice.
- Guardrail: the AI **never gives medical advice**. Keyword-detected medical/complaint/reschedule messages are force-escalated to `/inbox` instead of auto-answered.
- Default autonomy model: **approve-before-send** everywhere — nothing goes out to a real patient without a clinic tap.

---

## Periodic Quality-Checks (`lib/checkins.ts`)

Automatic, personalized, treatment-specific check-ins — **not** part of the reactivation lead flow. Purpose is fourfold: bring patients back, capture reviews, give personal attention, and build understanding (replies become `Patient.insights`).

Example: *"היי מיה, זה ירון מהמרפאה — הסד לילה נוח לך?"* — sent ~21 days after a night-guard fitting, then periodically. Other windows: implant healing (7/30 days), whitening satisfaction (7 days), orthodontics progress (30/120 days), botox/filler/laser/peeling follow-ups, and a generic "how are you" wellbeing check for patients dormant 8+ months with no treatment-specific window due.

`checkinsDue(patient, clinic)` returns drafts; the clinic approves-and-sends from `/today`.

---

## Data Model — `lib/types.ts`

```typescript
Clinic { id, name, type: 'dental'|'aesthetic', address, operatorName, phone, plan: 'basic'|'advanced', trialEndsAt, knowledge: BusinessKnowledge }
Patient { id, clinicId, name, phone, treatments: TreatmentRecord[], payments: Payment[], medicalNotes, consent, optedOut, insights: string[] }
TreatmentRecord { id, date, category, name, status: 'completed'|'planned'|'in-progress', cost, notes }
Payment { id, date, amount, method, treatmentId }
Lead { headline, reason, suggestedCategory, draftMessage }   // derived, not stored
Outreach { id, clinicId, patientId, kind: 'reactivation'|'quality_check'|'wellbeing'|'review', status: 'draft'|'approved'|'sent'|'replied'|'declined'|'no_reply', message, insight }
Escalation { id, clinicId, patientId, reason: 'complex_question'|'complaint'|'medical_concern'|'reschedule'|'other', status: 'pending'|'handled', snippet }
BusinessKnowledge { hours, doctors, services, pricingNotes, insurance, policies, faqs: FaqEntry[], voiceExamples: VoiceExample[] }
```

Billing summaries (`lib/billing.ts`) and ROI figures (`lib/roi.ts`) are **derived via helpers, never stored**.

---

## Foundation Libs

| File | Purpose |
|---|---|
| `lib/clinical.ts` | Treatment categories, Hebrew labels, recall-interval months per category (replaces old `venue.ts`) |
| `lib/leads.ts` | `generateLead(patient, clinicType)` — pure, deterministic, LLM-swappable later |
| `lib/checkins.ts` | `checkinsDue(patient, clinic)` — periodic personalized quality-check drafts |
| `lib/billing.ts` | `billingSummary(patient)` — billed / paid / outstanding |
| `lib/roi.ts` | `computeRoi(patients, outreach, clinicType)` — recovered vs. potential revenue |
| `lib/plan.ts` | `canUse(clinic, feature)` — single source of truth for Basic/Advanced gating |
| `lib/ai.ts` | Server-only. `answerPatient()` / `simulateReply()` via Claude API (`ANTHROPIC_API_KEY`), canned fallback otherwise. Escalation guardrail for medical/complaint content. |
| `lib/outreach-flow.ts` | Server-only production bridge: `deliverOutreach()` (WA send), `processIncomingReply()` (webhook → AI answer → escalate/insight). No-ops gracefully without WhatsApp/Supabase creds — demo path never touches this file. |
| `lib/supabase.ts` | `supabase` (anon, RLS-scoped) + `supabaseAdmin` (service-role, cross-tenant, server-only) clients + helpers |

---

## Membership & Pricing (`lib/plan.ts`)

| Tier | Price (placeholder) | Includes |
|---|---|---|
| **בסיסי (Basic)** | ₪149/mo | Patient database + medical profiles, personalized leads, copy/manual-send, manual add, patient cap 500 |
| **מתקדם (Advanced)** | ₪499/mo | Everything in Basic **+** daily briefing, approve-before-send auto-outreach, AI brain (FAQ + simulation trainer + escalation), periodic quality-checks, ROI dashboard, unlimited patients, priority support |

- 14-day Advanced trial granted on signup (`clinic.trialEndsAt`).
- `effectivePlan(clinic)` returns `'advanced'` while trial is active even if `clinic.plan === 'basic'`.
- Gated pages render `<UpgradeLock />` (`components/UpgradeLock.tsx`) instead of a dead end.
- Billing page: `app/(app)/settings/billing/page.tsx` — plan comparison + switch (real Stripe Checkout wiring is a flagged future step; switching plans in-app is instant/free in the demo).

---

## Navigation (4 hubs + inbox/settings)

| Tab | Hebrew | Route | Plan |
|---|---|---|---|
| Home | בית | `/` | Basic |
| Today | מה חדש | `/today` | Advanced (gated) |
| AI brain | מענה אוטומטי | `/auto-reply` | Advanced (gated) |
| Activity | פעילות | `/activity` | Advanced (gated) |
| Inbox | (header icon) | `/inbox` | Advanced (gated) |
| Settings/Billing | — | `/settings`, `/settings/billing` | all |

---

## Supabase — Multi-Tenant Security

- **Schema:** `supabase-schema.sql` — `clinics`, `memberships` (maps `auth.uid()` → `clinic_id`), `patients`, `treatments`, `payments`, `outreach`, `escalations`. **RLS is enabled on every clinic-owned table** with policies scoped through `memberships` — one clinic can never read another's data.
- **Client-side (`supabase` export):** anon key, respects RLS. **Server-only (`supabaseAdmin` export):** service-role key, bypasses RLS — used only by the WhatsApp webhook and AI routes to do cross-tenant lookups keyed by `wa_phone_number_id` (each clinic's own registered WhatsApp number identifies which tenant a message belongs to).
- **Demo/local path does not touch Supabase at all** — the whole product runs on Zustand + localStorage with seeded data. Supabase is exclusively the *production* multi-tenant path (real signup/login, real cross-clinic isolation). Wiring the demo's `AddPatientModal`/store actions to also write to Supabase was intentionally deferred — see "What's left" below.
- **Setup:** paste `supabase-schema.sql` into the Supabase SQL Editor, enable Email auth, set env vars (below).

---

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL=https://formdna.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ijbbhtljxqnjboyhrjqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=            # server-only, never expose to client
ANTHROPIC_API_KEY=                    # for live AI brain — canned fallback works without it
WHATSAPP_ACCESS_TOKEN=                # Meta Developer Console
WHATSAPP_PHONE_NUMBER_ID=             # Meta Developer Console
WHATSAPP_VERIFY_TOKEN=huntch_webhook_secret
STRIPE_SECRET_KEY=                    # future real billing
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Set the same keys in Vercel → formdna project → Settings → Environment Variables, then redeploy.

---

## WhatsApp Integration

| File | Purpose |
|---|---|
| `lib/whatsapp-client.ts` | Meta Cloud API wrapper (`sendText`, `sendButtons`, `sendList`, `normalizePhone`) — domain-agnostic, unchanged from before the pivot |
| `lib/outreach-flow.ts` | `deliverOutreach(phone, message)` (best-effort live send) + `processIncomingReply(waPhoneNumberId, fromPhone, text)` (webhook handler: identifies clinic by WA number → AI answer → escalate or insight) |
| `app/api/whatsapp/route.ts` | GET = hub verification, POST = incoming webhook |
| `app/api/whatsapp/trigger/route.ts` | POST `{ phone, message }` — delivers an already-approved outreach message |
| `app/api/ai/simulate/route.ts` | POST `{ patientMsg, knowledge, clinicName }` — used by the simulation trainer |

The demo/local path never calls these routes — Home/Today pages simulate delivery entirely client-side via `store.sendOutreach()`. These routes activate once WhatsApp Business + Supabase are configured.

---

## What's Left (external setup, not blocked on code)

1. **Anthropic API key** → live AI brain (canned fallback works without it).
2. **Run `supabase-schema.sql` + enable Email Auth** → live multi-tenant security.
3. **WhatsApp Business (Meta) setup** — access token, phone number ID, webhook registration, template approval → live patient messaging.
4. **Payment provider** (Stripe recommended for speed; Cardcom/Tranzila for Israeli-local billing) → real charging (in-app plan switching already works without it).
5. **Paste all resulting keys into Vercel** env vars, redeploy.
6. **Wire demo-path CRUD to Supabase** (optional next step) — today `AddPatientModal`/store actions are Zustand-only; mirroring writes to Supabase when configured would let a real signed-up clinic use the app beyond the seeded demo data.

---

## Git Rules

- **Always push directly to master** — never leave changes on feature branches only.
- Worktree: `cool-pike-dfcbd7`.
- If push rejected (non-fast-forward): `git fetch origin && git rebase origin/master && git push origin HEAD:master`.

---

## What NOT to do

- ❌ Never reintroduce a "recovery score" or candidate-matching score — this product surfaces leads and quality-checks, not rankings.
- ❌ Never use `JSX.Element` — use `React.JSX.Element` (React 19).
- ❌ Never let the AI brain give medical advice — force escalation on medical/complaint/reschedule content.
- ❌ Never auto-send outreach without an explicit approve step (approve-before-send is the default autonomy model).
- ❌ Never use purple/blue gradients — Chalk & Cedar palette only.
- ❌ Never use emoji as navigation/UI icons — SVG only (inline emoji in copy, e.g. the ROI teaser 💡, is fine).
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`, or `ANTHROPIC_API_KEY` to client components — server-only.
- ❌ Never remove RLS policies or add a table without `clinic_id` scoping.
- ❌ Never hardcode `huntch.co.il` or any domain other than `formdna.vercel.app`.
- ❌ Never use `roundRect()` Canvas API — use manual path construction for browser compatibility.
