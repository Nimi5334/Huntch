'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function HiringHub() {
  const store = useStore();
  const activeJobs = store.jobs.filter(j => j.status === 'active');
  const newCount = store.newCandidateCount();
  const respondedCount = store.invites.filter(i => i.status === 'responded').length;
  const pendingCount = store.invites.filter(i => i.status === 'sent' || i.status === 'delivered').length;

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="scr-title">גיוס עובדים</div>

          {/* Funnel summary */}
          <div className="shift-sum-card" style={{ marginBottom: 12 }}>
            <div className="shift-sum-header">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              משפך גיוס — סטטוס עכשווי
            </div>
            <div className="shift-sum-stats">
              <div className="shift-sum-stat">
                <span className="shift-sum-num">{activeJobs.length}</span>
                <span className="shift-sum-lbl">משרות פעילות</span>
              </div>
              <div className="shift-sum-sep"/>
              <div className="shift-sum-stat">
                <span className="shift-sum-num">{newCount}</span>
                <span className="shift-sum-lbl">מועמדים חדשים</span>
              </div>
              <div className="shift-sum-sep"/>
              <div className="shift-sum-stat">
                <span className="shift-sum-num" style={{ color: respondedCount > 0 ? '#16a34a' : undefined }}>{respondedCount}</span>
                <span className="shift-sum-lbl">ענו בחיוב</span>
              </div>
              <div className="shift-sum-sep"/>
              <div className="shift-sum-stat">
                <span className="shift-sum-num">{pendingCount}</span>
                <span className="shift-sum-lbl">ממתינים</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="feed-seg"><span className="t">פעולות מהירות</span></div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Link href="/hiring/jobs/new" className="btn-full" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>+ פרסם משרה</Link>
            <Link href="/hiring/qr" className="btn-ghost" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>QR גיוס דרך</Link>
          </div>

          {/* Jobs list shortcut */}
          <div className="feed-seg"><span className="t">משרות</span><Link href="/hiring/jobs">כל המשרות ←</Link></div>
          {activeJobs.slice(0, 3).map(job => (
            <Link key={job.id} href={`/hiring/jobs/${job.id}`} className="fc in">
              <div className="fc-av" style={{ background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {job.role.slice(0,3).toUpperCase()}
              </div>
              <div className="fc-info">
                <div className="fc-name">{job.role}</div>
                <div className="fc-facts">
                  <span>{store.rankedForJob(job.id).length} מועמדים</span>
                </div>
              </div>
              <span style={{ color: 'var(--accent)', fontSize: 13 }}>←</span>
            </Link>
          ))}
          {activeJobs.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              <h3>אין משרות פעילות</h3>
              <p>פרסם משרה כדי להתחיל לגייס עובדים</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
