import type { ClinicType, Patient, Lead, TreatmentRecord } from './types';
import { CATEGORY_HE, RECALL_MONTHS, monthsSince, daysSince } from './clinical';

function fmtDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Pure, deterministic lead generator — swappable for an LLM call later. */
export function generateLead(patient: Patient, clinicType: ClinicType): Lead {
  const now = today();
  const firstName = patient.name.split(' ')[0];

  // 1) Incomplete plan — a planned/in-progress treatment not yet finished
  const incomplete = patient.treatments
    .filter(t => t.status === 'planned' || t.status === 'in-progress')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (incomplete) {
    return {
      headline: `להשלים תוכנית טיפול: ${CATEGORY_HE[incomplete.category]}`,
      reason: `נקבע/ה ל${CATEGORY_HE[incomplete.category]} ב-${fmtDate(incomplete.date)} — הטיפול טרם הושלם.`,
      suggestedCategory: incomplete.category,
      draftMessage: `היי ${firstName}, זו המרפאה — שמנו לב שתוכנית הטיפול (${CATEGORY_HE[incomplete.category]}) עדיין לא הושלמה. נשמח לתאם המשך, מתי נוח לך?`,
    };
  }

  // 2) Recall-interval elapsed — treatment whose recurring window has passed
  const overdue = patient.treatments
    .filter(t => t.status === 'completed' && RECALL_MONTHS[t.category] != null)
    .map(t => ({ t, elapsed: monthsSince(t.date, now), due: RECALL_MONTHS[t.category] as number }))
    .filter(x => x.elapsed >= x.due)
    .sort((a, b) => (b.elapsed - b.due) - (a.elapsed - a.due))[0];
  if (overdue) {
    const monthsOverdue = overdue.elapsed - overdue.due;
    return {
      headline: `הגיע הזמן ל${CATEGORY_HE[overdue.t.category]}`,
      reason: monthsOverdue > 0
        ? `${overdue.elapsed} חודשים מאז ${CATEGORY_HE[overdue.t.category]} האחרון — ${monthsOverdue} חודשים באיחור.`
        : `${overdue.elapsed} חודשים מאז ${CATEGORY_HE[overdue.t.category]} האחרון — בדיוק בזמן לחזור.`,
      suggestedCategory: overdue.t.category,
      draftMessage: `היי ${firstName}, זו המרפאה 🙂 עברו כבר ${overdue.elapsed} חודשים מאז ${CATEGORY_HE[overdue.t.category]} האחרון שלך. רוצה שנקבע תור לחזרה?`,
    };
  }

  // 3) Longest-overdue routine visit in general (no specific recall category matched)
  const lastVisitMonths = monthsSince(patient.lastVisit, now);
  if (lastVisitMonths >= 6) {
    return {
      headline: `לא ראינו אותך כבר ${lastVisitMonths} חודשים`,
      reason: `הביקור האחרון היה ב-${fmtDate(patient.lastVisit)}.`,
      suggestedCategory: clinicType === 'dental' ? 'checkup' : 'consultation',
      draftMessage: `היי ${firstName}, מתגעגעים! עברו כ-${lastVisitMonths} חודשים מהביקור האחרון שלך אצלנו. בואי/בוא לבדיקה קצרה — נשמח לראות אותך.`,
    };
  }

  // 4) Generic check-in — recently seen, everything up to date
  return {
    headline: 'הכל מעודכן',
    reason: `הביקור האחרון היה ב-${fmtDate(patient.lastVisit)} — אין פעולה נדרשת כרגע.`,
    suggestedCategory: '',
    draftMessage: `היי ${firstName}, רק רצינו לוודא שהכל בסדר אחרי הביקור האחרון. תמיד כאן בשבילך 🙂`,
  };
}

export function treatmentTotal(treatments: TreatmentRecord[]): number {
  return treatments.reduce((sum, t) => sum + t.cost, 0);
}
