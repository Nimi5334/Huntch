'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { canUse } from '@/lib/plan';
import UpgradeLock from '@/components/UpgradeLock';

const KIND_HE: Record<string, string> = {
  reactivation: 'פנייה להחזרת מטופל',
  quality_check: 'בדיקת איכות',
  wellbeing: 'בדיקת שלום',
  review: 'בקשת ביקורת',
};
const STATUS_HE: Record<string, string> = {
  draft: 'טיוטה', approved: 'אושר', sent: 'נשלח', replied: 'התקבלה תגובה', declined: 'נדחה', no_reply: 'ללא מענה',
};

function fmtTime(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

type Entry =
  | { id: string; when: string; kind: 'outreach'; patientId: string; label: string; status: string }
  | { id: string; when: string; kind: 'escalation'; patientId: string; label: string; status: string };

export default function ActivityPage() {
  const store = useStore();
  const gated = !canUse(store.clinic, 'roi_dashboard');

  if (gated) {
    return <UpgradeLock title="יומן הפעילות זמין בתוכנית המתקדמת" description="עקבו אחרי כל פעולה שהמערכת ביצעה — פניות, בדיקות ובקשות ביקורת. שדרג/י כדי לפתוח את הפיצ'ר." />;
  }

  const entries: Entry[] = [
    ...store.outreach.map(o => ({
      id: o.id,
      when: o.sentAt ?? o.createdAt,
      kind: 'outreach' as const,
      patientId: o.patientId,
      label: KIND_HE[o.kind] ?? o.kind,
      status: STATUS_HE[o.status] ?? o.status,
    })),
    ...store.escalations.filter(e => e.status === 'handled').map(e => ({
      id: e.id,
      when: e.createdAt,
      kind: 'escalation' as const,
      patientId: e.patientId,
      label: 'פנייה טופלה על ידי הצוות',
      status: 'טופל',
    })),
  ].sort((a, b) => b.when.localeCompare(a.when));

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg"><span className="t">יומן פעילות</span></div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            היסטוריית הפעולות שהמערכת ביצעה עבור המרפאה — מהחדש לישן.
          </p>

          {entries.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <h3>אין פעילות עדיין</h3>
              <p>ברגע שהמערכת תשלח פנייה או תטפל במשימה, היא תופיע כאן.</p>
            </div>
          )}

          {entries.map(e => {
            const patient = store.patientById(e.patientId);
            const isReplied = e.status === 'התקבלה תגובה';
            const isSent = e.status === 'נשלח';
            const isHandled = e.status === 'טופל';
            return (
              <Link key={`${e.kind}-${e.id}`} href={`/patients/${e.patientId}`} className="inv-row">
                <div className="sci" style={{ background: patient?.avatarColor }}>{patient?.initials}</div>
                <div><div className="nm">{patient?.name}</div><div className="stt">{e.label} · {fmtTime(e.when)}</div></div>
                <span className={`inv-badge2 ${isReplied || isHandled ? 'b-yes' : isSent ? 'b-wait' : ''}`}>{e.status}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
