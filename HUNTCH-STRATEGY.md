# Huntch — Full Company Strategy
> Last updated: 2026-06-18
> Status: Pre-launch, mockup complete

---

## What Is Huntch?

Huntch is a **local active recruiting platform** for small food & hospitality businesses in Israel (cafés, restaurants, bars, hotels, catering). It is not a passive job board. It actively headhunts, screens, and delivers a shortlist of qualified local workers to the business owner — and reaches out to candidates on their behalf.

**The one-line pitch:**
> *The first time a worker leaves, you panic. With Huntch, you fill the gap before you even feel it.*

**The core pain it solves:**
Small food businesses can't find qualified local replacements when staff leave. Turnover is constant. The candidate pool (baristas, cooks, dishwashers, servers) is not on LinkedIn. Existing AI recruiting tools target the wrong audience. Huntch was built specifically for this ignored market.

---

## The Five Things Huntch Does

### 1. Active Headhunting
Huntch doesn't wait for workers to apply. It queries its local consented pool the moment a gap is opened, ranks candidates by fit, and delivers a shortlist — scored and explained — directly to the business owner. The operator reviews and invites with one tap.

### 2. Campaign Management
When the local pool is thin, Huntch runs outbound campaigns:
- **WhatsApp broadcast** — geo-fenced message to all consented workers within X km: *"בית קפה ברוטשילד מחפש בריסטה מחר 6:00 — 1.2 ק״מ ממך. מעוניין/ת?"*
- **Meta Lead Ads** — paid acquisition; tap → consent form → candidate enters pool
- **Google for Jobs** — structured-data feed; job pages indexed automatically (free inbound)
- **Community WhatsApp/Telegram groups** — semi-manual; Huntch admin posts to neighborhood work groups

### 3. Pool Management
Every candidate who ever applied, was imported, or responded is saved to the business's private pool with:
- Full profile (role, availability, distance, skills, languages, wage expectation)
- Consent source (apply form / CSV / lead ad / referral)
- Platform signals (response speed, prior hires, last active)

The pool compounds over time. The second job costs far less outreach than the first. The tenth costs almost nothing.

### 4. Matching Engine
Rule-based weighted scoring — deterministic, explainable, no black-box ML.

**Default weights:**
| Dimension | Weight |
|---|---|
| Availability fit | 30% |
| Distance from venue | 25% |
| Role + experience match | 20% |
| Skills / certifications | 10% |
| Compensation alignment | 10% |
| Recency / responsiveness | 5% |

Weights are configurable per job. Must-haves are hard gates (failing = excluded). Every score comes with visible reason factors ("1.2 ק״מ · ערבים · 2 שנות בריסטה") so the operator can trust and contest it.

### 5. Real-World Network Building
Huntch is not just an app. It builds physical presence in hospitality neighborhoods:
- **Black stickers** on business windows ("אנחנו מגייסים דרך Huntch")
- **Amber stickers** on public surfaces near hospitality clusters ("מחפש/ת עבודה? סרוק")
- **Physical job boards** in key neighborhood spots (updated weekly with real local jobs)
- **Huntch Ambassadors** — 3-5 trusted local workers per neighborhood who refer friends for a bounty
- **Huntch Morning** — monthly street activation outside a busy café; workers scan QR over coffee
- **Receipt/packaging QR codes** — on café receipts, to-go cups, delivery bags

---

## The Two-Sided Network

Huntch has two customers who must both be present in the same neighborhood:

| Side | Who | What they need |
|---|---|---|
| **Demand** | Business owners / operators | A reliable shortlist of local qualified workers, fast |
| **Supply** | Hospitality workers | Relevant local job opportunities, low friction to apply |

**The geographic constraint is the product.** A barista in Florentin wants to work in Florentin. A café in Florentin wants someone who can walk in tomorrow. Matching at distance is a feature — matching within 1.2km is the magic.

### The Self-Feeding Loop

