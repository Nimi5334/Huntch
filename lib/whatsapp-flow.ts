/**
 * DNA Feeder — WhatsApp conversation state machine.
 * SERVER-ONLY — import only from API routes.
 *
 * Flow:
 *   Phase 1 (required, ~2 min): logistics — roles, hours, shifts, start, transport, distance, wage
 *   Phase 2 (required, ~2 min): retention fit — needs-supplies fit, schedule tolerance, notes
 *   Phase 3 (optional, ~3 min): performance — experience, past workplaces, 2 scored behavioral Qs
 *
 * session.step = the question that was SENT and whose reply we are awaiting.
 */

import { sendText, sendButtons } from './whatsapp-client';
import { sessions, interviewResults, type WaSession, type FlowStep } from './whatsapp-session';
import { computeDnaColdStart } from './dna';
import type { DnaFeederAnswers } from './types';

// ─── Data maps ────────────────────────────────────────────────────────────────

const ROLE_MAP: Record<number, string> = {
  1: 'barista', 2: 'server', 3: 'cook', 4: 'bartender',
  5: 'cashier', 6: 'host', 7: 'delivery', 8: 'dishwasher',
};

const SHIFT_MAP: Record<number, string> = {
  1: 'morning', 2: 'afternoon', 3: 'evening', 4: 'night', 5: 'weekend',
};

