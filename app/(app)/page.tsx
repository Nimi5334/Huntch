'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import PatientCard from '@/components/PatientCard';
import AddPatientModal from '@/components/AddPatientModal';
import { generateLead } from '@/lib/leads';
import { canUse } from '@/lib/plan';

export default function Home() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  const clinic = store.clinic;
  const leads = useMemo(
    () => store.patients.map(p => ({ patient: p, lead: generateLead(p, clinic.type) })),
    [store.patients, clinic.type],
  );

  const actionable = leads.filter(l => l.lead.headline !== 'הכל מעודכן');
  const upToDate = leads.filter(l => l.lead.headline === 'הכל מעודכן');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? leads.filter(l => l.patient.name.toLowerCase().includes(q) || l.patient.phone.includes(q))
    : [...actionable, ...upToDate];

  const roi = store.roiSummary();
  const showRoiTeaser = !canUse(clinic, 'roi_dashboard');

  function handleSendLead(patientId: string, message: string) {
    const id = store.createOutreach(patientId, 'reactivation', message);
    store.approveOutreach(id);
    store.sendOutreach(id);
    setSentIds(prev => new Set(prev).add(patientId));
    addToast('g', 'ההודעה אושרה ונשלחה');
  }

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg">
            <span className="t">{clinic.name} · {store.patients.length} מטופלים</span>
            <Link href="/today">מה חדש היום ←</Link>
          </div>

          <button className="btn-ghost" style={{ marginBottom: 14 }} onClick={() => setAddOpen(true)}>
            + הוסף מטופל חדש
          </button>

          {showRoiTeaser && roi.potentialRevenue > 0 && (
            <Link href="/settings/billing" className="qr-compact" style={{ marginBottom: 14 }}>
              <div className="sq" style={{ background: 'var(--accent-soft)', display: 'grid', placeItems: 'center' }}>
                <span style={{ fontSize: 18 }}>💡</span>
              </div>
              <div>
                <div className="nm">₪{roi.potentialRevenue.toLocaleString()} ניתן להחזיר אוטומטית</div>
                <div className="ds">שדרג/י למתקדם כדי להפעיל שליחה אוטומטית ולוח ROI</div>
              </div>
              <span className="go">←</span>
            </Link>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="חיפוש מטופל לפי שם או טלפון…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <h3>לא נמצאו מטופלים</h3>
              <p>נסה/י מונח חיפוש אחר, או הוסף/הוסיפי מטופל חדש.</p>
            </div>
          )}

          {filtered.map(({ patient, lead }) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              lead={lead}
              sent={sentIds.has(patient.id)}
              onSendLead={() => handleSendLead(patient.id, lead.draftMessage)}
            />
          ))}
        </div>
      </main>
      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
