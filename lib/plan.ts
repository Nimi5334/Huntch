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
