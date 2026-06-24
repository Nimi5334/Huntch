// WhatsApp Cloud API client (Meta-hosted).
// Pure fetch — no SDK dependency. Server-side only (uses secret token).
//
// Docs: Meta Graph API → /{phone-number-id}/messages
// Env: META_WHATSAPP_PHONE_ID, META_WHATSAPP_TOKEN, META_GRAPH_VERSION, META_APP_SECRET
import crypto from 'node:crypto';

const GRAPH = process.env.META_GRAPH_VERSION || 'v21.0';

function cfg() {
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  const token = process.env.META_WHATSAPP_TOKEN;
  if (!phoneId || !token) {
    throw new Error('WhatsApp not configured: set META_WHATSAPP_PHONE_ID and META_WHATSAPP_TOKEN');
  }
  return { phoneId, token };
}

/** Normalize an Israeli phone to E.164 digits Meta expects (e.g. 0501234567 → 972501234567). */
export function toE164(raw: string): string {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '972' + d.slice(1);      // local IL → +972
  if (!d.startsWith('972') && d.length <= 10) d = '972' + d;
  return d;
}

async function send(payload: Record<string, unknown>) {
  const { phoneId, token } = cfg();
  const res = await fetch(`https://graph.facebook.com/${GRAPH}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`WhatsApp send failed (${res.status}): ${JSON.stringify(json)}`);
  }
  // returns { messages: [{ id }] } — id used to correlate delivery/read webhooks
  return json as { messages?: { id: string }[] };
}

/**
 * Send a pre-approved template message (the only way to start a conversation
 * with someone outside the 24h customer-service window).
 * @param components ordered body params that fill {{1}}, {{2}}, ...
 */
export async function sendTemplate(opts: {
  to: string;
  template: string;
  language?: string;
  bodyParams: string[];
}) {
  return send({
    to: toE164(opts.to),
    type: 'template',
    template: {
      name: opts.template,
      language: { code: opts.language || 'he' },
      components: opts.bodyParams.length
        ? [{ type: 'body', parameters: opts.bodyParams.map((text) => ({ type: 'text', text })) }]
        : [],
    },
  });
}

/** Send a free-form text message. Only allowed inside the 24h window after the user replied. */
export async function sendText(to: string, body: string) {
  return send({
    to: toE164(to),
    type: 'text',
    text: { preview_url: false, body },
  });
}

/** Fill the `shift_offer` template: {{1}}name {{2}}venue {{3}}area {{4}}role {{5}}when {{6}}km */
export function shiftOfferParams(p: {
  name: string; venueType: string; area: string; role: string; when: string; km: number;
}): string[] {
  return [p.name, p.venueType, p.area, p.role, p.when, p.km.toFixed(1)];
}

/**
 * Verify the X-Hub-Signature-256 header Meta sends on webhook POSTs.
 * @param rawBody the exact request body string (do NOT re-stringify parsed JSON)
 */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Classify an inbound reply body into an intent. */
export function classifyReply(body: string): 'yes' | 'no' | 'stop' | 'other' {
  const t = body.trim().toLowerCase();
  if (/(^|\b)(stop|הסר|להסיר|ביטול|הפסק)\b/.test(t)) return 'stop';
  if (/(^|\b)(כן|yes|מעוניין|מעוניינת|זמין|זמינה|בא לי|אני בעניין)\b/.test(t)) return 'yes';
  if (/(^|\b)(לא|no|לא מעוניין|לא זמין|לא רלוונטי)\b/.test(t)) return 'no';
  return 'other';
}
