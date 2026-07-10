import type { ClinicType, TreatmentCategory } from './types';

export const CATEGORY_HE: Record<TreatmentCategory, string> = {
  cleaning: 'ניקוי אבנית',
  whitening: 'הלבנת שיניים',
  orthodontics: 'יישור שיניים',
  implant: 'שתל',
  'root-canal': 'טיפול שורש',
  crown: 'כתר',
  'night-guard': 'סד לילה',
  checkup: 'בדיקה שגרתית',
  botox: 'בוטוקס',
  filler: 'חומצה היאלורונית',
  laser: 'טיפול לייזר',
  peeling: 'פילינג',
  lifting: 'מתיחה',
  consultation: 'ייעוץ',
};

/** Recall interval in months — how often this treatment should recur */
export const RECALL_MONTHS: Record<TreatmentCategory, number | null> = {
  cleaning: 6,
  whitening: 12,
  orthodontics: null,
  implant: null,
  'root-canal': null,
  crown: null,
  'night-guard': 3,
  checkup: 6,
  botox: 4,
  filler: 10,
  laser: 2,
  peeling: 3,
  lifting: null,
  consultation: null,
};

export const CLINIC_TYPE_HE: Record<ClinicType, string> = {
  dental: 'מרפאת שיניים',
  aesthetic: 'קליניקה אסתטית',
};

export function categoriesForClinic(type: ClinicType): TreatmentCategory[] {
  return type === 'dental'
    ? ['cleaning', 'whitening', 'orthodontics', 'implant', 'root-canal', 'crown', 'night-guard', 'checkup']
    : ['botox', 'filler', 'laser', 'peeling', 'lifting', 'consultation'];
}

export function monthsSince(dateStr: string, today: string): number {
  const d = new Date(dateStr);
  const t = new Date(today);
  return (t.getFullYear() - d.getFullYear()) * 12 + (t.getMonth() - d.getMonth());
}

export function daysSince(dateStr: string, today: string): number {
  const d = new Date(dateStr).getTime();
  const t = new Date(today).getTime();
  return Math.round((t - d) / (1000 * 60 * 60 * 24));
}
