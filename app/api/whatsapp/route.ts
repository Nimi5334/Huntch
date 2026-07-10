/**
 * WhatsApp Cloud API webhook.
 *
 * GET  /api/whatsapp  — Meta's one-time webhook verification challenge
 * POST /api/whatsapp  — Incoming messages from patients
 *
 * Configure in Meta Developer Console → WhatsApp → Configuration:
 *   Callback URL: https://your-domain/api/whatsapp
 *   Verify token: same value as WHATSAPP_VERIFY_TOKEN env var
 *   Subscribed fields: messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { processIncomingReply } from '@/lib/outreach-flow';

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

export async function POST(request: NextRequest) {
  // Always 200 immediately — WA retries on non-2xx or timeouts
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: 'ok' }); // malformed, ignore
  }

  void processWebhook(body).catch(err => console.error('[WA webhook]', err));

  return NextResponse.json({ status: 'ok' });
}

async function processWebhook(body: any): Promise<void> {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const waPhoneNumberId: string | undefined = value?.metadata?.phone_number_id;
  const messages: any[] = value?.messages ?? [];
  if (!waPhoneNumberId || messages.length === 0) return; // status update or other event

  const msg = messages[0];
  const from = msg.from ?? '';
  if (!from) return;

  let text = '';
  if (msg.type === 'text') {
    text = msg.text?.body ?? '';
  } else if (msg.type === 'interactive') {
    const t = msg.interactive?.type;
    if (t === 'button_reply') text = msg.interactive.button_reply?.title ?? '';
    else if (t === 'list_reply') text = msg.interactive.list_reply?.title ?? '';
  }

  if (text) await processIncomingReply(waPhoneNumberId, from, text);
}
