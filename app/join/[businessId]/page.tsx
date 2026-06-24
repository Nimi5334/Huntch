'use client';
import { use, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import type { Role, ShiftType, Language } from '@/lib/types';

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'barista', label: 'בריסטה' },
  { value: 'server', label: 'מלצר·ית' },
  { value: 'cook', label: 'טבח·ית' },
  { value: 'bartender', label: 'ברמן·ית' },
  { value: 'cashier', label: 'קופאי·ת' },
  { value: 'host', label: 'מארח·ת' },
  { value: 'delivery', label: 'שליח·ה' },
  { value: 'dishwasher', label: 'שטיפה' },
];

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

export default function JoinPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = use(params);
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [experience, setExperience] = useState('0');
  const [wage, setWage] = useState('');
  const [consent, setConsent] = useState(false);
  const formStartRef = useRef<number>(Date.now());

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const business = store.business.id === businessId ? store.business : null;

  const toggleRole = (r: Role) =>
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const toggleShift = (s: ShiftType) =>
    setShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !consent) return;

    const colorIdx = Math.abs(name.charCodeAt(0)) % AVATAR_COLORS.length;
    const formCompletionSec = Math.round((Date.now() - formStartRef.current) / 1000);

    const candidateId = store.addViaQr(
      {
        name,
        phone,
        initials: getInitials(name),
        avatarColor: AVATAR_COLORS[colorIdx],
        neighborhood: neighborhood || 'לא צוין',
        location: store.business.location,
        hasCar: false,
        willingRangeKm: 10,
        availability: {
          days: ['sun', 'mon', 'tue', 'wed', 'thu'],
          shifts: shifts.length ? shifts : ['morning'],
          hoursPerWeek: 35,
          earliestStart: new Date().toISOString().slice(0, 10),
          immediate: false,
        },
        roles: roles.length ? roles : ['server'],
        experience: {
          totalYears: parseInt(experience, 10) || 0,
          roles: roles.length ? roles : ['server'],
          venueTypes: ['cafe'],
          notableWorkplaces: [],
        },
        skills: [],
        languages: ['he'] as Language[],
        hasWorkPermit: true,
        age: 25,
        expectedWageNis: parseFloat(wage) || 50,
        signals: { applicationCount: 1, priorHires: 0, responseSpeedHours: 1, lastActiveDaysAgo: 0 },
        consentSource: 'qr-scan',
      },
      businessId
    );

    // Fire-and-forget — start the WhatsApp DNA Feeder conversation
    fetch('/api/whatsapp/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        candidateName:  name,
        phone,
        businessId,
        businessName:   store.business.name,
        formCompletionSec,
      }),
    }).catch(err => console.warn('[DNA Feeder trigger]', err));

    setSubmitted(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (submitted) {
    return (
      <div className="apply-shell">
        <div className="apply-card">
          <div className="apply-success">
            <div className="apply-success-icon">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
              תודה, {name.split(' ')[0]}!
            </h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              נרשמת בהצלחה! כשתהיה הצעת עבודה רלוונטית לידך, נשלח לך הודעה ישירות בוואטסאפ.
            </p>
            <div style={{
              fontSize: 11, color: '#bbb', padding: '10px 14px',
              background: 'rgba(0,0,0,0.03)', borderRadius: 10, textAlign: 'right', marginBottom: 24,
            }}>
              <strong>Huntch</strong> — המספר שיתופי, ההודעה תגיע בשם העסק. תוכל/י להסיר הסכמה בכל עת.
            </div>

            {/* Share prompt */}
            <div style={{
              borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 20, textAlign: 'center',
            }}>
              <p style={{ fontSize: 12.5, color: '#aaa', marginBottom: 12 }}>
                מכיר/ה מישהו שמחפש עבודה? שתף/י את הקישור
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 10,
                  border: '1.5px solid rgba(0,0,0,0.12)',
                  background: copied ? 'oklch(0.55 0.14 160)' : '#fff',
                  color: copied ? '#fff' : '#555',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? 'הועתק!' : 'העתק קישור'}
              </button>
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
            <path d="M22,16 L22,64" stroke="white" strokeWidth="10" strokeLinecap="round" />
            <path d="M58,16 L58,64" stroke="white" strokeWidth="10" strokeLinecap="round" />
            <path d="M22,42 C22,26 58,26 58,42" stroke="white" strokeWidth="9" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}>Huntch</span>
      </div>

      <div className="apply-card">
        <div>
          {business ? (
            <div className="apply-job-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {business.name}
            </div>
          ) : null}
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            {business ? `עבודה קרוב אלייך, ב${business.name}` : 'מצא/י עבודה קרוב אלייך'}
          </h1>
          <p style={{ fontSize: 12.5, color: '#999', marginBottom: 20 }}>
            מלאו את הפרטים — נשלח לכם הצעות רלוונטיות ישירות לוואטסאפ.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full name */}
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

          {/* WhatsApp phone */}
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

          {/* Neighborhood */}
          <div className="field">
            <label>שכונה / עיר</label>
            <input
              type="text"
              placeholder="למשל: פלורנטין, תל אביב"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
            />
          </div>

          {/* Role picker */}
          <div className="field">
            <label>תפקידים</label>
            <div className="toggles">
              {ALL_ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`toggle${roles.includes(r.value) ? ' on' : ''}`}
                  onClick={() => toggleRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred shifts */}
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

          {/* Experience */}
          <div className="field">
            <label>שנות ניסיון</label>
            <select value={experience} onChange={e => setExperience(e.target.value)}>
              <option value="0">ללא</option>
              <option value="1">שנה</option>
              <option value="2">שנתיים</option>
              <option value="3">3 שנים</option>
              <option value="5">5+ שנים</option>
            </select>
          </div>

          {/* Expected wage */}
          <div className="field">
            <label>שכר מבוקש לשעה ₪</label>
            <input
              type="number"
              placeholder="45"
              min="0"
              value={wage}
              onChange={e => setWage(e.target.value)}
            />
          </div>

          {/* Consent checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
            <input
              type="checkbox"
              id="qr-consent"
              required
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#2e6b46', flexShrink: 0 }}
            />
            <label htmlFor="qr-consent" style={{ fontSize: 12.5, color: '#555', lineHeight: 1.5, cursor: 'pointer' }}>
              אני מסכים/ה לקבל הצעות עבודה מ-Huntch בוואטסאפ. ניתן להסיר הסכמה בכל עת על-ידי שליחת STOP.
            </label>
          </div>

          <button type="submit" className="btn-full">שלח/י פרטים</button>
        </form>
      </div>
    </div>
  );
}