```
Business puts up Huntch sticker
         ↓
Worker nearby scans → 60-second WhatsApp signup → enters local pool
         ↓
Pool grows → better/faster matches for businesses
         ↓
More businesses join to access the growing pool
         ↓
More stickers appear in the neighborhood
         ↓
More workers scan
         ↓
            ↻ self-feeding
```

Every rejected applicant, every past hire, every referral — all geographically tagged, all quietly available for the next business that opens a gap nearby.

---

## Core Workflows

### Flow 2 — Surface & Confirm (v1, live in mockup)
1. Operator posts a job (role, shifts, wage, requirements)
2. Huntch queries pool → ranks by fit → delivers shortlist
3. Operator reviews candidate cards (name, distance, availability, score + reasons)
4. Operator invites — single tap per card, or bulk ("invite all ≥ 80%")
5. Huntch sends WhatsApp outreach to invited candidates from shared Huntch number, naming the venue
6. Operator sees Responders view — who said yes, ranked
7. Operator sends interview link or contacts directly

### The Replacement Trigger (recurring high-value moment)
1. A worker quits or is let go
2. Operator taps "דווח על עזיבה" → picks role
3. Huntch instantly re-queries pool (recency-filtered for likely-available workers)
4. Fresh ranked shortlist delivered in seconds
5. This is Huntch's highest-value recurring moment — built for the exact event the product exists to absorb

### Pool Growth (background, always on)
Every applicant from any channel — apply form, CSV import, lead ad, referral, street QR scan — enters the pool with consent + source recorded. Over time the pool becomes Huntch's moat. No other platform has this local, consented, hospitality-specific dataset.

### Flow 1 — Full Auto-Invite (v2, paid tier)
System auto-invites the matched batch without operator review. Shows a clear notice: "automated — review responders before hiring." Gated behind Pro subscription. Operators opt in explicitly.

---

## Outreach Architecture

- **One shared WhatsApp Business number** branded as Huntch, serving all businesses
- Messages name the specific venue: *"בית קפה לינה ברוטשילד מחפשים בריסטה — 1.2 ק״מ ממך"*
- **Opt-in only** — outreach goes only to workers who consented (applied, signed up, imported with consent, scanned QR)
- **Per-operator rate limits** and frequency caps — one operator spamming degrades deliverability for everyone; this is enforced at platform level
- **BSP: Meta Direct** — WhatsApp Business API via Meta direct BSP (not Twilio/360dialog)
- Meta template approval required; 24-hour messaging windows apply
- All consent proofs stored per candidate with source + timestamp

---

## Business Model

### Tiers

| Tier | Price | What's Included |
|---|---|---|
| **Starter** | Free or low (₪0–99/mo) | Flow 2, 1 active job, pool access, capped outreach |
| **Pro** | ₪299–499/mo | Multiple active jobs, Flow 1 auto-invite, bulk invite, larger campaigns, analytics |
| **Ad Spend** | Pass-through | Meta Lead Ads budget; managed separately, not absorbed |

*Numbers TBD — validate with existing food & hospitality clients before committing.*

### Revenue Logic
- Businesses pay for access to the pool and automation
- The pool value grows with every candidate who joins
- Network effects = moat: the 50th business in Florentin inherits thousands of pre-screened local workers at onboarding

---

## Go-to-Market: Neighborhood-First Expansion

### Phase 1 — Own One Neighborhood (Florentin)
| Week | Action |
|---|---|
| 1–2 | Sign up 10 businesses manually. Door to door. Free first month. Seed pool with CSV imports from willing businesses. |
| 3 | Deploy stickers. Install 2 physical boards. Recruit 2 ambassadors (₪200/hire referral fee). |
| 4 | First "Huntch Morning" activation outside a popular café, 7am. Receipt QR codes live. |
| 5 | First self-generated matches. Document the success story (photos, WhatsApp screenshot with permission). |
| 6 | Use social proof to pitch neighboring areas (Neve Tzedek, Rothschild corridor). |

