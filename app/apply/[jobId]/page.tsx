'use client';
import { use, useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import type { Role, Language, ShiftType } from '@/lib/types';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת',
  host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

const ALL_SHIFTS: { value: ShiftType; label: string }[] = [
  { value: 'morning', label: 'בקרים' },
  { value: 'afternoon', label: 'צהריים' },
  { value: 'evening', label: 'ערבים' },
  { value: 'night', label: 'לילות' },
  { value: 'weekend', label: 'סופ״ש' },
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');
}

const AVATAR_COLORS = [
  'oklch(0.63 0.18 38)', 'oklch(0.55 0.14 160)', 'oklch(0.52 0.17 295)',
  'oklch(0.60 0.15 52)', 'oklch(0.54 0.14 22)',
];

export default function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [experience, setExperience] = useState('0');
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [wage, setWage] = useState('');
  const [immediate, setImmediate] = useState(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const job = store.jobs.find(j => j.id === jobId);

  const toggleShift = (s: ShiftType) =>
    setShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const colorIdx = Math.abs(name.charCodeAt(0)) % AVATAR_COLORS.length;

    store.addToPool({
      name,
      initials: getInitials(name),
      avatarColor: AVATAR_COLORS[colorIdx],
      neighborhood: neighborhood || 'לא צוין',
      location: store.business.location, // default until geocoded
      hasCar: false,
      willingRangeKm: 10,
      availability: {
        days: ['sun','mon','tue','wed','thu'],
        shifts: shifts.length ? shifts : ['morning'],
        hoursPerWeek: 35,
        earliestStart: new Date().toISOString().slice(0, 10),
        immediate,
      },
      roles: job ? [job.role] : ['server'],
      experience: {
        totalYears: parseInt(experience, 10) || 0,
        roles: job ? [job.role] : ['server'],
        venueTypes: ['cafe'],
        notableWorkplaces: [],
      },
      skills: [],
      languages: ['he'] as Language[],
      hasWorkPermit: true,
      age: 25,
      expectedWageNis: parseFloat(wage) || 50,
      signals: { applicationCount: 1, priorHires: 0, responseSpeedHours: 1, lastActiveDaysAgo: 0 },
      consentSource: 'apply-form',
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="apply-shell">
        <div className="apply-card">
          <div className="apply-success">
            <div className="apply-success-icon">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
              תודה, {name.split(' ')[0]}!
            </h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              הפרטים שלך נשמרו. אם תהיה התאמה, תקבל/י הודעת WhatsApp מ-Huntch.
            </p>
            <div style={{ fontSize: 11, color: '#bbb', padding: '10px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, textAlign: 'right' }}>
              <strong>Huntch</strong> — המספר שיתופי, ההודעה תגיע בשם העסק. תוכל/י להסיר הסכמה בכל עת.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-shell">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 24 }}>
        <div className="h-mark">
          <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
            <path d="M22,16 L22,64" stroke="white" strokeWidth="10" strokeLinecap="round"/>
            <path d="M58,16 L58,64" stroke="white" strokeWidth="10" strokeLinecap="round"/>
            <path d="M22,42 C22,26 58,26 58,42" stroke="white" strokeWidth="9" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}>Huntch</span>
      </div>

      <div className="apply-card">
        <div>
          {job && (
            <div className="apply-job-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              {ROLE_HE[job.role] ?? job.role} · {store.business.name}
            </div>
          )}
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            הגישו מועמדות
          </h1>
          <p style={{ fontSize: 12.5, color: '#999', marginBottom: 20 }}>
            מלאו את הפרטים — אם תתאימו, נחזור אליכם ב-WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>שם מלא *</label>
            <input
              type="text"
              placeholder="שם פרטי ושם משפחה"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>טלפון WhatsApp *</label>
            <input
              type="tel"
              dir="ltr"
              placeholder="050-0000000"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="field">
            <label>שכונה / עיר</label>
            <input
              type="text"
              placeholder="למשל: פלורנטין, תל אביב"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
            />
          </div>

          <div className="field">
            <label>שנות ניסיון</label>
            <select value={experience} onChange={e => setExperience(e.target.value)}>
              <option value="0">ללא ניסיון</option>
              <option value="1">שנה</option>
              <option value="2">שנתיים</option>
              <option value="3">3 שנים</option>
              <option value="5">5+ שנים</option>
            </select>
          </div>

          <div className="field">
            <label>משמרות מועדפות</label>
            <div className="toggles">
              {ALL_SHIFTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={`toggle${shifts.includes(s.value) ? ' on' : ''}`}
                  onClick={() => toggleShift(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>שכר מבוקש לשעה (₪)</label>
            <input
              type="number"
              placeholder="45"
              value={wage}
              onChange={e => setWage(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input
              type="checkbox"
              id="immediate"
              checked={immediate}
              onChange={e => setImmediate(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#2e6b46' }}
            />
            <label htmlFor="immediate" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              פנוי/ה מיידית
            </label>
          </div>

          <button type="submit" className="btn-full">שלח מועמדות</button>

          <p className="apply-consent">
            בשליחה אני מסכים/ה לקבל הודעות WhatsApp מ-Huntch בנוגע להצעות עבודה מתאימות.
            ניתן להסיר הסכמה בכל עת.
          </p>
        </form>
      </div>
    </div>
  );
}
