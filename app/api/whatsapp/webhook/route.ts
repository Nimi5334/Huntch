// Meta WhatsApp Cloud API webhook.
//   GET  → verification handshake (Meta calls this once when you save the callback URL)
//   POST → inbound messages + delivery/read status updates
//
// Configure in Meta: App → WhatsApp → Configuration → Callback URL:
//   https://<your-domain>/api/whatsapp/webhook
//   Verify token: must equal META_WHATSAPP_VERIFY_TOKEN
//   Subscribe to the "messages" field.
//
// Runs on the Node runtime (needs the raw body + crypto for signature verification).
import type { NextRequest } from 'next/server';
import { verifySignature, classifyReply } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- GET: verification handshake ---
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// --- POST: inbound events ---
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify the request really came from Meta before trusting it.
  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: WhatsAppWebhookBody;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      // Inbound text messages (worker replies)
      for (const msg of value?.messages ?? []) {
        if (msg.type !== 'text' || !msg.text) continue;
        const from = msg.from;                  // E.164, no '+'
        const body = msg.text.body ?? '';
        const intent = classifyReply(body);

        // TODO (Phase D — needs Supabase client): inside a service-role transaction
        //   1. insert into whatsapp_events (wa_message_id=msg.id) — skip if already present (idempotency)
        //   2. find candidate by phone
        //   3. intent === 'stop'  → candidates.opted_out = true; cancel pending invites
        //      intent === 'yes'   → latest pending invite.status = 'responded', responded_at = now()
        //      intent === 'no'    → latest pending invite.status = 'declined'
        //      else               → leave for human follow-up
        console.log('[wa] inbound', { id: msg.id, from, intent, body });
      }

      // Delivery / read status updates for messages WE sent
      for (const st of value?.statuses ?? []) {
        // TODO (Phase D): update invites.set status where wa_message_id = st.id
        //   st.status ∈ 'sent' | 'delivered' | 'read' | 'failed'
        console.log('[wa] status', { id: st.id, status: st.status });
      }
    }
  }

  // Always 200 quickly so Meta doesn't retry; heavy work should be async/queued later.
  return new Response('ok', { status: 200 });
}

// --- minimal types for the webhook payload we consume ---
interface WhatsAppWebhookBody {
  entry?: {
    changes?: {
      value?: {
        messages?: { id: string; from: string; type: string; text?: { body?: string } }[];
        statuses?: { id: string; status: string }[];
      };
    }[];
  }[];
}