### Phase 2 — City-Wide Network (Tel Aviv)
- Expand neighborhood by neighborhood using Phase 1 playbook
- Cross-neighborhood pool kicks in: a rejected applicant from Florentin now visible to Neve Tzedek businesses
- City-level Telegram group ("עבודה בתל אביב") with daily Huntch-curated job posts

### Phase 3 — National
- Haifa, Jerusalem, Beer Sheva using same playbook
- Each city starts with 10 businesses + ambassador network
- National pool cross-queries for willing-to-relocate candidates

---

## Acquisition Channels (Ranked by Priority)

| Channel | Side | Cost | Speed | Quality |
|---|---|---|---|---|
| Ambassador referral program | Supply | Low (₪200/hire) | Medium | Very high (trusted network) |
| QR stickers — physical | Both | Very low | Slow burn | High (local, opt-in) |
| Physical job boards | Both | Low | Slow burn | High |
| Neighborhood WhatsApp/Telegram | Both | Free | Fast | Medium |
| Meta Lead Ads | Supply | Paid | Fast | Medium |
| Google for Jobs (SEO) | Supply | Free | Slow | High |
| Huntch Morning activations | Both | Low | Medium | High |
| Receipt/packaging QR | Supply | Very low | Slow burn | High |
| TikTok/Instagram content | Both | Time | Medium | Medium |
| Door-to-door business sales | Demand | Time | Fast | Very high |

---

## The Candidate Experience

Huntch is opt-in only. The candidate experience must feel respectful, not spammy:

1. **Scan / apply** → 60-second WhatsApp signup
2. **Receive only relevant jobs** — same role, same neighborhood, within stated wage range
3. **Reply YES/NO** with one word — no app needed, no account, no CV upload required
4. **Clear opt-out** in every message: *"השב STOP להסרה מהרשימה"*
5. **Transparency** — message clearly says which business is contacting, not just "Huntch"

Workers who have a good experience refer friends. Workers who feel spammed opt out and tell others. **The product only works if workers trust it.**

---

## What Huntch Is NOT

- **Not a job board** — businesses don't post and wait. Huntch delivers.
- **Not LinkedIn** — no professional profiles, no resumes, no networking. Just role + availability + location.
- **Not a staffing agency** — no placement fees, no exclusivity. SaaS model.
- **Not a cold-contact tool** — zero outreach to people who haven't opted in. This is both an ethical and legal constraint (Israeli privacy law).
- **Not a national platform (yet)** — hyperlocal first. National reach follows once neighborhood networks are self-sustaining.

---

## What's External / Not Buildable by Code Alone

| Requirement | Status |
|---|---|
| Meta Business account + WhatsApp number verification | External — manual setup |
| WhatsApp template approval | External — Meta review process |
| Meta Ads account + Lead Ad creative + budget | External — operator/growth team |
| Manual community group posting | External — human-operated |
| Legal review of consent flows under Israeli privacy law | External — legal counsel |
| Physical sticker distribution | External — field operations |
| Ambassador recruitment | External — community/sales team |

---

## Tech Stack (Mockup → v1)

| Layer | Mockup (now) | v1 |
|---|---|---|
| Frontend | Next.js + TypeScript, RTL Hebrew, CSS (no Tailwind) | Same |
| State | Zustand + localStorage | Postgres via Neon/Supabase |
| Auth | Simulated OTP UI | Real phone OTP (Twilio Verify or similar) |
| Matching | In-memory rule engine (Haversine + weighted score) | Same engine, Postgres-backed |
| Outreach | Mocked WhatsApp simulation | Meta direct BSP — WhatsApp Business API |
| Hosting | Local dev (port 3001) | Vercel + Neon |
| Campaigns | Stubbed | Meta Marketing API (Lead Ads) |

---

## Open Decisions (Still Pending)