const NEEDS_MAP: Record<number, string> = {
  1: 'steady_income',      2: 'flexible_hours',      3: 'predictable_schedule',
  4: 'good_team',          5: 'close_to_home',        6: 'growth',
  7: 'fast_pace',          8: 'calm_pace',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNumList(
  input: string,
  map: Record<number, string>,
  maxPick = 8
): string[] | null {
  const parts = input.trim().split(/[,،\s]+/);
  const max = Math.max(...Object.keys(map).map(Number));
  const nums: number[] = [];
  for (const p of parts) {
    const n = parseInt(p.trim(), 10);
    if (isNaN(n) || n < 1 || n > max) return null;
    nums.push(n);
  }
  if (nums.length === 0) return null;
  return [...new Set(nums)].slice(0, maxPick).map(n => map[n]);
}

/**
 * Keyword-based rubric scorer for open-text behavioral questions.
 * Returns 0 | 1 | 2.
 * TODO: replace with a lightweight LLM call once Huntch has an AI budget.
 */
function scoreServiceHandling(text: string): 0 | 1 | 2 {
  if (!text || text.trim().length < 15) return 0;
  const empathy  = ['התנצלתי', 'סליחה', 'הבנתי', 'הקשבתי', 'הרגשתי', 'לקחתי אחריות'];
  const solution = ['פתרתי', 'הצעתי', 'הוצאתי', 'סידרתי', 'עזרתי', 'הרגעתי'];
  const hasE = empathy.some(w => text.includes(w));
  const hasS = solution.some(w => text.includes(w));
  if (hasE && hasS) return 2;
  if (hasE || hasS || text.length > 80) return 1;
  return 0;
}

function scoreOwnership(text: string): 0 | 1 | 2 {
  if (!text || text.trim().length < 15) return 0;
  const strong = ['גאה', 'הצלחתי', 'למדתי', 'שיפרתי', 'התמודדתי', 'פתרתי', 'הגעתי לתוצאה'];
  const weak   = ['עשיתי', 'עבדתי', 'עזרתי', 'ניסיתי', 'הייתי'];
  if (strong.some(w => text.includes(w)) && text.length > 50) return 2;
  if (weak.some(w => text.includes(w)) || text.length > 80) return 1;
  return 0;
}

// ─── Per-step question senders ────────────────────────────────────────────────

async function sendQ1(to: string): Promise<void> {
  await sendText(to,
    `1️⃣ *אילו תפקידים מעניינים אותך?*\n\nשלח/י את המספרים מופרדים בפסיק:\n\n1. בריסטה\n2. מלצר/ית\n3. טבח/ית\n4. ברמן/ית\n5. קופאי/ת\n6. מארח/ת\n7. שליח/ה\n8. שטיפה\n\n_לדוגמה: 1,3_`
  );
}

async function sendQ2(to: string): Promise<void> {
  await sendButtons(to, '2️⃣ כמה שעות בשבוע את/ה מחפש/ת?', [
    { id: 'hours_lt20',  title: 'עד 20 שעות' },
    { id: 'hours_20_30', title: '20–30 שעות' },
    { id: 'hours_30plus', title: '30+ שעות' },
  ]);
}

async function sendQ3(to: string): Promise<void> {
  await sendText(to,
    `3️⃣ *אילו משמרות מתאימות לך?*\n\nשלח/י מספרים מופרדים בפסיק:\n\n1. בקרים\n2. צהריים\n3. ערבים\n4. לילות\n5. סופ״ש\n\n_לדוגמה: 1,3_`
  );
}

async function sendQ4(to: string): Promise<void> {
  await sendButtons(to, '4️⃣ מתי תוכל/י להתחיל לעבוד?', [
    { id: 'start_immediate',  title: 'מיידית' },
    { id: 'start_two_weeks',  title: 'תוך שבועיים' },
    { id: 'start_one_month',  title: 'תוך חודש' },
  ]);
}

async function sendQ5(to: string): Promise<void> {
  await sendButtons(to, '5️⃣ איך תגיע/י לעבודה?', [
    { id: 'transport_car',    title: 'רכב' },
    { id: 'transport_public', title: 'תח"צ' },
    { id: 'transport_walk',   title: 'רגל/אופניים' },
  ]);
}

async function sendQ6(to: string): Promise<void> {
  await sendButtons(to, '6️⃣ עד כמה רחוק מהבית תסע/י לעבודה?', [
    { id: 'dist_5',     title: 'עד 5 ק"מ' },
    { id: 'dist_10',    title: 'עד 10 ק"מ' },
    { id: 'dist_15plus', title: '15+ ק"מ' },
  ]);
}

async function sendQ7(to: string): Promise<void> {
  await sendButtons(to, '7️⃣ שכר מבוקש לשעה?', [
    { id: 'wage_lt40',  title: 'עד 40 ₪' },
    { id: 'wage_40_55', title: '40–55 ₪' },
    { id: 'wage_55plus', title: '55+ ₪' },
  ]);
}

async function sendQ8(to: string): Promise<void> {
  await sendText(to,
    `8️⃣ *מה הכי חשוב לך בעבודה הבאה?* (בחר/י עד 3)\n\n1. הכנסה יציבה וצפויה\n2. שעות גמישות\n3. סידור עבודה קבוע ומוכר מראש\n4. צוות ומנהל טובים\n5. קרוב לבית\n6. למידה והתקדמות\n7. קצב מהיר ועמוס\n8. קצב רגוע ונעים\n\n_לדוגמה: 1,4_`
  );
}

async function sendQ9(to: string): Promise<void> {
  await sendButtons(to, '9️⃣ כמה חשוב לך שהסידור יהיה קבוע וידוע מראש?', [
    { id: 'sched_very',     title: 'מאוד חשוב' },
    { id: 'sched_nice',     title: 'נחמד שיהיה' },
    { id: 'sched_flexible', title: 'גמיש/ה לגמרי' },
  ]);
}

async function sendQ10(to: string): Promise<void> {
  await sendText(to,
    '🔟 יש משהו נוסף שחשוב לך במקום עבודה?\n_(אופציונלי — שלח/י "דלג" לדלג)_'
  );
}

async function sendP3Offer(to: string): Promise<void> {
  await sendButtons(to,
    '🎉 *כמעט סיימנו!*\nכמה שאלות קצרות נוספות שיעזרו לנו למצוא לך הצעות טובות יותר — לגמרי אופציונלי.',
    [
      { id: 'p3_yes', title: 'כן, בואנו!' },
      { id: 'p3_no',  title: 'לא, תודה' },
    ]
  );
}

async function sendQ11(to: string): Promise<void> {
  await sendButtons(to, 'כמה ניסיון יש לך בתחום?', [
    { id: 'exp_none', title: 'אין / מעט' },
    { id: 'exp_1_3',  title: '1–3 שנים' },
    { id: 'exp_4plus', title: '4+ שנים' },
  ]);
}

async function sendQ12(to: string): Promise<void> {
  await sendText(to,
    'איפה עבדת בעבר? (שמות מקומות, אופציונלי)\n_(שלח/י "דלג" לדלג)_'
  );
}

async function sendQ13(to: string): Promise<void> {
  await sendText(to,
    '⭐ *ערב עמוס, לקוח כועס על המתנה ארוכה — מה תעשה/י?*\n\n_(כתוב/י בחופשיות, אין תשובה נכונה ✨)_'
  );
}

async function sendQ14(to: string): Promise<void> {
  await sendText(to,
    '💪 *ספר/י על משמרת שאת/ה גאה באיך שהתמודדת*'
  );
}

async function sendComplete(to: string, name: string): Promise<void> {
  const first = name.split(' ')[0];
  await sendText(to,
    `🌟 *תודה רבה ${first}!*\n\nהפרופיל שלך מוכן — נתחיל לשלוח לך הצעות עבודה מתאימות בקרוב.\n\nאם תרצה/י לעדכן פרטים בעתיד, פשוט שלח/י "עדכון" 📝`
  );
}

// ─── Finalize: compute cold-start DNA and store result ───────────────────────

function finalizeSession(session: WaSession): void {
  const phases = (session.phasesCompleted || 1) as 1 | 2 | 3;
  const dna    = computeDnaColdStart(session.answers, phases);

  const fits        = session.answers.needsSuppliesFit ?? [];
  const needsScore  = fits.length >= 3 ? 85 : fits.length >= 2 ? 70 : fits.length >= 1 ? 55 : 50;
  const schedScore  = session.answers.scheduleTolerance === 'very' ? 80
                    : session.answers.scheduleTolerance === 'flexible' ? 75 : 65;
  const retentionFit = Math.round((needsScore + schedScore) / 2);
  const performance  = Math.round(
    ((session.answers.serviceHandlingScore ?? 0) * 50 + (session.answers.ownershipScore ?? 0) * 50) / 2
  );

  interviewResults.set(session.candidateId, {
    candidateId:      session.candidateId,
    completedAt:      new Date().toISOString(),
    phasesCompleted:  phases,
    answers:          { ...session.answers },
    dna: {
      score:         dna.score,
      confidence:    dna.confidence,
      retentionFit,
      performance,
      churnRisk:     dna.churnRisk,
    },
  });
}

// ─── Core step handler ────────────────────────────────────────────────────────

async function processStep(session: WaSession, input: string): Promise<FlowStep> {
  const { step, phone } = session;
  const skip = input.trim() === 'דלג';

  switch (step) {
    // ── Phase 1 ─────────────────────────────────────────────────────────────

    case 'q1_roles': {
      const roles = parseNumList(input, ROLE_MAP);
      if (!roles) {
        await sendText(phone, '⚠️ שלח/י מספרים מהרשימה, לדוגמה: 1,3');
        return step;
      }
      session.answers.roles = roles;
      await sendQ2(phone);
      return 'q2_hours';
    }

    case 'q2_hours': {
      const map: Record<string, string> = { hours_lt20: '<20', hours_20_30: '20-30', hours_30plus: '30+' };
      session.answers.hoursPerWeek = map[input] ?? '20-30';
      await sendQ3(phone);
      return 'q3_shifts';
    }

    case 'q3_shifts': {
      const shifts = parseNumList(input, SHIFT_MAP);
      if (!shifts) {
        await sendText(phone, '⚠️ שלח/י מספרים מהרשימה, לדוגמה: 1,3');
        return step;
      }
      session.answers.shifts = shifts;
      await sendQ4(phone);
      return 'q4_start';
    }

    case 'q4_start': {
      const map: Record<string, DnaFeederAnswers['start']> = {
        start_immediate: 'immediate', start_two_weeks: 'two_weeks', start_one_month: 'one_month',
      };
      session.answers.start = map[input] ?? 'two_weeks';
      await sendQ5(phone);
      return 'q5_transport';
    }

    case 'q5_transport': {
      const map: Record<string, DnaFeederAnswers['transport']> = {
        transport_car: 'car', transport_public: 'public', transport_walk: 'walk',
      };
      session.answers.transport = map[input] ?? 'public';
      await sendQ6(phone);
      return 'q6_distance';
    }

    case 'q6_distance': {
      const map: Record<string, number> = { dist_5: 5, dist_10: 10, dist_15plus: 15 };
      session.answers.distanceKm = map[input] ?? 10;
      await sendQ7(phone);
      return 'q7_wage';
    }

    case 'q7_wage': {
      const map: Record<string, number> = { wage_lt40: 38, wage_40_55: 47, wage_55plus: 58 };
      session.answers.wageNis   = map[input] ?? 47;
      session.phasesCompleted    = 1;
      await sendText(phone, '🙌 *מעולה!* עכשיו שאלה שחשובה לנו מאוד —');
      await sendQ8(phone);
      return 'q8_needs';
    }

    // ── Phase 2 ─────────────────────────────────────────────────────────────

    case 'q8_needs': {
      const needs = parseNumList(input, NEEDS_MAP, 3);
      if (!needs) {
        await sendText(phone, '⚠️ שלח/י עד 3 מספרים מהרשימה, לדוגמה: 1,4');
        return step;
      }
      session.answers.needsSuppliesFit = needs;
      await sendQ9(phone);
      return 'q9_schedule';
    }

    case 'q9_schedule': {
      const map: Record<string, DnaFeederAnswers['scheduleTolerance']> = {
        sched_very: 'very', sched_nice: 'nice', sched_flexible: 'flexible',
      };
      session.answers.scheduleTolerance = map[input] ?? 'nice';
      await sendQ10(phone);
      return 'q10_notes';
    }

    case 'q10_notes': {
      if (!skip) session.answers.needsNotes = input.trim().slice(0, 200);
      session.phasesCompleted = 2;
      await sendP3Offer(phone);
      return 'p3_offer';
    }

    // ── Phase 3 gate ─────────────────────────────────────────────────────────

    case 'p3_offer': {
      if (input === 'p3_yes') {
        await sendQ11(phone);
        return 'q11_experience';
      }
      // Declined — finalize with Phase 2 data
      finalizeSession(session);
      await sendComplete(phone, session.candidateName);
      return 'complete';
    }

    // ── Phase 3 ─────────────────────────────────────────────────────────────

    case 'q11_experience': {
      const map: Record<string, number> = { exp_none: 0, exp_1_3: 2, exp_4plus: 5 };
      session.answers.experienceYears = map[input] ?? 1;
      await sendQ12(phone);
      return 'q12_workplaces';
    }

    case 'q12_workplaces': {
      if (!skip) session.answers.notableWorkplaces = input.trim().slice(0, 150);
      await sendQ13(phone);
      return 'q13_service';
    }

    case 'q13_service': {
      const text = input.trim().slice(0, 500);
      session.answers.serviceHandling      = text;
      session.answers.serviceHandlingScore = scoreServiceHandling(text);
      await sendQ14(phone);
      return 'q14_ownership';
    }

    case 'q14_ownership': {
      const text = input.trim().slice(0, 500);
      session.answers.ownership      = text;
      session.answers.ownershipScore = scoreOwnership(text);
      session.phasesCompleted         = 3;
      finalizeSession(session);
      await sendComplete(phone, session.candidateName);
      return 'complete';
    }

    default:
      return 'complete';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface StartSessionOpts {
  candidateId: string;
  businessId: string;
  businessName: string;
  candidateName: string;
  /** Normalized WA phone: 972XXXXXXXXX */
  phone: string;
  formCompletionSec?: number;
}

/** Called by /api/whatsapp/trigger when a candidate completes the QR join form. */
export async function startSession(opts: StartSessionOpts): Promise<void> {
  const session: WaSession = {
    ...opts,
    step:             'q1_roles',
    answers:          {},
    phasesCompleted:  0,
    startedAt:        Date.now(),
    lastActivityAt:   Date.now(),
  };
  sessions.set(opts.phone, session);

  const first = opts.candidateName.split(' ')[0];
  await sendText(
    opts.phone,
    `שלום ${first}! 👋 אני Huntch — נעשה היכרות קצרה (כ-5 דקות) כדי שנוכל לשלוח לך הצעות עבודה מתאימות ישירות לוואטסאפ. בואנו נתחיל! 🚀`
  );
  await sendQ1(opts.phone);
}

/** Called by /api/whatsapp (webhook) on every incoming message. */
export async function handleIncoming(phone: string, rawInput: string): Promise<void> {
  const session = sessions.get(phone);
  if (!session || session.step === 'complete') return;

  const now = Date.now();

  // Record first-reply latency as a passive confidence signal
  if (!session.firstReplyLatencySec) {
    session.firstReplyLatencySec = Math.round((now - session.startedAt) / 1000);
  }

  const newStep = await processStep(session, rawInput.trim());
  session.step           = newStep;
  session.lastActivityAt = now;
}
