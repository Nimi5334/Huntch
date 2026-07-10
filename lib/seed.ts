import type { Clinic, Patient, Outreach, Escalation, TreatmentRecord, Payment } from './types';

const C: Record<string, string> = {
  c0: 'oklch(0.63 0.18 38)',
  c1: 'oklch(0.55 0.14 160)',
  c2: 'oklch(0.52 0.17 295)',
  c3: 'oklch(0.60 0.15 52)',
  c4: 'oklch(0.54 0.14 22)',
  c5: 'oklch(0.50 0.16 330)',
  c6: 'oklch(0.58 0.17 200)',
  c7: 'oklch(0.56 0.15 80)',
  c8: 'oklch(0.53 0.16 260)',
  c9: 'oklch(0.61 0.14 140)',
};

export const DEMO_CLINIC: Clinic = {
  id: 'clinic-1',
  name: 'מרפאת שיניים ד"ר ירון כהן',
  type: 'dental',
  address: 'רחוב אבן גבירול 88, תל אביב',
  operatorName: 'ירון כהן',
  phone: '0500000000',
  email: 'demo@huntch.co.il',
  password: '533433',
  plan: 'advanced', // demo clinic is already a paying Advanced customer, not mid-trial
  knowledge: {
    hours: 'א׳-ה׳ 9:00-19:00, ו׳ 9:00-13:00',
    doctors: 'ד"ר ירון כהן (מנהל), ד"ר מיכל אבני (יישור שיניים)',
    services: 'בדיקות וניקוי, סתימות, שורש, כתרים, שתלים, יישור שיניים, הלבנה',
    pricingNotes: 'בדיקה + ניקוי: 350₪. הלבנה: 1200₪. לפרטי מחיר מדויקים יש לתאם ייעוץ.',
    insurance: 'עובדים מול כללית שיא ומכבי שלי — מומלץ לבדוק זכאות מראש',
    policies: 'ביטול תור יש לבצע 24 שעות מראש, אחרת עלול לחול חיוב',
    faqs: [
      { id: 'faq-1', question: 'מה שעות הפעילות שלכם?', answer: 'אנחנו פתוחים א׳-ה׳ 9:00-19:00 ובימי ו׳ 9:00-13:00.' },
      { id: 'faq-2', question: 'האם אתם עובדים עם ביטוח שיניים?', answer: 'כן, אנחנו עובדים מול כללית שיא ומכבי שלי. מומלץ לבדוק את גובה ההשתתפות מראש.' },
      { id: 'faq-3', question: 'כמה עולה ניקוי אבנית?', answer: 'בדיקה + ניקוי אבנית עולים 350₪ במחיר מלא, ולעיתים מכוסה חלקית בביטוח.' },
    ],
    voiceExamples: [
      { id: 'v-1', patientMsg: 'היי, אפשר לדעת מתי התור הבא שלי?', approvedReply: 'היי! בשמחה — אני בודק ומחזיר לך תשובה תוך כמה דקות 🙂' },
    ],
  },
};

function mk(id: string, category: TreatmentRecord['category'], date: string, name: string, cost: number, status: TreatmentRecord['status'] = 'completed', notes?: string): TreatmentRecord {
  return { id, category, date, name, cost, status, notes, provider: 'ד"ר ירון כהן' };
}
function pay(id: string, date: string, amount: number, method: Payment['method'] = 'card', treatmentId?: string): Payment {
  return { id, date, amount, method, treatmentId };
}

