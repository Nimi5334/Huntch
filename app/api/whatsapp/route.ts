/**
 * WhatsApp Cloud API webhook.
 *
 * GET  /api/whatsapp  — Meta's one-time webhook verification challenge
 * POST /api/whatsapp  — Incoming messages from candidates
 *
 * Configure in Meta Developer Console → WhatsApp → Configuration:
 *   Callback URL: https://your-domain/api/whatsapp
 *   Verify token: same value as WHATSAPP_VERIFY_TOKEN env var
 *   Subscribed fields: messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleIncoming } from '@/lib/whatsapp-flow';
import { normalizePhone } from '@/lib/whatsapp-client';

// ─── GET — webhook verification ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const sp        = request.nextUrl.searchParams;
  const mode      = sp.get('hub.mode');
  const token     = sp.get('hub.verify_token');
  const challenge = sp.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ─── POST — incoming messages ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Always 200 immediately — WA retries on non-2xx or timeouts
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: 'ok' }); // malformed, ignore
  }

  // Process async so we don't block the 200 response
  void processWebhook(body).catch(err => console.error('[WA webhook]', err));

  return NextResponse.json({ status: 'ok' });
}

async function processWebhook(body: any): Promise<void> {
  const messages: any[] = body?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
  if (messages.length === 0) return; // status update or other event

  const msg  = messages[0];
  const from = normalizePhone(msg.from ?? '');
  if (!from) return;

  // Unify button reply, list reply, and plain text into a single input string
  let input = '';
  if (msg.type === 'text') {
    input = msg.text?.body ?? '';
  } else if (msg.type === 'interactive') {
    const t = msg.interactive?.type;
    if (t === 'button_reply') input = msg.interactive.button_reply?.id ?? '';
    else if (t === 'list_reply') input = msg.interactive.list_reply?.id ?? '';
  }

  if (input) await handleIncoming(from, input);
}
