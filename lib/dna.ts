import type { Candidate, VenueType } from './types';

export interface DnaProfile {
  score: number;
  reliability: number;
  responseSpeed: number;
  recency: number;
  churnRisk: 'low' | 'medium' | 'high';
  tags: string[];
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

  return { score, reliability, responseSpeed, recency, churnRisk, tags: tags.slice(0, 4) };
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
