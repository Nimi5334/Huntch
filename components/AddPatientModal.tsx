'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { addToast } from './Toasts';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddPatientModal({ open, onClose }: Props) {
  const addPatient = useStore(s => s.addPatient);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'m' | 'f' | ''>('');
  const [firstVisit, setFirstVisit] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function reset() {
    setName(''); setPhone(''); setAge(''); setGender(''); setFirstVisit(new Date().toISOString().slice(0, 10)); setNotes('');
  }

  function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      addToast('a', 'נא למלא שם וטלפון');
      return;
    }
    addPatient({
      name: name.trim(),
      phone: phone.trim(),
      initials: '',
      avatarColor: '',
      age: age ? parseInt(age, 10) : undefined,
      gender: gender || undefined,
      firstVisit,
      lastVisit: firstVisit,
      treatments: [],
      payments: [],
      medicalNotes: notes || undefined,
      consent: true,
    });
    addToast('g', `${name} נוסף/ה למאגר`);
    reset();
    onClose();
  }

  return (
    <div className={`scrim${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="הוספת מטופל חדש">
        <div className="modal-head">
          <h3>הוספת מטופל חדש</h3>
          <button className="modal-ico" onClick={onClose} aria-label="סגור">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="field">
          <label>שם מלא</label>
          <input type="text" placeholder="שם המטופל/ת" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>טלפון</label>
          <input type="tel" dir="ltr" placeholder="050-000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>גיל (אופציונלי)</label>
          <input type="number" placeholder="גיל" value={age} onChange={e => setAge(e.target.value)} />
        </div>
        <div className="field">
          <label>מין (אופציונלי)</label>
          <select value={gender} onChange={e => setGender(e.target.value as 'm' | 'f' | '')}>
            <option value="">לא צוין</option>
            <option value="f">נקבה</option>
            <option value="m">זכר</option>
          </select>
        </div>
        <div className="field">
          <label>תאריך ביקור ראשון</label>
          <input type="date" value={firstVisit} onChange={e => setFirstVisit(e.target.value)} />
        </div>
        <div className="field">
          <label>הערות רפואיות (אופציונלי)</label>
          <textarea placeholder="רגישויות, אלרגיות, הערות חשובות…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn-publish" onClick={handleSubmit}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            הוסף מטופל
          </button>
        </div>
      </div>
    </div>
  );
}
