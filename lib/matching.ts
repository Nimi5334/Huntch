import type { Candidate, Job, JobWeights, RankedCandidate, BadgeTier } from './types';

const DEFAULT_WEIGHTS: JobWeights = {
  availability: 0.30,
  distance: 0.25,
  roleExperience: 0.20,
  skills: 0.10,
  compensation: 0.10,
  recency: 0.05,
};

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function badgeTier(score: number): BadgeTier {
  if (score >= 85) return 'ex';
  if (score >= 70) return 'gd';
  return 'md';
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'בקרים',
  afternoon: 'צהריים',
  evening: 'ערבים',
  night: 'לילות',
  weekend: 'סופ״ש',
};

const ROLE_LABELS: Record<string, string> = {
  barista: 'בריסטה',
  server: 'מלצרות',
  cook: 'בישול',
  'line-cook': 'טבח קו',
  dishwasher: 'שטיפה',
  bartender: 'ברמנות',
  cashier: 'קופאות',
  host: 'אירוח',
  delivery: 'משלוחים',
  'shift-manager': 'ניהול משמרת',
};

export function scoreCandidate(
  candidate: Candidate,
  job: Job
): { score: number; badge: BadgeTier; reasonFacts: string[] } {
  const weights = { ...DEFAULT_WEIGHTS, ...job.weights };
  const reasons: string[] = [];

  // Hard gates (must-haves)
  if (job.mustHaves.includes('mustHaveImmediate') && job.filters.mustHaveImmediate && !candidate.availability.immediate) {
    return { score: 0, badge: 'md', reasonFacts: ['לא זמין/ה מיידית'] };
  }
  if (job.mustHaves.includes('mustHaveWorkPermit') && job.filters.mustHaveWorkPermit && !candidate.hasWorkPermit) {
    return { score: 0, badge: 'md', reasonFacts: ['אין היתר עבודה'] };
  }

  // Distance
  const distKm = haversineKm(candidate.location, job.location);
  const maxDist = job.filters.maxDistanceKm ?? 15;
  const withinRange = distKm <= candidate.willingRangeKm;
  const distScore = withinRange ? Math.max(0, 100 - (distKm / maxDist) * 100) : Math.max(0, 30 - (distKm / maxDist) * 30);
  const distLabel = distKm < 1 ? `${Math.round(distKm * 1000)} מ׳` : `${distKm.toFixed(1)} ק״מ`;
  reasons.push(distLabel);

  // Availability
  const jobShifts = new Set(job.shifts);
  const candShifts = new Set(candidate.availability.shifts);
  const shiftOverlap = [...jobShifts].filter(s => candShifts.has(s)).length;
  const availScore = jobShifts.size > 0 ? (shiftOverlap / jobShifts.size) * 100 : 80;

  if (candidate.availability.immediate) {
    reasons.push('פנוי/ה מיידית');
  } else {
    const matchedShifts = [...candShifts]
      .filter(s => jobShifts.size === 0 || jobShifts.has(s))
      .map(s => SHIFT_LABELS[s])
      .filter(Boolean);
    if (matchedShifts.length > 0) reasons.push(matchedShifts.slice(0, 2).join('/'));
  }

  // Role + Experience
  const jobRoles = job.filters.roles ?? [];
  const roleMatch =
    jobRoles.length === 0
      ? 80
      : candidate.roles.some(r => jobRoles.includes(r))
      ? 100
      : 25;
  const expYears = candidate.experience.totalYears;
  const expScore = Math.min(100, expYears * 18);
  const roleExpScore = roleMatch * 0.6 + expScore * 0.4;

  if (expYears > 0) {
    const mainRole = candidate.roles[0];
    const label = ROLE_LABELS[mainRole] ?? mainRole;
    reasons.push(`${expYears} שנות ${label}`);
  } else if (candidate.experience.notableWorkplaces.length > 0) {
    reasons.push(candidate.experience.notableWorkplaces[0]);
  }

  // Skills
  const skillScore = candidate.skills.length > 0 ? Math.min(100, candidate.skills.length * 25) : 50;

  // Compensation
  const jobWage = job.wageNis;
  const compScore = !jobWage
    ? 80
    : candidate.expectedWageNis <= jobWage
    ? 100
    : Math.max(0, 100 - ((candidate.expectedWageNis - jobWage) / jobWage) * 200);

  // Recency
  const recencyScore = Math.max(0, 100 - candidate.signals.lastActiveDaysAgo * 4);

  const raw =
    weights.availability * availScore +
    weights.distance * distScore +
    weights.roleExperience * roleExpScore +
    weights.skills * skillScore +
    weights.compensation * compScore +
    weights.recency * recencyScore;

  const score = Math.round(Math.min(100, Math.max(0, raw)));
  return { score, badge: badgeTier(score), reasonFacts: reasons.slice(0, 3) };
}

export function rankPool(candidates: Candidate[], job: Job): RankedCandidate[] {
  return candidates
    .map(c => ({ ...c, ...scoreCandidate(c, job) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