- [ ] Exact pricing numbers — validate with existing food & hospitality clients
- [ ] Which behavioral signals seed the v2 reliability indicator (and fairness guardrails)
- [ ] Whether v1 outreach launches with live WhatsApp or mocked while BSP onboarding completes
- [ ] Exact launch neighborhood — Florentin vs. Rothschild corridor vs. Dizengoff area
- [ ] Ambassador compensation structure (flat fee vs. % of first month's subscription)
- [ ] Physical sticker supplier and design finalization
- [ ] Legal counsel for Israeli privacy law (consent flows, data retention)

---

## The North Star Metric

**Time-to-hire after a gap is reported.**

If a business owner reports a leaver at 9am and has a confirmed interview by 5pm — Huntch is working. Everything else (pool size, match quality, open rates, campaign ROI) is in service of that number.

---

## Council Verdict — Full Scaling Plan
> *LLM Council session, June 18, 2026. 5 advisors · 5 peer reviewers · 1 chairman synthesis.*
> *Full visual report: `council-report-2026-06-18.html`*

### What the Council Agrees On (High-Confidence Signals)

1. **The cold-start problem is the only real problem.** Everything else — pricing, virality, moat, expansion — is downstream of this. Huntch delivers zero value until there is a dense enough pool of available workers within short commute. This is an operations and trust challenge that precedes all other work.

2. **One real, witnessed, successful match is the entire go-to-market.** The actual physical event of a business owner calling a neighboring owner saying "they found me a barista in three hours" is the only marketing asset that works in this demographic. Trust propagates peer-to-peer through observed results, not digital testimonials.

3. **The business owner's real fear is not the technology — it is looking foolish.** The pitch that lands is not "we have an algorithm." It is "your neighbor tried this, it worked, here is their name, call them."

4. **WhatsApp dependency is a structural risk** that must be actively managed with dual-channel fallback from day one, not retrofitted after a crisis.

---

### Trust Architecture

**Earning business owner trust — 4 stages:**

- **Stage 1 — Social introduction:** First conversation comes through a mutual introduction, not a cold walk-in. Attend neighborhood business events for 2 weeks before pitching anything.
- **Stage 2 — Risk-reversal offer:** First 3 matches free, guaranteed. "If the worker doesn't work out in the first shift, I personally find you a replacement in 4 hours or I pay your temp agency call."
- **Stage 3 — Witnessed match:** After the first successful hire, the Huntch operator facilitates a coffee meeting between the satisfied owner and 2–3 neighboring owners. Not a testimonial email — a face-to-face introduction.
- **Stage 4 — Named account relationship:** Every business has a named Huntch contact they can WhatsApp directly. This is the human layer that makes the product trustworthy to a demographic burned by faceless tech platforms before.

**Earning worker trust:**

- Opt-in message written in plain Hebrew, under 100 words, in the register of a neighbor texting you — not a terms-of-service document
- Operational target: every enrolled worker receives their first shift offer within 21 days of enrollment. Workers who receive an offer within 3 weeks stay engaged; workers who receive no offer within 30 days disengage at ~70% rate permanently
- Never charge the worker. Non-negotiable.
- Same-day payment confirmation WhatsApp message after every completed shift — workers screenshot this and share it with friends. Design it to be screenshot-able.

---

### The Trigger Mechanism

Country-scale is not planned — it is triggered. The trigger for neighborhood 2 is not a Huntch sales pitch. It is a business owner from neighborhood 1 telling a peer:

> *"My head barista quit Monday morning. I had someone competent making coffee by 11am. Call Yossi at the Blue Cup, he'll tell you."*

That story must contain: **specific crisis · specific resolution · specific endorser.** Any pitch that is not that story will not trigger neighborhood 2 adoption.

The founder's job in months 1–3 is not just making matches — it is engineering the conditions for that story to be told. After every successful match: ask the satisfied owner "who else do you know who has this problem?" and facilitate the warm introduction personally.

---

### Pricing Psychology

| Tier | Price | When to introduce | Logic |
|---|---|---|---|
| **Trial** | Free (first 3 matches) | Day 1 | Eliminates perceived risk. Frame clearly: "Free so you can see it work. Then ₪150 per successful match — meaning the worker shows up." |
| **Per-match** | ₪150/successful match | After trial | Half the cost of a temp agency call. Make this comparison explicitly in every pitch. |
| **Relationship** | ₪299/mo | After 2+ successful hires | Unlimited matches for businesses hiring 3+ workers/month. Converts vendor relationship to infrastructure utility — infrastructure is sticky. |
| **Power user** | ₪499/mo | Month 12+ | Shift management, recurring schedules, priority ranking. Only viable once matching quality is high enough. |

**Founding partner lock:** First 20 businesses get ₪150/match price locked for 2 years. Costs almost nothing. Generates disproportionate loyalty and referral motivation.

---

### Viral Mechanics

**Business-to-business spread:**
- Witnessed match → coffee introduction to neighbors (primary viral unit)
- Business association presentation with 5 satisfied owners present once there are 5+ successful matches in a neighborhood
- Referral incentive = priority pool access, not cash — cash cheapens the relationship; priority access is more valuable to someone who genuinely values the service

**Worker-to-worker spread:**
- Access existing WhatsApp groups for hospitality workers by role and neighborhood — have satisfied workers share the opt-in link, not Huntch posting cold
- After every successful match: "Do you know 3 people who work in food and hospitality who might want this?"
- Same-day payment confirmation message is the viral content on the worker side — design it to be shareable

---

### Competitive Moat

The algorithm is **not** the moat — any funded competitor clones it in one engineering sprint.

The moat is the **consented, engaged, fresh worker pool combined with trust relationships with business owners in specific neighborhoods.** This moat is geographic and temporal — it takes time to build and only works where it already exists. A competitor entering 12 months later must rebuild the pool from scratch in each neighborhood.

- **Secondary moat:** Behavioral reliability data — which workers show up, which perform. After 500 matches this makes Huntch matching quality measurably better than any new entrant.
- **Tertiary moat:** Hebrew-language, Israel-specific UX with tacit knowledge baked in (holiday calendar, Shabbat patterns, Jerusalem–Tel Aviv labor flows, specific role categories). A global entrant takes 18–24 months to replicate this.

---

### The 90-Day Sequence to First Working Neighborhood

| Days | Action |
|---|---|
| **1–7** | Privacy attorney (₪2,000–3,000). WhatsApp Business API setup (3–7 day approval). Airtable CRM with fields: name, phone, neighborhood (100m radius), role, availability, wage floor, opt-in timestamp, **last-active date** (critical for pool health). Print 50 worker QR stickers. |
| **8–14** | Walk every business on Florentin commercial strip. Ask: *"What's the hardest staffing problem you had this month?"* Listen. Do not pitch technology. Goal: 10 business owners agree to a follow-up. Place stickers at market coffee corner, two busiest bus stops, worker entrances to three largest restaurants. |
| **15–21** | Personal WhatsApp to every enrolled worker within 24h of opt-in. Hold 10 follow-up meetings. Show live WhatsApp conversation. Offer free first 3 matches. Get 5 signed up. |
| **22–30** | First gap comes in — **do NOT run the algorithm.** Personally review every worker. Call each candidate before sending WhatsApp. Brief the business owner. Be present or available by phone for first 2 hours of first shift. This match must succeed. |
| **31–60** | Complete 10 matches. At least 7 successful. Debrief both sides. Collect referrals. Target by day 60: 50 enrolled workers, 8 active businesses, 10 completed matches, 1 documented case study. |
| **61–90** | Identify 2–3 most satisfied owners with most social capital. Ask: *"Who is the most respected restaurant owner in [adjacent neighborhood]?"* Facilitate the warm introduction. Do not pitch — tell the story. Target by day 90: 3 enrolled businesses in neighborhood 2, pool seeding started. |

---

### 12-Month Sequence to Tel Aviv-Wide Coverage

| Month | Milestone |
|---|---|
| **1–3** | First neighborhood loop working: 50 workers, 10 businesses, 15 successful matches, trigger mechanism self-sustaining |
| **4–5** | Second neighborhood via trigger. Part-time neighborhood coordinator hired (₪2,500/mo). Founder oversees all matching. |
| **5–6** | Launch ₪299/mo subscription for businesses with 3+ successful hires. Algorithm introduced — reviewed by human for first 90 days. |
| **7–8** | Neighborhoods 3 and 4. If new businesses are approaching Huntch (not being sold to), trigger is working. If not, diagnose before expanding. |
| **8–10** | Pool health monitoring as formal weekly metric. Target: 60%+ of enrolled workers responded to a message in last 30 days. Below 40% → active re-engagement. |
| **10–12** | Neighborhoods 5–8: Florentin, Neve Tzedek, Rothschild, market area, Jaffa, Dizengoff north. **Target: 2,000 active workers · 150–200 businesses · ₪40,000–60,000/mo revenue.** |

---

### Country-Scale Operational Requirements

| Resource | Requirement |
|---|---|
| **Headcount** | 8–12 neighborhood coordinators (₪3,000–4,000/mo, part-time) · 1 operations manager (₪12,000–15,000/mo) · 1 developer on contract (₪8,000–12,000/mo) · 1 customer success (₪8,000–10,000/mo) |
| **Technology** | Custom CRM + matching system needed at ~300 workers / 50 businesses. Budget ₪80,000–120,000. Build months 8–12, not before. |
| **Capital** | ₪600,000–900,000 total. Sources: angel investment (Israeli HR-tech / hospitality angels) + revenue reinvestment. |
| **Timeline** | 24–30 months from first neighborhood activation |

---

### The Supply-Side Retention Problem (Critical Blind Spot)

> *Every peer reviewer on the council flagged this independently. It is potentially the dominant operational problem at scale and is invisible until it has already hollowed out the product.*

Workers opt in once and then go silent. A pool of 500 at enrollment degrades to ~150 usable within 90 days without active retention. The four-component solution:

1. **Status check cadence:** Every 2 weeks, one WhatsApp to every active worker: *"עדיין זמין/ה למשמרות? ענה/י כן / לא / שנה זמינות"* — single-tap reply. Non-responders after 48h → inactive → one follow-up → removed from active matching.

2. **Value delivery loop:** Every active worker must receive at least 1 shift offer per 21-day period. If business-side volume is insufficient, proactively reach out to businesses: "Any gaps this week? We have strong workers available." Partially manufacture demand in early months to keep supply engaged.

3. **Social engagement:** Monthly message to all active workers acknowledging total shifts completed that month in their neighborhood. Costs nothing. Creates sense of participation in something growing.

4. **Pool health dashboard** reviewed weekly without exception: total enrolled · active (responded in last 30 days) · inactive · shifts/week · response rate · time-to-match. Any metric degrading 2 consecutive weeks → active intervention.

**Supply composition note:** Israeli food and hospitality employs a material proportion of migrant/undocumented workers who will not join a named database. Effective addressable pool is 50–65% of apparent back-of-house workforce, 80–90% of front-of-house. All cold-start density estimates must be recalibrated accordingly. Focus enrollment energy on front-of-house and barista roles initially.

---

### WhatsApp Risk Mitigation

| Timeline | Action |
|---|---|
| **Day 1** | Collect worker phone numbers with explicit SMS backup consent. Send one SMS/quarter to keep channel warm. |
| **Month 4** | Build simple PWA as optional non-WhatsApp channel for shift offers. Don't push as primary — make it available. |
| **Month 8** | Ensure 30%+ of active workers enrolled via SMS or PWA. Viable 72-hour fallback if API disrupted. |
| **Architecture** | Most communications worker-initiated (opt-in, status confirmation, shift response). Business-initiated messages (gap notifications) only to workers who explicitly requested shift offers. This is policy-compliant and reduces rate-limiting risk. |

---

## The One Thing to Do First

> **Book a 90-minute appointment with an Israeli privacy law attorney to review the opt-in language and data storage approach — before enrolling a single worker.**
>
> Cost: ₪2,000–3,000. The cost of getting it wrong: losing the ability to message your pool at all. Make the appointment today.

---

*This document is the single source of truth for Huntch's strategy. Update it before any major product or GTM decision.*
