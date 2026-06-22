import type { Candidate, Role, Language, ShiftType } from './types';

// Parses a simple CSV of candidates (first row = headers) into Candidate partials.
// Expected columns (order flexible, matched by header name):
//   name, neighborhood, age, roles, shifts, languages, wageNis, experience
export function parseCSV(
  text: string,
  businessId: string
): Omit<Candidate, 'id' | 'businessId' | 'addedAt'>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const col = (row: string[], key: string) => {
    const i = headers.indexOf(key);
    return i >= 0 ? (row[i] ?? '').trim() : '';
  };

  const ROLE_MAP: Record<string, Role> = {
    'בריסטה': 'barista', 'barista': 'barista',
    'מלצר': 'server', 'מלצרית': 'server', 'server': 'server',
    'טבח': 'cook', 'cook': 'cook',
    'שטיפה': 'dishwasher', 'dishwasher': 'dishwasher',
    'ברמן': 'bartender', 'bartender': 'bartender',
    'קופאי': 'cashier', 'cashier': 'cashier',
    'שליח': 'delivery', 'delivery': 'delivery',
  };

  const LANG_MAP: Record<string, Language> = {
    'עברית': 'he', 'he': 'he', 'hebrew': 'he',
    'ערבית': 'ar', 'ar': 'ar', 'arabic': 'ar',
    'אנגלית': 'en', 'en': 'en', 'english': 'en',
    'רוסית': 'ru', 'ru': 'ru', 'russian': 'ru',
  };

  const SHIFT_MAP: Record<string, ShiftType> = {
    'בקרים': 'morning', 'morning': 'morning',
    'צהריים': 'afternoon', 'afternoon': 'afternoon',
    'ערבים': 'evening', 'evening': 'evening',
    'לילות': 'night', 'night': 'night',
    'סופ"ש': 'weekend', 'weekend': 'weekend',
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  const COLORS = [
    'oklch(0.63 0.18 38)', 'oklch(0.55 0.14 160)', 'oklch(0.52 0.17 295)',
    'oklch(0.60 0.15 52)', 'oklch(0.54 0.14 22)', 'oklch(0.50 0.16 330)',
  ];

  return lines.slice(1).map((line, i) => {
    const row = line.split(',').map(c => c.trim());
    const name = col(row, 'name') || col(row, 'שם') || `מועמד ${i + 1}`;
    const neighborhood = col(row, 'neighborhood') || col(row, 'שכונה') || 'לא צוין';
    const age = parseInt(col(row, 'age') || col(row, 'גיל'), 10) || 25;
    const wageRaw = parseFloat(col(row, 'wagenis') || col(row, 'שכר') || '50');
    const rolesRaw = (col(row, 'roles') || col(row, 'תפקיד') || '').split('/');
    const roles: Role[] = rolesRaw.map(r => ROLE_MAP[r.trim()]).filter(Boolean) as Role[];
    const langsRaw = (col(row, 'languages') || col(row, 'שפות') || 'עברית').split('/');
    const languages: Language[] = langsRaw.map(l => LANG_MAP[l.trim()]).filter(Boolean) as Language[];
    const shiftsRaw = (col(row, 'shifts') || col(row, 'משמרות') || '').split('/');
    const shifts: ShiftType[] = shiftsRaw.map(s => SHIFT_MAP[s.trim()]).filter(Boolean) as ShiftType[];
    const expYears = parseInt(col(row, 'experience') || col(row, 'ניסיון') || '0', 10) || 0;

    return {
      name,
      initials: initials(name),
      avatarColor: COLORS[i % COLORS.length],
      neighborhood,
      location: { lat: 32.0628, lng: 34.773 }, // default to venue until geocoded
      hasCar: false,
      willingRangeKm: 10,
      availability: { days: ['sun','mon','tue','wed','thu'], shifts: shifts.length ? shifts : ['morning'], hoursPerWeek: 40, earliestStart: '', immediate: false },
      roles: roles.length ? roles : ['server'],
      experience: { totalYears: expYears, roles: roles.length ? roles : ['server'], venueTypes: ['cafe'], notableWorkplaces: [] },
      skills: [],
      languages: languages.length ? languages : ['he'],
      hasWorkPermit: true,
      age,
      expectedWageNis: wageRaw,
      signals: { applicationCount: 1, priorHires: 0, responseSpeedHours: 24, lastActiveDaysAgo: 0 },
      consentSource: 'csv-import' as const,
    };
  });
}