export const SEED_PATIENTS: Patient[] = [
  {
    id: 'p-1', clinicId: 'clinic-1', name: 'נועה לוי', phone: '0521234561', initials: 'נל', avatarColor: C.c0,
    age: 34, gender: 'f', firstVisit: '2023-02-10', lastVisit: '2025-01-15',
    treatments: [mk('t-1', 'cleaning', '2025-01-15', 'ניקוי אבנית + בדיקה', 350)],
    payments: [pay('pay-1', '2025-01-15', 350)],
    medicalNotes: 'רגישה לחומרי הרדמה מסוימים — יש לבדוק לפני טיפול פולשני.',
    consent: true, addedAt: '2023-02-10', insights: [],
  },
  {
    id: 'p-2', clinicId: 'clinic-1', name: 'איתי כהן', phone: '0521234562', initials: 'אכ', avatarColor: C.c1,
    age: 41, gender: 'm', firstVisit: '2022-05-01', lastVisit: '2026-05-20',
    treatments: [
      mk('t-2a', 'orthodontics', '2025-11-01', 'יישור שיניים — שלב 3', 2400, 'completed'),
      mk('t-2b', 'orthodontics', '2026-06-01', 'יישור שיניים — שלב 4', 2400, 'planned'),
    ],
    payments: [pay('pay-2', '2025-11-01', 2000)],
    consent: true, addedAt: '2022-05-01', insights: [],
  },
  {
    id: 'p-3', clinicId: 'clinic-1', name: 'דריה מיכאלוב', phone: '0521234563', initials: 'דמ', avatarColor: C.c2,
    age: 29, gender: 'f', firstVisit: '2024-01-05', lastVisit: '2025-09-10',
    treatments: [
      mk('t-3a', 'root-canal', '2025-09-10', 'טיפול שורש #16', 1800),
      mk('t-3b', 'crown', '2025-09-10', 'כתר חרסינה', 1600),
    ],
    payments: [pay('pay-3a', '2025-09-10', 1000)],
    consent: true, addedAt: '2024-01-05', insights: [],
  },
  {
    id: 'p-4', clinicId: 'clinic-1', name: 'יוסף אבוטבול', phone: '0521234564', initials: 'יא', avatarColor: C.c3,
    age: 55, gender: 'm', firstVisit: '2021-03-11', lastVisit: '2026-06-25',
    treatments: [mk('t-4', 'checkup', '2026-06-25', 'בדיקה שגרתית', 250)],
    payments: [pay('pay-4', '2026-06-25', 250)],
    consent: true, addedAt: '2021-03-11', insights: ['אמר שהוא מרוצה מהטיפול האחרון, ציין שיחזור בעוד חצי שנה'],
  },
  {
    id: 'p-5', clinicId: 'clinic-1', name: 'שיר בן דוד', phone: '0521234565', initials: 'שב', avatarColor: C.c4,
    age: 22, gender: 'f', firstVisit: '2025-06-01', lastVisit: '2026-06-20',
    treatments: [mk('t-5', 'night-guard', '2026-06-20', 'התאמת סד לילה', 900)],
    payments: [pay('pay-5', '2026-06-20', 900)],
    consent: true, addedAt: '2025-06-01', insights: [],
  },
  {
    id: 'p-6', clinicId: 'clinic-1', name: 'מאיה גולן', phone: '0521234566', initials: 'מג', avatarColor: C.c5,
    age: 38, gender: 'f', firstVisit: '2020-01-15', lastVisit: '2024-08-01',
    treatments: [mk('t-6', 'whitening', '2024-08-01', 'הלבנת שיניים', 1200)],
    payments: [pay('pay-6', '2024-08-01', 1200)],
    consent: true, addedAt: '2020-01-15', insights: [],
  },
  {
    id: 'p-7', clinicId: 'clinic-1', name: 'אמיר חסן', phone: '0521234567', initials: 'אח', avatarColor: C.c6,
    age: 47, gender: 'm', firstVisit: '2019-11-20', lastVisit: '2026-05-01',
    treatments: [
      mk('t-7a', 'implant', '2026-05-01', 'שתל שן 24', 6500, 'completed'),
    ],
    payments: [pay('pay-7', '2026-05-01', 3000)],
    medicalNotes: 'סוכרת מאוזנת — לעקוב אחר החלמת השתל.',
    consent: true, addedAt: '2019-11-20', insights: [],
  },
  {
    id: 'p-8', clinicId: 'clinic-1', name: 'רינת שלום', phone: '0521234568', initials: 'רש', avatarColor: C.c7,
    age: 31, gender: 'f', firstVisit: '2023-09-01', lastVisit: '2025-03-01',
    treatments: [mk('t-8', 'cleaning', '2025-03-01', 'ניקוי אבנית + בדיקה', 350)],
    payments: [],
    consent: true, addedAt: '2023-09-01', insights: [],
  },
  {
    id: 'p-9', clinicId: 'clinic-1', name: 'ליאור שפירא', phone: '0521234569', initials: 'לש', avatarColor: C.c8,
    age: 26, gender: 'm', firstVisit: '2025-01-01', lastVisit: '2026-06-28',
    treatments: [mk('t-9', 'whitening', '2026-06-28', 'הלבנת שיניים', 1200)],
    payments: [pay('pay-9', '2026-06-28', 1200)],
    consent: true, addedAt: '2025-01-01', insights: [],
  },
  {
    id: 'p-10', clinicId: 'clinic-1', name: 'פאטמה עלי', phone: '0521234570', initials: 'פע', avatarColor: C.c9,
    age: 60, gender: 'f', firstVisit: '2018-04-01', lastVisit: '2024-11-01',
    treatments: [mk('t-10', 'crown', '2024-11-01', 'כתר חרסינה', 1600)],
    payments: [pay('pay-10', '2024-11-01', 800)],
    consent: true, addedAt: '2018-04-01', insights: [],
  },
  {
    id: 'p-11', clinicId: 'clinic-1', name: 'אנסטסיה פטרוב', phone: '0521234571', initials: 'אפ', avatarColor: C.c0,
    age: 33, gender: 'f', firstVisit: '2024-06-01', lastVisit: '2025-12-01',
    treatments: [mk('t-11', 'root-canal', '2025-12-01', 'טיפול שורש #26', 1800)],
    payments: [pay('pay-11', '2025-12-01', 1800)],
    consent: true, addedAt: '2024-06-01', insights: [],
  },
  {
    id: 'p-12', clinicId: 'clinic-1', name: 'כרמל דניאל', phone: '0521234572', initials: 'כד', avatarColor: C.c1,
    age: 19, gender: 'f', firstVisit: '2025-10-01', lastVisit: '2026-07-05',
    treatments: [mk('t-12', 'night-guard', '2026-06-15', 'התאמת סד לילה', 900)],
    payments: [pay('pay-12', '2026-06-15', 900)],
    consent: true, addedAt: '2025-10-01', optedOut: false, insights: [],
  },
];

