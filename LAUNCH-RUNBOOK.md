# Huntch — Go-Live Runbook (Full Automated MVP)

**Goal:** take Huntch from clickable mockup → real, automated WhatsApp recruiting product.
**Approach chosen:** Full automated API (Meta WhatsApp Business API + Supabase + auto webhooks).
**Already have:** Vercel account.

> The single most important thing in this document: **start the Meta WhatsApp Business
> verification today.** It is the only step with an unavoidable 2–4 week calendar clock.
> Everything else can be built and tested in parallel. There is a free **test number** you
> can send real messages from *immediately* (see Step 1A) so development is **not** blocked
> on verification.

---

## What the app needs to go live (the whole list)

| # | Thing | Why it's needed | Who creates it | Lead time | Cost |
|---|-------|-----------------|----------------|-----------|------|
| 1 | **Meta WhatsApp Cloud API** (app + test number) | Send/receive the actual WhatsApp messages — the core product | You (Nimrod) | Test number: **today**. Production: 2–4 wks | Free tier; then ~$0.0X/conversation |
| 2 | **Supabase project** | Real database + auth, replaces localStorage so workers/owners share data | You | 10 min | Free → $25/mo at scale |
| 3 | **Dedicated phone number (+972)** | The number the WhatsApp Business account is attached to. Must NOT already be on a personal WhatsApp | You | 1 day (SIM/eSIM/VoIP) | ~₪0–50 |
| 4 | **Domain** (e.g. `huntch.co.il`) | Trust + the URL Meta webhook & QR codes point at | You | 1 day | ~₪100/yr |
| 5 | **Privacy/consent sign-off** (Amendment 40) | Legal to message Israeli workers; consent copy already drafted in opt-in forms | You + attorney | 1 wk | ₪3k–6k one-time |
| 6 | **Stripe account** *(can defer)* | Billing — only needed once you charge. Pilot is free, so this is post-launch | You | 1 day | 2.9% + fee |
| 7 | **Backend code** (DB wiring, API routes, webhook, auth) | Glue that turns the mockup into a live app | Me (Claude) | This + next sessions | dev time |

You can launch the **free founding pilot** with items **1–5**. Item 6 (Stripe) is only needed
when the pilot converts to paid, so we defer it.

---

## Step 1 — Meta WhatsApp Cloud API  ⏰ DO THIS FIRST

We use **Meta's WhatsApp Cloud API directly** (hosted by Meta — no 360dialog/Twilio middleman,
lowest cost, fastest path). Two parallel tracks:

### 1A. Test number — unblocks development TODAY (≈30 min, free)
1. Go to <https://developers.facebook.com> → log in → **My Apps** → **Create App**.
2. App type: **Business**. Name it "Huntch".
3. In the app dashboard → **Add Product** → **WhatsApp** → **Set up**.
4. Meta gives you a **test phone number** + a **temporary access token** (valid 24h) on the
   "API Setup" page. Note the **Phone number ID** and **WhatsApp Business Account (WABA) ID**.
5. Add **your own mobile** as a verified recipient (you can add up to 5 test recipients).
6. Click "Send message" in the dashboard — your phone should get a WhatsApp. ✅ The pipe works.

**Bring back to me from this page:**
- `META_WHATSAPP_PHONE_ID` (the test number's Phone number ID)
- a temporary `META_WHATSAPP_TOKEN` (we'll swap for a permanent one later)
- `META_WHATSAPP_VERIFY_TOKEN` — **you invent this**, any random string, e.g. `huntch_wh_8f3k9` (used to verify the webhook)
- App **App Secret** (App → Settings → Basic) → `META_APP_SECRET` (to verify webhook signatures)

With these I can wire and test the entire send/receive loop against your real phone, **before**
business verification is approved.

### 1B. Production track — start the clock now (2–4 weeks)
This runs in the background while we build.
1. **Meta Business Verification:** App dashboard → **Business Settings** → **Security Center** →
   **Start Verification**. You'll need:
   - Israeli business registration (עוסק מורשה / ח.פ.) document
   - Proof of address / utility bill in the business name
   - A business phone & email
2. **Attach the real number** (Step 3 below) to the WhatsApp Business Account and verify it via
   the SMS/voice code Meta sends.
3. **Generate a permanent System User token:** Business Settings → **Users → System Users** →
   create a system user → assign the WhatsApp app → **Generate token** with
   `whatsapp_business_messaging` + `whatsapp_business_management` scopes. This replaces the 24h
   token. → that's your production `META_WHATSAPP_TOKEN`.
4. **Submit message templates for approval** (see Step 1C). Approval is 24–72h each.

### 1C. Message templates (pre-approved outbound — required)
WhatsApp does **not** let you send free-form outbound messages to someone who hasn't messaged you
in the last 24h. You must use **pre-approved templates**. Submit these two in
**WhatsApp Manager → Message Templates** (language: Hebrew, category: **UTILITY**):

**`shift_offer`** (category UTILITY)
```
שלום {{1}},
עסק בתחום {{2}} ב{{3}} מחפש {{4}} ל{{5}}.
מרחק ממך: {{6}} ק"מ.

מעוניין/ת? ענה/י כן או לא.
לביטול קבלת הצעות: שלחו STOP.
```

**`reminder_24h`** (category UTILITY)
```
{{1}}, תזכורת: יש הזדמנות עבודה שמחכה לתגובתך.
ענה/י כן או לא כדי שנשריין אותך.
```

> **Why templates matter for the flow:** the *first* message to a worker (the job offer) is
> always a template. Once the worker **replies** ("כן"/"לא"), a 24-hour "customer service window"
> opens during which we can send free-form messages. So: template out → worker replies → free
> text for the rest of that conversation.

---

## Step 2 — Supabase (10 min)
1. <https://supabase.com> → **New project**. Region: **Frankfurt (eu-central-1)** (closest to
   Israel, and keeps EU data residency clean).
2. Set a strong DB password (save it).
3. Project → **Settings → API**. Bring back:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ server-side only, never in client code)
4. Project → **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql)
   → **Run**. That creates all tables + security policies.

