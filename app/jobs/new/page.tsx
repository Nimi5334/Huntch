'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import PostJobModal from '@/components/PostJobModal';
import GapTriggerModal from '@/components/GapTriggerModal';
import Toasts from '@/components/Toasts';
import Link from 'next/link';

export default function NewJobPage() {
  const [hydrated, setHydrated] = useState(false);
  const [postOpen, setPostOpen] = useState(true); // open modal immediately
  const [gapOpen, setGapOpen] = useState(false);
  const store = useStore();
  const router = useRouter();

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const activeJobs = store.jobs.filter(j => j.status === 'active');

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={store.newCandidateCount()} activeJobCount={activeJobs.length} />
      <div className="body">
        <Sidebar
          newCount={store.newCandidateCount()}
          invitedCount={store.invitedCount()}
          activeJobCount={activeJobs.length}
          onPostJob={() => setPostOpen(true)}
          onGapTrigger={() => setGapOpen(true)}
        />

        <main className="main">
          <div className="page-title-row">
            <Link href="/">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              דאשבורד
            </Link>
            <span className="crumb-sep">›</span>
            <span className="page-title">משרות</span>
          </div>

          {/* Active jobs */}
          <div>
            <div className="section-hd" style={{ marginBottom: 12 }}>
              <span className="section-title">{activeJobs.length} משרות פעילות</span>
              <button className="btn-post" onClick={() => setPostOpen(true)} style={{ padding: '7px 14px', fontSize: 12 }}>
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                משרה חדשה
              </button>
            </div>

            {activeJobs.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <h3>אין משרות פעילות</h3>
                <p>פרסם משרה חדשה כדי להתחיל</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeJobs.map(job => {
                  const ranked = store.rankedForJob(job.id);
                  const invitedCount = store.invitedIdsForJob(job.id).length;
                  const ROLE_HE: Record<string, string> = {
                    barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
                    dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת',
                    host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
                  };
                  const SHIFT_HE: Record<string, string> = {
                    morning: 'בקרים', afternoon: 'צהריים', evening: 'ערבים', night: 'לילות', weekend: 'סופ״ש',
                  };
                  return (
                    <div key={job.id} style={{
                      padding: '16px 18px',
                      background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 5 }}>
                          {ROLE_HE[job.role] ?? job.role}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#bbb', display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                          <span>{job.shifts.map(s => SHIFT_HE[s]).join('/')}</span>
                          <span className="cdot" />
                          <span>{job.wageNis ? `₪${job.wageNis}/שעה` : 'שכר לא צוין'}</span>
                          <span className="cdot" />
                          <span>פורסם {job.createdAt}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono,monospace)', fontSize: 12, fontWeight: 600, color: '#2e6b46',
                        }}>
                          {ranked.length} מתאימים
                        </span>
                        {invitedCount > 0 && (
                          <span style={{ fontSize: 11, color: '#1d7a50', fontWeight: 700 }}>
                            {invitedCount} הוזמנו
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/jobs/${job.id}`} className="btn-invite" style={{ fontSize: 12, padding: '6px 12px' }}>
                          צפה
                        </Link>
                        <Link href={`/apply/${job.id}`} className="ico" title="לינק להגשה" style={{ textDecoration: 'none' }}>
                          <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Flow 1 locked */}
          <div style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'rgba(0,0,0,0.03)', border: '1px dashed rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                padding: '3px 9px', borderRadius: 100, fontSize: 10.5, fontWeight: 700,
                background: '#16241a', color: '#fff',
              }}>פרו</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#555' }}>Flow 1 — הזמנה אוטומטית</span>
            </div>
            <p style={{ fontSize: 12, color: '#aaa' }}>
              המערכת מזמינה את כל המתאימים אוטומטית. תראו רק את המגיבים.
              זמין בחבילת פרו.
            </p>
          </div>
        </main>
      </div>

      <BottomNav newCount={store.newCandidateCount()} activeJobCount={activeJobs.length} />
      <PostJobModal open={postOpen} onClose={() => { setPostOpen(false); router.push('/'); }} />
      <GapTriggerModal open={gapOpen} onClose={() => setGapOpen(false)} />
      <Toasts />
    </div>
  );
}
