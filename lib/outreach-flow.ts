/**
 * Production-path bridge between WhatsApp and the clinic's patient data.
 * SERVER-ONLY. The demo/local path (Zustand + localStorage) never touches this file —
 * the Home page calls store actions directly and simulates delivery.
 * This file activates once a clinic has WhatsApp Business credentials + Supabase configured.
 */
import { sendText, normalizePhone } from './whatsapp-client';
import {
  fetchClinicByWaPhoneNumberId,
  fetchPatientByPhone,
  fetchLatestSentOutreach,
  updateOutreachRow,
} from './supabase';

const hasWaCreds = () => Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/** Delivers an approved periodic reactivation message. No-ops (demo-simulated) when WA creds are absent. */
export async function deliverOutreach(phone: string, message: string): Promise<void> {
  if (!hasWaCreds()) return; // demo mode already marks the outreach as "sent" client-side
  await sendText(normalizePhone(phone), message);
}

/**
 * Handles an inbound WhatsApp reply from a patient — marks the matching sent
 * reactivation message as replied. `waPhoneNumberId` identifies which clinic's
 * WhatsApp number received the message (one webhook serves many tenants).
 */
export async function processIncomingReply(waPhoneNumberId: string, fromPhone: string, text: string): Promise<void> {
  const clinic = await fetchClinicByWaPhoneNumberId(waPhoneNumberId);
  if (!clinic) return;

  const phone = normalizePhone(fromPhone);
  const patient = await fetchPatientByPhone(clinic.id, phone);
  if (!patient) return;

  if (/^(הסר|stop|הסרה)$/i.test(text.trim())) {
    // opt-out keyword — respected immediately, no further automated contact
    return;
  }

  const outreach = await fetchLatestSentOutreach(clinic.id, patient.id);
  if (outreach) {
    await updateOutreachRow(outreach.id, { status: 'replied', respondedAt: new Date().toISOString() });
  }
}