---

## Step 3 — Dedicated +972 number
- This number becomes the Huntch WhatsApp sender. **It cannot already be registered on a regular
  WhatsApp / WhatsApp Business app** — Meta needs to own it via the Cloud API.
- Options: a cheap second SIM, an eSIM, or a VoIP number that can receive SMS/voice (e.g. a local
  Israeli mobile prepaid). Avoid your personal number.
- During Step 1B you'll register this number with the WABA and confirm the code Meta sends to it.

---

## Step 4 — Domain
- Register `huntch.co.il` (Israeli ccTLD = trust) via an Israeli registrar.
- In Vercel: Project → **Settings → Domains** → add it → set the DNS records the registrar panel.
- This domain is also where Meta's webhook callback URL lives:
  `https://huntch.co.il/api/whatsapp/webhook`.

---

## Step 5 — Legal / consent (parallel, before enrolling real workers)
- The opt-in forms (`/join/[businessId]`, `/apply/[jobId]`) already contain Hebrew consent copy
  and a STOP-to-unsubscribe promise — this satisfies the *structure* of Amendment 40 consent.
- Have an Israeli privacy attorney review the exact wording + register as a data controller before
  you message workers who didn't opt in directly. Budget ₪3k–6k.
- We already build the STOP handler into the webhook (Step 1) and a deletion endpoint, so the
  technical compliance pieces are covered in code.

---

## The end-to-end live flow (what we're building toward)

```
Owner reports a gap in the app
        │
        ▼
POST /api/jobs/[id]/invite  ── ranks pool (lib/matching.ts, server-side)
        │                       picks top N within radius
        ▼
lib/whatsapp.ts → Meta Cloud API → sends `shift_offer` template
        │
        ▼
Worker's WhatsApp:  "...מעוניין/ת? כן/לא"
        │  worker replies "כן"
        ▼
Meta → POST /api/whatsapp/webhook   (our handler)
        │  - verifies signature
        │  - "כן" → invite.status = responded
        │  - "STOP" → candidate opted_out = true, removed from all outreach
        ▼
Supabase Realtime → owner's dashboard updates: "מישל אישרה — 0.8 ק\"מ"
```

---

## Build order (code — my side)

| Phase | What | Depends on |
|-------|------|------------|
| ✅ A | `.env.example`, `supabase/schema.sql`, `lib/whatsapp.ts`, webhook route | nothing (done this session) |
| B | `npm i @supabase/supabase-js`; Supabase client; wire opt-in forms (`/join`, `/apply`) to write to DB | Supabase keys (Step 2) |
| C | API routes: `/api/jobs`, `/api/jobs/[id]/invite`, `/api/jobs/[id]/responders`, `/api/candidates`, `/api/candidates/[id]` (deletion) | Phase B |
| D | Wire webhook → DB (yes/no/STOP updates invites & opt-outs) | test number (Step 1A) + Phase B |
| E | Phone-OTP auth (replace mock login) via Supabase Auth | Supabase |
| F | Move dashboard reads from Zustand → Supabase queries + Realtime | Phases B–C |
| G | (deferred) Stripe billing | Stripe account |

We can do **Phase B–D and test the real WhatsApp loop on the test number** the moment you bring
back the Supabase keys + the Meta test credentials — no need to wait for business verification.

---

## What I need from you to continue (copy-paste back to me)

```
# From Meta (Step 1A — test number page)
META_WHATSAPP_PHONE_ID=
META_WHATSAPP_TOKEN=            # temporary 24h is fine to start
META_WHATSAPP_VERIFY_TOKEN=    # you invent this string
META_APP_SECRET=

# From Supabase (Step 2)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> ⚠️ Don't paste these into a public place. Put them in `.env.local` (git-ignored) and/or paste
> here in chat — but rotate the Supabase service role key / Meta token afterward if this chat is
> ever shared.

---

## Rough monthly cost at pilot scale
- Vercel: free (Hobby) → ₪90/mo (Pro) when needed
- Supabase: free → $25/mo past 500MB
- WhatsApp Cloud API: utility conversations are cheap; first 1,000/mo often free, then fractions
  of a shekel each
- Domain: ~₪100/yr
- **Pilot total: roughly ₪0–50/mo** until you scale past free tiers.
