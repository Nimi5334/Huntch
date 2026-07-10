import type { Clinic } from './types';

export type Feature =
  | 'daily_briefing'
  | 'auto_outreach'
  | 'ai_brain'
  | 'quality_checks'
  | 'roi_dashboard'
  | 'unlimited_patients'
  | 'priority_support';

const ADVANCED_ONLY: Feature[] = [
  'daily_briefing', 'auto_outreach', 'ai_brain', 'quality_checks', 'roi_dashboard',
  'unlimited_patients', 'priority_support',
];

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
    'לידים מותאמים אישית לכל מטופל',
    'העתקת הודעת לחזרה + שליחה ידנית',
    'הוספה ידנית + ייבוא CSV',
    `עד ${BASIC_PATIENT_CAP} מטופלים`,
  ],
  advanced: [
    'כל מה שיש בבסיסי',
    'מרכז המשימות — כל המשימות במקום אחד',
    'שליחה אוטומטית בוואטסאפ (אישור לפני שליחה)',
    'אוטומציה — מענה אוטומטי, שאלות נפוצות וסימולציית אימון',
    'בדיקות איכות תקופתיות אוטומטיות',
    'יומן פעילות — היסטוריית הפעולות של המערכת',
    'מטופלים ללא הגבלה',
    'תמיכה מועדפת',
  ],
};
