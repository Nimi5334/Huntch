import type { Clinic } from './types';

export type Feature =
  | 'auto_outreach'
  | 'unlimited_patients'
  | 'priority_support';

const ADVANCED_ONLY: Feature[] = ['auto_outreach', 'unlimited_patients', 'priority_support'];

export const BASIC_PATIENT_CAP = 500;

export function isTrialActive(clinic: Clinic): boolean {
  if (!clinic.trialEndsAt) return false;
  return new Date(clinic.trialEndsAt).getTime() > Date.now();
}

export function effectivePlan(clinic: Clinic): 'basic' | 'advanced' {
  if (clinic.plan === 'advanced') return 'advanced';
  return isTrialActive(clinic) ? 'advanced' : 'basic';
}

export function canUse(clinic: Clinic, feature: Feature): boolean {
  if (!ADVANCED_ONLY.includes(feature)) return true;
  return effectivePlan(clinic) === 'advanced';
}

export const PLAN_PRICE_ILS: Record<'basic' | 'advanced', number> = {
  basic: 149,
  advanced: 499,
};

/* ── Subscription pricing + ROI ──────────────────────────────────────────
   The full Huntch subscription is billed at $49/month. The value pitch is
   deliberately conservative and checkable: a single reactivated patient who
   comes back for a routine recall visit already covers the app for months. */

export const SUBSCRIPTION_PRICE_USD = 49;

/** $49 ≈ ₪180/mo (USD→ILS ≈ 3.67). */
export const SUBSCRIPTION_PRICE_ILS = 180;

/** Conservative average revenue from one reactivated patient returning for a
 *  periodic recall visit in Israel (checkup + scaling/cleaning; usually more
 *  once a restorative treatment is added). */
export const AVG_RETURNING_PATIENT_ILS = 500;

/** Real math: ₪500 / ₪180 ≈ 2.8 → one returning patient prepays ~2.8 months. */
export const MONTHS_COVERED_PER_PATIENT =
  Math.round((AVG_RETURNING_PATIENT_ILS / SUBSCRIPTION_PRICE_ILS) * 10) / 10;

export const PLAN_FEATURES_HE: Record<'basic' | 'advanced', string[]> = {
  basic: [
    'מאגר מטופלים מלא + פרופיל רפואי',
    'הודעת חזרה מותאמת אישית לכל מטופל',
    'העתקת ההודעה + שליחה ידנית משלך',
    `עד ${BASIC_PATIENT_CAP} מטופלים`,
  ],
  advanced: [
    'כל מה שיש בבסיסי',
    'שליחה אוטומטית תקופתית בוואטסאפ (אישור לפני שליחה)',
    'מטופלים ללא הגבלה',
    'תמיכה מועדפת',
  ],
};
