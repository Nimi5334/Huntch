'use client';
import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { canUse } from '@/lib/plan';
import { generateLead } from '@/lib/leads';
import { daysSince } from '@/lib/clinical';
import UpgradeLock from '@/components/UpgradeLock';

const REASON_HE: Record<string, string> = {
  complex_question: 'שאלה מורכבת',
  complaint: 'תלונה',
  medical_concern: 'חשש רפואי',
  reschedule: 'בקשת שינוי תור',
  other: 'אחר',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function TasksInner() {
  const store = useStore();
  const clinic = store.clinic;
  const auto = store.automationSettings();
  const focus = useSearchParams().get('focus');

  const now = new Date().toISOString().slice(0, 10);

  const pending = store.escalations.filter(e => e.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const handled = store.escalations.filter(e => e.status === 'handled').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const checkins = auto.qualityChecks ? store.checkinsDueToday() : [];

  const leads = useMemo(() => auto.reactivationLeads
    ? store.patients
        .map(p => ({ patient: p, lead: generateLead(p, clinic.type) }))
        .filter(x => x.lead.headline !== 'הכל מעודכן')
    : [], [store.patients, clinic.type, auto.reactivationLeads]);

  const reviewNudges = useMemo(() => auto.reviewRequests
    ? store.patients.filter(p => {
        const lastT = p.treatments.find(t => t.status === 'completed');
        if (!lastT) return false;
        const d = daysSince(lastT.date, now);
        return d >= 2 && d <= 10;
      })
    : [], [store.patients, now, auto.reviewRequests]);

  // Scroll to the focused section when arriving from the "המשימות שלי" popover
  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(focus);
    if (el) {
      const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      return () => clearTimeout(t);
    }
  }, [focus]);

  function sendCheckin(patientId: string, kind: 'quality_check' | 'wellbeing', message: string, relatedTreatmentId?: string) {
    const id = store.createOutreach(patientId, kind, message, relatedTreatmentId);
    store.approveOutreach(id);
    store.sendOutreach(id);
    addToast('g', 'הבדיקה נשלחה');
  }

  function sendLead(patientId: string, message: string) {
    const id = store.createOutreach(patientId, 'reactivation', message);
    store.approveOutreach(id);
    store.sendOutreach(id);
    addToast('g', 'ההודעה נשלחה');
  }

  function sendReviewAsk(patientId: string, name: string) {
    const firstName = name.split(' ')[0];
    const message = `היי ${firstName}, תודה שביקרת אצלנו! נשמח מאוד אם תשאיר/י לנו ביקורת קצרה — זה עוזר לנו המון 🙏`;
    const id = store.createOutreach(patientId, 'review', message);
    store.approveOutreach(id);
    store.sendOutreach(id);
    addToast('g', 'בקשת ביקורת נשלחה');
  }

  const totalOpen = pending.length + checkins.length + leads.length + reviewNudges.length;

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg"><span className="t">המשימות שלי · {totalOpen} פתוחות</span></div>

          {/* Escalations — human intervention */}
          <div id="escalations" className="feed-seg" style={{ scrollMarginTop: 70 }}><span className="t">דורש התערבות אנושית · {pending.length}</span></div>
          {pending.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין פניות שממתינות לטיפול.</div>}
          {pending.map(e => {
            const patient = store.patientById(e.patientId);
            return (
              <div key={e.id} className="cand in">
                <div className="cand-top">
                  <Link href={`/patients/${e.patientId}`} style={{ display: 'contents' }}>
                    <div className="av" style={{ background: patient?.avatarColor }}>{patient?.initials}</div>
                    <div className="cand-info">
                      <div className="cand-name">{patient?.name ?? 'מטופל'}</div>
                      <div className="cand-facts"><span>{REASON_HE[e.reason]}</span><span className="cdot" /><span>{fmtTime(e.createdAt)}</span></div>
                    </div>
                  </Link>
                </div>
                {e.snippet && <div style={{ padding: '0 4px 10px', fontSize: 13, color: '#7c6f63' }}>&quot;{e.snippet}&quot;</div>}
                <div className="cand-actions">
                  <button className="btn-invite" onClick={() => { store.resolveEscalation(e.id); addToast('g', 'הפנייה סומנה כטופלה'); }}>טופל</button>
                </div>
              </div>
            );
          })}

          {/* Quality checks */}
          {auto.qualityChecks && (
            <>
              <div id="checkins" className="feed-seg" style={{ scrollMarginTop: 70 }}><span className="t">בדיקות איכות תקופתיות · {checkins.length}</span></div>
              {checkins.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין בדיקות איכות שממתינות היום.</div>}
              {checkins.map((c, i) => {
                const patient = store.patientById(c.patientId);
                if (!patient) return null;
                return (
                  <div key={i} className="cand in">
                    <div className="cand-top">
                      <div className="av" style={{ background: patient.avatarColor }}>{patient.initials}</div>
                      <div className="cand-info">
                        <div className="cand-name">{patient.name}</div>
                        <div className="cand-facts"><span>{c.reason}</span></div>
                      </div>
                    </div>
                    <div style={{ padding: '0 4px 10px', fontSize: 13, color: '#7c6f63' }}>{c.message}</div>
                    <div className="cand-actions">
                      <button className="btn-invite" onClick={() => sendCheckin(patient.id, c.kind as 'quality_check' | 'wellbeing', c.message, c.relatedTreatmentId)}>אשר ושלח</button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Reactivation leads */}
          {auto.reactivationLeads && (
            <>
              <div id="leads" className="feed-seg" style={{ scrollMarginTop: 70 }}><span className="t">לידים להחזרת מטופלים · {leads.length}</span></div>
              {leads.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>כל המטופלים עדכניים.</div>}
              {leads.slice(0, 8).map(({ patient, lead }) => (
                <div key={patient.id} className="cand in">
                  <div className="cand-top">
                    <Link href={`/patients/${patient.id}`} style={{ display: 'contents' }}>
                      <div className="av" style={{ background: patient.avatarColor }}>{patient.initials}</div>
                      <div className="cand-info">
                        <div className="cand-name">{patient.name}</div>
                        <div className="cand-facts"><span>{lead.headline}</span><span className="cdot" /><span>{lead.reason}</span></div>
                      </div>
                    </Link>
                  </div>
                  <div className="cand-actions">
                    <button className="btn-invite" onClick={() => sendLead(patient.id, lead.draftMessage)}>אשר ושלח</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Review requests */}
          {auto.reviewRequests && (
            <>
              <div id="reviews" className="feed-seg" style={{ scrollMarginTop: 70 }}><span className="t">בקשות ביקורת · {reviewNudges.length}</span></div>
              {reviewNudges.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין מטופלים שביקרו לאחרונה.</div>}
              {reviewNudges.slice(0, 6).map(patient => (
                <div key={patient.id} className="inv-row">
                  <div className="sci" style={{ background: patient.avatarColor }}>{patient.initials}</div>
                  <div><div className="nm">{patient.name}</div><div className="stt">ביקר/ה לאחרונה — הזדמנות לבקש ביקורת</div></div>
                  <button className="btn-invite" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => sendReviewAsk(patient.id, patient.name)}>בקש ביקורת</button>
                </div>
              ))}
            </>
          )}

          {/* Handled escalations */}
          {handled.length > 0 && (
            <>
              <div className="feed-seg"><span className="t">טופלו לאחרונה</span></div>
              {handled.slice(0, 5).map(e => {
                const patient = store.patientById(e.patientId);
                return (
                  <div key={e.id} className="inv-row">
                    <div className="sci" style={{ background: patient?.avatarColor }}>{patient?.initials}</div>
                    <div><div className="nm">{patient?.name}</div><div className="stt">{REASON_HE[e.reason]}</div></div>
                    <span className="inv-badge2 b-yes">טופל ✓</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TasksPage() {
  const store = useStore();
  const gated = !canUse(store.clinic, 'daily_briefing');

  if (gated) {
    return <UpgradeLock title="מרכז המשימות זמין בתוכנית המתקדמת" description="כל המשימות להתייעלות המרפאה במקום אחד — פניות, בדיקות איכות, לידים ובקשות ביקורת. שדרג/י כדי לפתוח את הפיצ'ר." />;
  }

  return (
    <Suspense fallback={<div className="body"><main className="main"><div className="feed"><div className="feed-seg"><span className="t">טוען…</span></div></div></main></div>}>
      <TasksInner />
    </Suspense>
  );
}
