/**
 * Production-path bridge between WhatsApp and the clinic's patient data.
 * SERVER-ONLY. The demo/local path (Zustand + localStorage) never touches this file —
 * the Home/Today/Inbox pages call store actions directly and simulate delivery.
 * This file activates once a clinic has WhatsApp Business credentials + Supabase configured.
 */
import { sendText, normalizePhone } from './whatsapp-client';
import { answerPatient } from './ai';
import {
  fetchClinicByWaPhoneNumberId,
  fetchPatientByPhone,
  fetchLatestSentOutreach,
  updateOutreachRow,
  createEscalationRow,
  appendPatientInsight,
} from './supabase';

const hasWaCreds = () => Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/** Delivers an approved outreach message. No-ops (demo-simulated) when WA creds are absent. */
export async function deliverOutreach(phone: string, message: string): Promise<void> {
  if (!hasWaCreds()) return; // demo mode already marks the outreach as "sent" client-side
  await sendText(normalizePhone(phone), message);
}

/**
 * Handles an inbound WhatsApp message from a patient.
 * `waPhoneNumberId` identifies which clinic's WhatsApp number received the message —
 * this is how one webhook serves many tenants.
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
  const ai = await answerPatient(text, clinic.knowledge, clinic.name);

  if (outreach) {
    await updateOutreachRow(outreach.id, { status: 'replied', respondedAt: new Date().toISOString(), insight: text });
  }
  await appendPatientInsight(patient.id, text);

  if (ai.escalate) {
    await createEscalationRow(clinic.id, patient.id, ai.escalationReason ?? 'other', text);
  }

  if (hasWaCreds()) {
    await sendText(phone, ai.reply);
  }
}
