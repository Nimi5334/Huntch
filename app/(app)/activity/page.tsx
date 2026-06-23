'use client';
import { useStore } from '@/lib/store';

export default function ActivityFeed() {
  const store = useStore();
  const invites = store.invites.slice(0, 8);
  const scans = store.qrScansForBusiness(store.business.id).slice(0, 4);
  const highChurnCandidates = store.pool.filter(c => {
    const { signals } = c;
    return signals.lastActiveDaysAgo > 11 || signals.responseSpeedHours > 9;
  }).slice(0, 3);

  type FeedEvent = { id: string; icon: string; text: string; sub: string; color?: string };
  const events: FeedEvent[] = [];

  invites.forEach(inv => {
    const cand = store.pool.find(c => c.id === inv.candidateId);
    const job = store.jobs.find(j => j.id === inv.jobId);
    if (!cand || !job) return;
    if (inv.status === 'responded') {
      events.push({ id: `inv-${inv.id}`, icon: '✓', text: `${cand.name} אישר/ה הזמנה`, sub: job.role, color: '#16a34a' });
    } else if (inv.status === 'declined') {
      events.push({ id: `inv-${inv.id}`, icon: '✕', text: `${cand.name} סירב/ה`, sub: job.role, color: '#b91c1c' });
    } else {
      events.push({ id: `inv-${inv.id}`, icon: '→', text: `הזמנה נשלחה ל${cand.name}`, sub: job.role });
    }
  });

  scans.forEach((scan, i) => {
    events.push({ id: `scan-${i}`, icon: 'QR', text: 'סריקת QR חדשה', sub: `נכנס/ה למאגר` });
  });

  highChurnCandidates.forEach(c => {
    events.push({ id: `churn-${c.id}`, icon: '⚠', text: `סיכון עזיבה: ${c.name}`, sub: 'ציון DNA ירד — כדאי לבדוק', color: '#b45309' });
  });

  if (events.length === 0) {
    events.push({ id: 'empty', icon: '✦', text: 'Huntch עובד ברקע', sub: 'אירועים יופיעו כאן כשיהיו פעילויות' });
  }

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="scr-title">מה קורה</div>
          <p style={{ fontSize: 13, color: 'var(--muted-text, #7c6f63)', marginBottom: 16 }}>
            הפעולות האוטומטיות של Huntch — בזמן אמת
          </p>

          {events.map(ev => (
            <div key={ev.id} className="inv-row" style={{ alignItems: 'flex-start' }}>
              <div className="sci" style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                {ev.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="nm" style={{ color: ev.color }}>{ev.text}</div>
                <div className="stt">{ev.sub}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, padding: '14px', background: 'var(--paper)', borderRadius: 14, border: '1px solid rgba(124,92,62,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--cedar)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Employee App / WhatsApp Copilot
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted-text, #7c6f63)' }}>
              ממשק עובד מלא דרך WhatsApp — בקרוב
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
