import type { Clinic, Patient, OutreachKind, TreatmentRecord } from './types';
import { CATEGORY_HE, daysSince } from './clinical';

export interface CheckinDraft {
  patientId: string;
  kind: OutreachKind;
  relatedTreatmentId?: string;
  message: string;
  reason: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Per-category check-in windows (days after treatment) — device comfort, healing, satisfaction. */
const CHECKIN_WINDOWS: Partial<Record<TreatmentRecord['category'], number[]>> = {
  'night-guard': [21, 120, 210],
  implant: [7, 30],
  whitening: [7],
  orthodontics: [30, 120],
  botox: [14],
  filler: [14],
  laser: [7],
  peeling: [5],
};

const WINDOW_TOLERANCE_DAYS = 4;
const DORMANT_MONTHS_DAYS = 240; // ~8 months with no contact → routine wellbeing check

function senderName(clinic: Clinic) {
  return clinic.operatorName.split(' ')[0] || 'הצוות';
}

/** Returns the personalized, treatment-specific quality-checks due for this patient today. */
export function checkinsDue(patient: Patient, clinic: Clinic): CheckinDraft[] {
  const now = today();
  const firstName = patient.name.split(' ')[0];
  const sender = senderName(clinic);
  const drafts: CheckinDraft[] = [];

  for (const t of patient.treatments) {
    if (t.status !== 'completed') continue;
    const windows = CHECKIN_WINDOWS[t.category];
    if (!windows) continue;
    const elapsed = daysSince(t.date, now);
    for (const w of windows) {
      if (Math.abs(elapsed - w) <= WINDOW_TOLERANCE_DAYS) {
        drafts.push(buildTreatmentCheckin(firstName, sender, t));
      }
    }
  }

  // Long-dormant patient with no treatment-specific check-in due → generic wellbeing
  if (drafts.length === 0 && daysSince(patient.lastVisit, now) >= DORMANT_MONTHS_DAYS) {
    drafts.push({
      patientId: patient.id,
      kind: 'wellbeing',
      message: `היי ${firstName}, זה ${sender} מ${clinic.name} — רק רוצים לבדוק מה שלומך, לא התראנו כבר תקופה. הכל בסדר?`,
      reason: `לא בוצע ביקור/פנייה מזה זמן רב`,
    });
  }

  return drafts.map(d => ({ ...d, patientId: patient.id }));
}

function buildTreatmentCheckin(firstName: string, sender: string, t: TreatmentRecord): CheckinDraft {
  const cat = CATEGORY_HE[t.category];
  const isEarly = daysSince(t.date, today()) < 30;
  const templates: Partial<Record<TreatmentRecord['category'], string>> = {
    'night-guard': isEarly
      ? `היי ${firstName}, זה ${sender} מהמרפאה — הסד לילה נוח לך? יש נקודות לחץ או אי-נוחות?`
      : `היי ${firstName}, זה ${sender} — עדכון קצר: הסד לילה עדיין מתאים טוב? לפעמים כדאי לבדוק התאמה מחדש.`,
    implant: isEarly
      ? `היי ${firstName}, זה ${sender} מהמרפאה — איך ההחלמה אחרי השתל? יש כאב או נפיחות?`
      : `היי ${firstName}, זה ${sender} — חודש אחרי השתל, רצינו לוודא שהכל מחלים כמו שצריך.`,
    whitening: `היי ${firstName}, זה ${sender} — איך התוצאה של הלבנת השיניים? מרוצה מהצבע?`,
    orthodontics: `היי ${firstName}, זה ${sender} — איך מתקדם יישור השיניים? הכל נוח ולפי התוכנית?`,
    botox: `היי ${firstName}, זה ${sender} — עברו כשבועיים מהבוטוקס, איך התוצאה נראית לך?`,
    filler: `היי ${firstName}, זה ${sender} — איך מרגישה עם המילוי? התוצאה נראית טבעית וכמו שרצית?`,
    laser: `היי ${firstName}, זה ${sender} — איך העור מגיב לטיפול הלייזר?`,
    peeling: `היי ${firstName}, זה ${sender} — איך העור מרגיש אחרי הפילינג?`,
  };
  return {
    patientId: '',
    kind: 'quality_check',
    relatedTreatmentId: t.id,
    message: templates[t.category] ?? `היי ${firstName}, זה ${sender} — רצינו לבדוק איך את/ה מרגיש/ה אחרי ${cat}.`,
    reason: `${cat} לפני ${daysSince(t.date, today())} ימים`,
  };
}
