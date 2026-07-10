'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { generateLead } from '@/lib/leads';
import { canUse } from '@/lib/plan';
import { daysSince } from '@/lib/clinical';
import UpgradeLock from '@/components/UpgradeLock';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const store = useStore();
  const clinic = store.clinic;

  const gated = !canUse(clinic, 'daily_briefing');

  const now = today();

  const todaysTreatments = useMemo(() => store.patients.flatMap(p =>
    p.treatments.filter(t => t.date === now).map(t => ({ patient: p, treatment: t }))
  ), [store.patients, now]);

  const recentReplies = useMemo(() => store.outreach
    .filter(o => o.status === 'replied' && o.respondedAt)
    .sort((a, b) => (b.respondedAt ?? '').localeCompare(a.respondedAt ?? ''))
    .slice(0, 5)
    .map(o => ({ outreach: o, patient: store.patientById(o.patientId) })),
    [store.outreach, store.patients]);

  const pendingEscalations = store.escalations.filter(e => e.status === 'pending');

  const leadsToday = useMemo(() => store.patients
    .map(p => ({ patient: p, lead: generateLead(p, clinic.type) }))
    .filter(x => x.lead.headline !== 'הכל מעודכן'),
    [store.patients, clinic.type]);

  const checkins = store.checkinsDueToday();

  const reviewNudges = useMemo(() => store.patients.filter(p => {
    const lastTreatment = p.treatments.find(t => t.status === 'completed');
    if (!lastTreatment) return false;
    const d = daysSince(lastTreatment.date, now);
    return d >= 2 && d <= 10;
  }), [store.patients, now]);

  if (gated) {
    return <UpgradeLock title="מה חדש היום זמין בתוכנית המתקדמת" description="לוח בקרה יומי עם טיפולים, תגובות מטופלים, בדיקות איכות ולידים — שדרג/י כדי לפתוח את הפיצ'ר." />;
  }

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

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg"><span className="t">מה חדש היום, {clinic.operatorName.split(' ')[0]}</span></div>

          {/* Today's treatments */}
          <div className="feed-seg"><span className="t">טיפולים היום</span></div>
          {todaysTreatments.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין טיפולים מתוזמנים היום</div>}
          {todaysTreatments.map(({ patient, treatment }) => (
            <Link key={treatment.id} href={`/patients/${patient.id}`} className="inv-row">
              <div className="sci" style={{ background: patient.avatarColor }}>{patient.initials}</div>
              <div><div className="nm">{patient.name}</div><div className="stt">{treatment.name}</div></div>
              <span className="inv-badge2 b-wait">₪{treatment.cost}</span>
            </Link>
          ))}

          {/* Human intervention queue */}
          <div className="feed-seg">
            <span className="t">דורש התערבות אנושית</span>
            {pendingEscalations.length > 0 && <Link href="/inbox">כל הפניות ←</Link>}
          </div>
          {pendingEscalations.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין פניות שממתינות</div>}
          {pendingEscalations.slice(0, 4).map(e => {
            const patient = store.patientById(e.patientId);
            return (
              <Link key={e.id} href="/inbox" className="inv-row">
                <div className="sci" style={{ background: patient?.avatarColor }}>{patient?.initials}</div>
                <div><div className="nm">{patient?.name}</div><div className="stt">{e.snippet}</div></div>
                <span className="inv-badge2" style={{ background: '#fbe9e9', color: '#b91c1c' }}>דחוף</span>
              </Link>
            );
          })}

          {/* Replies */}
          <div className="feed-seg"><span className="t">תגובות אחרונות ממטופלים</span></div>
          {recentReplies.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין תגובות חדשות</div>}
          {recentReplies.map(({ outreach, patient }) => patient && (
            <Link key={outreach.id} href={`/patients/${patient.id}`} className="inv-row">
              <div className="sci" style={{ background: patient.avatarColor }}>{patient.initials}</div>
              <div><div className="nm">{patient.name}</div><div className="stt">{outreach.insight ?? 'הגיב/ה להודעה'}</div></div>
              <span className="inv-badge2 b-yes">השיב/ה ✓</span>
            </Link>
          ))}

          {/* Quality checks due */}
          <div className="feed-seg"><span className="t">בדיקות איכות תקופתיות</span></div>
          {checkins.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין בדיקות איכות שממתינות היום</div>}
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
                  <button className="btn-invite" onClick={() => sendCheckin(patient.id, c.kind as 'quality_check' | 'wellbeing', c.message, c.relatedTreatmentId)}>
                    אשר ושלח
                  </button>
                </div>
              </div>
            );
          })}

          {/* Leads maturing today */}
          <div className="feed-seg"><span className="t">לידים לטיפול</span></div>
          {leadsToday.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>כל המטופלים עדכניים</div>}
          {leadsToday.slice(0, 6).map(({ patient, lead }) => (
            <div key={patient.id} className="cand in">
              <div className="cand-top">
                <div className="av" style={{ background: patient.avatarColor }}>{patient.initials}</div>
                <div className="cand-info">
                  <div className="cand-name">{patient.name}</div>
                  <div className="cand-facts"><span>{lead.headline}</span></div>
                </div>
              </div>
              <div className="cand-actions">
                <button className="btn-invite" onClick={() => sendLead(patient.id, lead.draftMessage)}>אשר ושלח</button>
              </div>
            </div>
          ))}

          {/* Review nudges */}
          <div className="feed-seg"><span className="t">הצעה לבקש ביקורת</span></div>
          {reviewNudges.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>אין מטופלים שביקרו לאחרונה</div>}
          {reviewNudges.slice(0, 4).map(patient => (
            <div key={patient.id} className="inv-row">
              <div className="sci" style={{ background: patient.avatarColor }}>{patient.initials}</div>
              <div><div className="nm">{patient.name}</div><div className="stt">ביקר/ה לאחרונה — הזדמנות לבקש ביקורת</div></div>
              <button className="btn-invite" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => sendReviewAsk(patient.id, patient.name)}>בקש ביקורת</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