export const SEED_OUTREACH: Outreach[] = [
  {
    id: 'out-1', clinicId: 'clinic-1', patientId: 'p-6', kind: 'reactivation', channel: 'whatsapp',
    status: 'replied', message: 'היי מאיה, זו המרפאה — עברו כמעט שנתיים מהביקור האחרון, בואי נקבע תור לבדיקה?',
    createdAt: '2026-06-01T09:00:00.000Z', sentAt: '2026-06-01T09:05:00.000Z', respondedAt: '2026-06-02T14:00:00.000Z',
    insight: 'שמחה לחזור, מבקשת תור בשעות אחה"צ בלבד',
  },
  {
    id: 'out-2', clinicId: 'clinic-1', patientId: 'p-10', kind: 'reactivation', channel: 'whatsapp',
    status: 'sent', message: 'היי פאטמה, זו המרפאה — עברו כשנה וחצי מהביקור האחרון, מתאים לחזור לבדיקה?',
    createdAt: '2026-07-08T09:00:00.000Z', sentAt: '2026-07-08T09:05:00.000Z',
  },
  {
    id: 'out-3', clinicId: 'clinic-1', patientId: 'p-8', kind: 'reactivation', channel: 'whatsapp',
    status: 'no_reply', message: 'היי רינת, זו המרפאה — עברו כמה חודשים טובים, בואי נקבע ניקוי אבנית הבא?',
    createdAt: '2026-06-20T09:00:00.000Z', sentAt: '2026-06-20T09:05:00.000Z',
  },
];

export const SEED_ESCALATIONS: Escalation[] = [
  {
    id: 'esc-1', clinicId: 'clinic-1', patientId: 'p-7', reason: 'medical_concern', status: 'pending',
    createdAt: '2026-07-09T11:20:00.000Z', snippet: 'יש לי כאב חזק וקצת דימום באזור השתל, זה נורמלי?',
  },
  {
    id: 'esc-2', clinicId: 'clinic-1', patientId: 'p-3', reason: 'reschedule', status: 'pending',
    createdAt: '2026-07-09T08:05:00.000Z', snippet: 'אני צריכה לדחות את התור של יום רביעי, אפשר לתאם ליום אחר?',
  },
  {
    id: 'esc-3', clinicId: 'clinic-1', patientId: 'p-2', reason: 'complaint', status: 'handled',
    createdAt: '2026-07-01T10:00:00.000Z', snippet: 'חיכיתי הרבה זמן בפעם האחרונה, לא הייתי מרוצה.',
  },
];
