'use client';
import { useStore } from '@/lib/store';
import { canUse } from '@/lib/plan';
import UpgradeLock from '@/components/UpgradeLock';

const KIND_HE: Record<string, string> = {
  reactivation: 'לחזרה',
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

export default function ActivityPage() {
  const store = useStore();
  const gated = !canUse(store.clinic, 'roi_dashboard');

  if (gated) {
    return <UpgradeLock title="לוח ROI זמין בתוכנית המתקדמת" description="עקבו אחרי הכנסה שהוחזרה מול פוטנציאל נטוש — שדרג/י כדי לפתוח את הפיצ'ר." />;
  }

  const roi = store.roiSummary();
  const timeline = [...store.outreach].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const funnel = {
    draft: store.outreach.filter(o => o.status === 'draft').length,
    sent: store.outreach.filter(o => o.status === 'sent').length,
    replied: store.outreach.filter(o => o.status === 'replied').length,
    noReply: store.outreach.filter(o => o.status === 'no_reply' || o.status === 'declined').length,
  };

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg"><span className="t">החזר השקעה</span></div>

          <div className="dna-section" style={{ marginTop: 0 }}>
            <div className="dna-top">
              <div className="dna-big">
                <div className="dna-big-num" style={{ color: '#16a34a' }}>₪{roi.recoveredRevenue.toLocaleString()}</div>
                <div className="dna-big-lbl">הוחזר בפועל</div>
              </div>
              <div className="dna-big">
                <div className="dna-big-num" style={{ color: 'var(--cedar)' }}>₪{roi.potentialRevenue.toLocaleString()}</div>
                <div className="dna-big-lbl">פוטנציאל נטוש</div>
              </div>
            </div>
            <div className="dna-sub-row"><span className="dna-sub-lbl">מטופלים שהופעלו מחדש</span><span className="dna-sub-val">{roi.reactivatedCount}</span></div>
            <div className="dna-sub-row"><span className="dna-sub-lbl">מטופלים רדומים</span><span className="dna-sub-val">{roi.dormantCount}</span></div>
          </div>

          <div className="feed-seg"><span className="t">משפך פניות</span></div>
          <div className="dna-section">
            <div className="dna-sub-row"><span className="dna-sub-lbl">טיוטות ממתינות לאישור</span><span className="dna-sub-val">{funnel.draft}</span></div>
            <div className="dna-sub-row"><span className="dna-sub-lbl">נשלחו</span><span className="dna-sub-val">{funnel.sent}</span></div>
            <div className="dna-sub-row"><span className="dna-sub-lbl">התקבלה תגובה</span><span className="dna-sub-val">{funnel.replied}</span></div>
            <div className="dna-sub-row"><span className="dna-sub-lbl">ללא מענה / נדחה</span><span className="dna-sub-val">{funnel.noReply}</span></div>
          </div>

          <div className="feed-seg"><span className="t">ציר זמן פניות</span></div>
          {timeline.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>אין פעילות עדיין</div>}
          {timeline.map(o => {
            const patient = store.patientById(o.patientId);
            return (
              <div key={o.id} className="inv-row">
                <div className="sci" style={{ background: patient?.avatarColor }}>{patient?.initials}</div>
                <div><div className="nm">{patient?.name}</div><div className="stt">{KIND_HE[o.kind]} · {fmtTime(o.sentAt ?? o.createdAt)}</div></div>
                <span className={`inv-badge2 ${o.status === 'replied' ? 'b-yes' : o.status === 'sent' ? 'b-wait' : ''}`}>{STATUS_HE[o.status]}</span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
