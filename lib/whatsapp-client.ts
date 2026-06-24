/**
 * WhatsApp Business Cloud API wrapper (Meta Graph API v19.0).
 * SERVER-ONLY — import only from API routes / server actions.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 */

const WA_BASE = 'https://graph.facebook.com/v19.0';

function token(): string {
  const t = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!t) throw new Error('WHATSAPP_ACCESS_TOKEN env var is not set');
  return t;
}

function phoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID env var is not set');
  return id;
}

async function waPost(payload: object): Promise<void> {
  const res = await fetch(`${WA_BASE}/${phoneNumberId()}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '(unreadable)');
    throw new Error(`WA API ${res.status}: ${body}`);
  }
}

// ─── Message primitives ────────────────────────────────────────────────────────

export async function sendText(to: string, text: string): Promise<void> {
  await waPost({
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text, preview_url: false },
  });
}

/**
 * Interactive quick-reply buttons.
 * WA limits: max 3 buttons, title ≤ 20 chars each.
 */
export async function sendButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[]
): Promise<void> {
  if (buttons.length > 3) throw new Error('WA buttons: max 3 allowed');
  await waPost({
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  });
}

/**
 * Interactive list message.
 * WA limits: max 10 rows per section, title ≤ 24 chars, desc ≤ 72 chars.
 */
export async function sendList(
  to: string,
  body: string,
  buttonLabel: string,
  rows: { id: string; title: string; description?: string }[]
): Promise<void> {
  await waPost({
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonLabel,
        sections: [{ title: 'אפשרויות', rows }],
      },
    },
  });
}

// ─── Phone normalization ───────────────────────────────────────────────────────

/**
 * Normalize an Israeli phone number to WA international format (972XXXXXXXXX).
 * Strips whitespace, dashes, parentheses, leading +.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // 05XXXXXXXX → 9725XXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) return '972' + digits.slice(1);
  // Already international
  if (digits.startsWith('972') && digits.length === 12) return digits;
  // Fallback — return cleaned digits
  return digits;
}
