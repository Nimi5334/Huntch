# Supabase Setup for Huntch

---

## Step 1: Create the Database Schema

1. Go to https://app.supabase.com → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql` from the repo
5. Paste into the query editor
6. Click **Run**
7. You should see green checkmarks — all tables created ✅

---

## Step 2: Copy Environment Variables

The `.env.local.example` file now includes your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://ijbbhtljxqnjboyhrjqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy these into your `.env.local` (create it if needed):

```bash
cp .env.local.example .env.local
```

These env vars are already filled in with your project URL and anon key.

---

## Step 3: Install Supabase JS Client

```bash
npm install @supabase/supabase-js
```

---

## Step 4: Update the App

The store now fetches from Supabase on init. When a user:
- **Scans QR** → candidate is saved to Supabase (not just localStorage)
- **Logs in** → business data fetches from Supabase
- **Hires someone** → employee record created in Supabase
- **Posts a job** → saved to Supabase database

The Zustand store is still the UI state layer, but now it's backed by a real database.

---

## Step 5: Set Environment Variables in Vercel

When you deploy to Vercel:

1. Go to https://vercel.com → Your Project (dna-form)
2. Click **Settings** → **Environment Variables**
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Use the values from your `.env.local`
5. Click **Save**
6. **Redeploy** the project

---

## What Happens Now

### QR Submissions Flow

```
1. Candidate scans QR → /join/biz-1
2. Fills form → submits
3. addViaQr() is called:
   - Creates record in supabase.candidates table
   - Creates QR scan record in supabase.qr_scans table
   - Also adds to local Zustand state (for instant UI update)
4. Returns candidateId
5. WhatsApp trigger API route fires:
   - Fetches candidate from Supabase
   - Sends first WhatsApp message
```

### Login Flow

```
1. Owner enters phone + password
2. store.login() checks against supabase.businesses
3. If match → isLoggedIn = true
4. fetch businesses → populate store.jobs, store.pool, store.employees
```

### Data Isolation

Each business sees only their own:
- `pool` (applicants who scanned their QR)
- `employees` (hired staff)
- `jobs` (active postings)

**Note:** RLS (Row Level Security) is disabled for now. In production, we'll add authentication and RLS policies to lock down data per business.

---

## Troubleshooting

**"Cannot connect to Supabase"**
- Check `.env.local` has correct URL and anon key
- Verify no typos in environment variables
- Run `npm run dev` — restart Next.js

**"Table 'candidates' does not exist"**
- The SQL schema didn't run. Go back to step 1 and run `supabase-schema.sql` again.

**"NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined"**
- Make sure `.env.local` exists and has the correct value (from your Supabase project settings)

**Vercel deployment failing**
- Make sure you added the env vars in Vercel → Settings → Environment Variables
- Redeploy after adding variables

---

## Next: WhatsApp Sessions in Supabase

Currently, WhatsApp conversation state is stored in an in-memory Map (`lib/whatsapp-session.ts`). This works for local development but resets on Vercel deployments.

To persist WhatsApp sessions:
1. Migrate from `Map<phone, WaSession>` to `supabase.from('wa_sessions').update()`
2. Update `lib/whatsapp-flow.ts` to use Supabase queries instead of `sessions.set()`

This is optional for MVP but required for production.

---

## Database Design

Tables created:
- **businesses** — owner accounts
- **candidates** — QR applicants + hired employees
- **employees** — hired candidates (references candidates)
- **jobs** — active job listings
- **invites** — WhatsApp invitations to candidates
- **qr_scans** — audit trail of QR code scans
- **wa_interview_results** — completed DNA feeder interviews
- **wa_sessions** — active WhatsApp conversations
- **employee_requests** — leave/shift-swap requests
- **candidate_preferences** — saved/dismissed candidates

All have indexes on `business_id` for fast filtering per business.

---

## What's NOT Changed

The app still works the same from a user perspective:
- UI layer is Zustand (no changes to components)
- Navigation, design, DNA scoring — all identical
- Only difference: data now persists across browsers/devices/deploys

---

## Next Steps

1. ✅ Create schema in Supabase (copy-paste SQL)
2. ✅ Grab env vars from your Supabase project
3. ✅ Run `npm install @supabase/supabase-js`
4. ✅ `npm run dev` — test locally
5. ✅ Update Vercel env vars
6. ✅ Deploy → test on production URL

Let me know when you've done step 1 and I'll test if data is persisting correctly.
