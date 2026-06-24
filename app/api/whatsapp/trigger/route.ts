/**
 * POST /api/whatsapp/trigger
 *
 * Starts the DNA Feeder WhatsApp conversation for a candidate who just
 * completed the QR join form. Called client-side immediately after addViaQr().
 *
 * Body:
 *   candidateId   string  — Zustand-generated candidate ID
 *   candidateName string  — candidate's full name
 *   phone         string  — raw phone from the form (05X-XXXXXXX or international)
 *   businessId    string  — business ID
 *   businessName  string  — business display name
 *   formCompletionSec? number — seconds from form mount to submission (passive signal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { startSession } from '@/lib/whatsapp-flow';
import { normalizePhone } from '@/lib/whatsapp-client';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { candidateId, candidateName, phone, businessId, businessName, formCompletionSec } = body ?? {};

  if (!candidateId || !candidateName || !phone) {
    return NextResponse.json(
      { error: 'Required: candidateId, candidateName, phone' },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(String(phone));
  if (normalizedPhone.length < 10) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
  }

  try {
    await startSession({
      candidateId:      String(candidateId),
      businessId:       String(businessId ?? 'unknown'),
      businessName:     String(businessName ?? 'Huntch'),
      candidateName:    String(candidateName),
      phone:            normalizedPhone,
      formCompletionSec: typeof formCompletionSec === 'number' ? formCompletionSec : undefined,
    });

    return NextResponse.json({ status: 'started', phone: normalizedPhone });
  } catch (err: any) {
    console.error('[WA trigger]', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
