'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { generateLead } from '@/lib/leads';
import { billingSummary } from '@/lib/billing';
import { CATEGORY_HE } from '@/lib/clinical';
import { canUse } from '@/lib/plan';

const STATUS_HE: Record<string, string> = { completed: 'הושלם', planned: 'מתוכנן', 'in-progress': 'בתהליך' };

function fmtDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function PatientProfileInner({ id }: { id: string }) {
  const router = useRouter();
  const store = useStore();
  const [copied, setCopied] = useState(false);

  const patient = store.patientById(id);

  if (!patient) {
    return (
      <>
        <div className="back-bar"><span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span><b>פרופיל מטופל</b></div>
        <div className="empty-state" style={{ paddingTop: 80 }}><h3>המטופל לא נמצא</h3></div>
      </>
    );
  }

  const lead = generateLead(patient, store.clinic.type);
  const bill = billingSummary(patient);
  const isUpToDate = lead.headline === 'הכל מעודכן';
  const canAutoSend = canUse(store.clinic, 'auto_outreach');

  const existingDraft = store.outreach.find(o => o.patientId === id && o.status !== 'declined');

  function handleCopy() {
    navigator.clipboard?.writeText(lead.draftMessage).catch(() => {});
    setCopied(true);
    addToast('a', 'ההודעה הועתקה');
    setTimeout(() => setCopied(false), 1800);
  }

  function handleApproveSend() {
    const outId = store.createOutreach(id, lead.draftMessage);
    store.approveOutreach(outId);
    store.sendOutreach(outId);
    addToast('g', `הודעה נשלחה ל${patient!.name}`);
  }

  return (
    <>
      <div className="back-bar"><span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span><b>פרופיל מטופל</b></div>

      <div className="prof-hero">
        <div className="prof-big" style={{ background: patient.avatarColor }}>{patient.initials}</div>
        <h2>{patient.name}</h2>
        <div className="sub">{patient.phone} · ביקור ראשון {fmtDate(patient.firstVisit)}</div>
        {!isUpToDate && <div className="prof-fit" style={{ background: 'var(--cedar-soft)', color: 'var(--cedar)' }}>ליד פעיל</div>}
        {isUpToDate && <div className="prof-fit" style={{ background: 'rgba(74,122,90,0.15)', color: 'var(--accent)' }}>🟢 עדכני</div>}
      </div>

      {/* LEAD CARD */}
      <div className="dna-section" style={{ marginTop: 0, borderRadius: '20px 20px 0 0' }}>
        <div className="dna-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          ליד מותאם אישית
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#221b16', marginBottom: 4 }}>{lead.headline}</div>
        <div style={{ fontSize: 13, color: '#7c6f63', marginBottom: 12 }}>{lead.reason}</div>
        {!isUpToDate && (
          <>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: 12, fontSize: 13.5, lineHeight: 1.6, marginBottom: 12 }}>
              {lead.draftMessage}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={handleCopy}>{copied ? 'הועתק ✓' : 'העתק הודעה'}</button>
              {canAutoSend && (
                <button className="btn-invite" style={{ flex: 1 }} onClick={handleApproveSend} disabled={!!existingDraft && existingDraft.status === 'sent'}>
                  {existingDraft?.status === 'sent' ? 'נשלח ✓' : 'אשר ושלח'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="prof-body">
        <div className="prow"><div className="lab">טלפון</div><div className="val">{patient.phone}</div></div>
        <div className="prow"><div className="lab">ביקור אחרון</div><div className="val">{fmtDate(patient.lastVisit)}</div></div>
        {patient.age && <div className="prow"><div className="lab">גיל</div><div className="val">{patient.age}</div></div>}
        <div className="prow"><div className="lab">הסכמה</div><div className="val">{patient.consent ? 'ניתנה ✓' : 'לא ניתנה'}</div></div>
        {patient.medicalNotes && (
          <div className="prow" style={{ borderBottom: 'none' }}>
            <div className="lab">הערות רפואיות</div>
            <div className="val" style={{ fontWeight: 500 }}>{patient.medicalNotes}</div>
          </div>
        )}
      </div>

      {/* TREATMENT HISTORY */}
      <div className="dna-section">
        <div className="dna-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /></svg>
          היסטוריית טיפולים
        </div>
        {patient.treatments.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>אין טיפולים רשומים</div>}
        {patient.treatments.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < patient.treatments.length - 1 ? '1px solid rgba(124,92,62,0.08)' : 'none' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name || CATEGORY_HE[t.category]}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(t.date)} · {STATUS_HE[t.status]}{t.notes ? ` · ${t.notes}` : ''}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₪{t.cost.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* BILLING */}
      <div className="dna-section">
        <div className="dna-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          תשלומים
        </div>
        <div className="dna-sub-row"><span className="dna-sub-lbl">סה"כ חויב</span><span className="dna-sub-val">₪{bill.totalBilled.toLocaleString()}</span></div>
        <div className="dna-sub-row"><span className="dna-sub-lbl">שולם</span><span className="dna-sub-val">₪{bill.totalPaid.toLocaleString()}</span></div>
        <div className="dna-sub-row"><span className="dna-sub-lbl" style={{ color: bill.outstanding > 0 ? '#b91c1c' : undefined }}>יתרה לתשלום</span><span className="dna-sub-val" style={{ color: bill.outstanding > 0 ? '#b91c1c' : undefined }}>₪{bill.outstanding.toLocaleString()}</span></div>
      </div>

      <div aria-hidden="true" style={{ height: 40 }} />
    </>
  );
}

export default function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PatientProfileInner id={id} />;
}
