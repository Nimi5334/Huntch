'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { canUse } from '@/lib/plan';
import UpgradeLock from '@/components/UpgradeLock';

const REASON_HE: Record<string, string> = {
  complex_question: 'שאלה מורכבת',
  complaint: 'תלונה',
  medical_concern: 'חשש רפואי',
  reschedule: 'בקשת שינוי תור',
  other: 'אחר',
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function InboxPage() {
  const store = useStore();
  const gated = !canUse(store.clinic, 'ai_brain');

  if (gated) {
    return <UpgradeLock title="תיבת הפניות זמינה בתוכנית המתקדמת" description="פניות שדורשות התערבות אנושית מרוכזות כאן — שדרג/י כדי לפתוח את הפיצ'ר." />;
  }

  const pending = store.escalations.filter(e => e.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const handled = store.escalations.filter(e => e.status === 'handled').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg"><span className="t">פניות ממתינות · {pending.length}</span></div>
          {pending.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              <h3>אין פניות ממתינות</h3>
              <p>כל הפניות טופלו.</p>
            </div>
          )}
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
                {e.snippet && <div style={{ padding: '0 4px 10px', fontSize: 13, color: '#7c6f63' }}>"{e.snippet}"</div>}
                <div className="cand-actions">
                  <button className="btn-invite" onClick={() => { store.resolveEscalation(e.id); addToast('g', 'הפנייה סומנה כטופלה'); }}>טופל</button>
                </div>
              </div>
            );
          })}

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
