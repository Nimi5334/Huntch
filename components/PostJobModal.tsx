'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from './Toasts';
import type { Job, Role, ShiftType } from '@/lib/types';

const ROLES: { value: Role; label: string }[] = [
  { value: 'barista', label: 'בריסטה' },
  { value: 'server', label: 'מלצר/ית' },
  { value: 'cook', label: 'טבח/ית' },
  { value: 'line-cook', label: 'טבח קו' },
  { value: 'dishwasher', label: 'שטיפת כלים' },
  { value: 'bartender', label: 'ברמן/ית' },
  { value: 'cashier', label: 'קופאי/ת' },
  { value: 'shift-manager', label: 'אחמ״ש' },
];

const SHIFTS: { value: ShiftType; label: string }[] = [
  { value: 'morning', label: 'בקרים' },
  { value: 'afternoon', label: 'צהריים' },
  { value: 'evening', label: 'ערבים' },
  { value: 'night', label: 'לילות' },
  { value: 'weekend', label: 'סופ״ש' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PostJobModal({ open, onClose }: Props) {
  const router = useRouter();
  const postJob = useStore(s => s.postJob);
  const business = useStore(s => s.business);

  const [role, setRole] = useState<Role>('barista');
  const [when, setWhen] = useState('immediate');
  const [shifts, setShifts] = useState<ShiftType[]>(['morning', 'evening']);
  const [wage, setWage] = useState('');
  const [requirements, setRequirements] = useState('');

  const toggleShift = (s: ShiftType) =>
    setShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = () => {
    const startDate = when === 'immediate'
      ? new Date().toISOString().slice(0, 10)
      : when === '2weeks'
      ? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
      : new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

    const id = postJob({
      role,
      locationAddress: business.address,
      location: business.location,
      shifts,
      startDate,
      requirements: requirements || 'ניסיון רלוונטי, יחסי אנוש טובים',
      wageNis: wage ? parseInt(wage, 10) : undefined,
      filters: { roles: [role], maxDistanceKm: 10 },
      weights: {
        availability: 0.30, distance: 0.25, roleExperience: 0.20,
        skills: 0.10, compensation: 0.10, recency: 0.05,
      },
      mustHaves: [],
    });

    onClose();
    addToast('a', 'המשרה פורסמה — מחפשים עכשיו');
    router.push(`/jobs/${id}`);
  };

  return (
    <div className={`scrim${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="פרסום משרה חדשה">
        <div className="modal-head">
          <h3>פרסום משרה חדשה</h3>
          <button className="modal-ico" onClick={onClose} aria-label="סגור">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-sub">
          <svg viewBox="0 0 24 24"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
          כמה שורות — אנחנו נכתוב את המודעה ונפיץ.
        </div>

        <div className="field">
          <label>תפקיד</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label>מתי להתחיל?</label>
          <select value={when} onChange={e => setWhen(e.target.value)}>
            <option value="immediate">בהקדם האפשרי</option>
            <option value="2weeks">תוך שבועיים</option>
            <option value="season">לעונה הקרובה</option>
          </select>
        </div>

        <div className="field">
          <label>משמרות</label>
          <div className="toggles">
            {SHIFTS.map(s => (
              <button
                key={s.value}
                className={`toggle${shifts.includes(s.value) ? ' on' : ''}`}
                onClick={() => toggleShift(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>שכר שעתי (אופציונלי)</label>
          <input
            type="number"
            placeholder="₪ לשעה"
            value={wage}
            onChange={e => setWage(e.target.value)}
          />
        </div>

        <div className="field">
          <label>דרישות נוספות (אופציונלי)</label>
          <textarea
            placeholder="ניסיון בחיבור אספרסו, שירותיות, ידע בקופה..."
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
          />
        </div>

        <div style={{ background: 'rgba(46,107,70,0.06)', border: '1px solid rgba(46,107,70,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 11.5, color: '#888', marginBottom: 0 }}>
          <strong style={{ color: '#2e6b46' }}>Flow 2 — Surface &amp; Confirm</strong> · אנחנו מוצאים, אתם מאשרים.<br/>
          <span style={{ color: '#ccc' }}>Flow 1 (הזמנה אוטומטית) — זמין בפרו</span>
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn-publish" onClick={handleSubmit}>
            <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            פרסמו עכשיו
          </button>
        </div>
      </div>
    </div>
  );
}
