import type { Candidate, VenueType, DnaFeederAnswers } from './types';

export interface DnaProfile {
  score: number;
  reliability: number;
  responseSpeed: number;
  recency: number;
  churnRisk: 'low' | 'medium' | 'high';
  tags: string[];
  /** 0–1 confidence: 1 = full platform history, <1 = cold-start intake data */
  confidence: number;
  source: 'platform' | 'cold_start';
}

const VENUE_TAGS: Partial<Record<VenueType, string>> = {
  cafe: 'מתאים לקפה',
  restaurant: 'מתאים למסעדה',
  bar: 'מתאים לבר',
  hotel: 'מתאים למלון',
};

export function computeDna(c: Candidate): DnaProfile {
  const { signals } = c;

  const reliability = signals.applicationCount > 0
    ? Math.min(100, Math.round((signals.priorHires / signals.applicationCount) * 150))
    : 50;

  const responseSpeed = Math.max(0, Math.round(100 - signals.responseSpeedHours * 9));

  const recency = Math.max(0, Math.round(100 - signals.lastActiveDaysAgo * 7));

  const score = Math.round(reliability * 0.40 + responseSpeed * 0.30 + recency * 0.30);

  let churnRisk: 'low' | 'medium' | 'high';
  if (signals.lastActiveDaysAgo > 11 || signals.responseSpeedHours > 9) churnRisk = 'high';
  else if (signals.lastActiveDaysAgo > 5 || signals.responseSpeedHours > 4) churnRisk = 'medium';
  else churnRisk = 'low';

  const tags: string[] = [];
  c.experience.venueTypes.slice(0, 2).forEach(v => { if (VENUE_TAGS[v]) tags.push(VENUE_TAGS[v]!); });
  if (c.availability.shifts.includes('morning') && c.availability.shifts.includes('afternoon')) tags.push('משמרות בוקר');
  if (c.availability.shifts.includes('evening') || c.availability.shifts.includes('night')) tags.push('משמרות ערב');
  if (c.availability.shifts.includes('weekend')) tags.push('זמין בסופ״ש');
  if (c.availability.immediate) tags.push('זמין מיידית');
  if (c.hasCar) tags.push('יש רכב');
  if (c.experience.totalYears >= 4) tags.push(`${c.experience.totalYears}+ שנות ניסיון`);

  return { score, reliability, responseSpeed, recency, churnRisk, tags: tags.slice(0, 4), confidence: 1, source: 'platform' };
}

// ─── Cold-start DNA ────────────────────────────────────────────────────────────
// Used when a candidate has zero platform history (fresh QR scan).
// Score is based entirely on content features from the DNA Feeder mini-interview.
// Empirical-Bayes principle: zero history → population mean, NOT zero.
// Research basis: Sackett et al. 2022 (structured Qs ~.42), Schmidt & Oh 2016
// (experience ~.16 caps at 5yr), Choper/ILR 2022 (schedule fit ~50% turnover delta).

export function computeDnaColdStart(
  answers: DnaFeederAnswers,
  phasesCompleted: 1 | 2 | 3
): DnaProfile {
  const expYears = answers.experienceYears ?? 0;
  // Nonlinear experience: caps at 5yr (Schmidt & Oh 2016)
  const expScore =
    expYears >= 5 ? 80 : expYears >= 4 ? 75 : expYears >= 3 ? 60
    : expYears >= 2 ? 45 : expYears >= 1 ? 30 : 0;

  // ── Phase 1: logistics ─────────────────────────────────────────────────────
  const shiftsCount = answers.shifts?.length ?? 1;
  const shiftScore  = Math.min(100, shiftsCount * 20 + 40);
  const wageNis     = answers.wageNis ?? 47;
  const wageScore   = wageNis <= 40 ? 80 : wageNis <= 55 ? 70 : 50;
  const distKm      = answers.distanceKm ?? 10;
  const distScore   = distKm <= 5 ? 90 : distKm <= 10 ? 75 : 55;
  const logisticsFit = Math.round((shiftScore + wageScore + distScore) / 3);

  // ── Phase 2: retention fit (highest-yield addition — β=−.58 for turnover) ─
  const fits          = answers.needsSuppliesFit ?? [];
  const needsFitScore = fits.length >= 3 ? 85 : fits.length >= 2 ? 70 : fits.length >= 1 ? 55 : 50;
  const sched         = answers.scheduleTolerance;
  const schedScore    = sched === 'very' ? 80 : sched === 'flexible' ? 75 : 65;
  const retentionFit  = Math.round((needsFitScore + schedScore) / 2);

  // ── Phase 3: structured performance questions (~.42 validity) ─────────────
  const s1          = (answers.serviceHandlingScore ?? 0) * 50;
  const s2          = (answers.ownershipScore ?? 0) * 50;
  const performance = Math.round((s1 + s2) / 2);

  // ── Weighted score by phases completed ────────────────────────────────────
  let score: number;
  if (phasesCompleted >= 3) {
    score = Math.round(retentionFit * 0.40 + performance * 0.30 + logisticsFit * 0.15 + expScore * 0.15);
  } else if (phasesCompleted === 2) {
    score = Math.round(retentionFit * 0.45 + logisticsFit * 0.35 + expScore * 0.20);
  } else {
    score = Math.round(logisticsFit * 0.65 + expScore * 0.35);
  }

  // ── Churn risk ────────────────────────────────────────────────────────────
  let churnRisk: 'low' | 'medium' | 'high';
  if (phasesCompleted < 2) {
    churnRisk = 'medium'; // not enough data
  } else if (sched === 'flexible' || (sched === 'very' && fits.includes('predictable_schedule'))) {
    churnRisk = 'low';
  } else {
    churnRisk = 'medium';
  }

  // ── Reliability: empirical-Bayes at population mean (0 history → mean, not 0) ─
  const reliability   = 65; // TODO: calibrate from real Huntch hire data
  const responseSpeed = 70; // neutral prior
  const recency       = 100; // just joined today

  // ── Confidence band ───────────────────────────────────────────────────────
  const confidence = phasesCompleted >= 3 ? 0.90 : phasesCompleted === 2 ? 0.60 : 0.30;

  // ── Tags from answers ─────────────────────────────────────────────────────
  const tags: string[] = [];
  if (answers.roles?.includes('barista'))   tags.push('מתאים לקפה');
  if (answers.roles?.includes('server'))    tags.push('מתאים למסעדה');
  if (answers.shifts?.includes('morning'))  tags.push('משמרות בוקר');
  if (answers.shifts?.includes('evening') || answers.shifts?.includes('night')) tags.push('משמרות ערב');
  if (answers.shifts?.includes('weekend')) tags.push('זמין בסופ"ש');
  if (answers.start === 'immediate')        tags.push('זמין מיידית');
  if (answers.transport === 'car')          tags.push('יש רכב');
  if (expYears >= 4) tags.push(`${expYears}+ שנות ניסיון`);

  return { score, reliability, responseSpeed, recency, churnRisk, tags: tags.slice(0, 4), confidence, source: 'cold_start' };
}

export function dnaLabel(score: number): string {
  if (score >= 80) return 'מצוין';
  if (score >= 60) return 'טוב';
  if (score >= 40) return 'בינוני';
  return 'נמוך';
}

export function churnLabel(risk: DnaProfile['churnRisk']): string {
  if (risk === 'high') return 'סיכון גבוה';
  if (risk === 'medium') return 'סיכון בינוני';
  return 'יציב';
}
