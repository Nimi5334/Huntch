/**
 * POST /api/whatsapp/trigger
 *
 * Delivers an already-approved outreach message to a patient over WhatsApp.
 * No-ops when WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not configured —
 * the demo/local path already simulates delivery client-side via the Zustand store.
 *
 * Body: { phone: string, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { deliverOutreach } from '@/lib/outreach-flow';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { phone, message } = body ?? {};
  if (!phone || !message) {
    return NextResponse.json({ error: 'Required: phone, message' }, { status: 400 });
  }

  try {
    await deliverOutreach(String(phone), String(message));
    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[WA trigger]', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
