'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PostJobModal from '@/components/PostJobModal';
import GapTriggerModal from '@/components/GapTriggerModal';
import Toasts from '@/components/Toasts';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת', host: 'מארח/ת',
  delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

function agoHe(dateStr: string): string {
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return dateStr;
  const days = Math.round((Date.now() - d) / 86400000);
  if (days <= 0) return 'היום';
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

export default function JobsPage() {
  const store = useStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  if (!hydrated) return null;

  const jobs = store.jobs;
  const activeJobs = jobs.filter(j => j.status === 'active');
  const newCount = store.newCandidateCount();

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={newCount} activeJobCount={activeJobs.length} />
      <div className="body">
        <main className="main">
          <div className="feed">
            <div className="scr-title">משרות</div>

            <button className="leaver-card" onClick={() => setGapOpen(true)}>
              <div className="ic">!</div>
              <div>
                <div className="nm">עובד/ת עזב/ה?</div>
                <div className="ds">דווח עכשיו — נמצא מחליף מתאים תוך דקות</div>
              </div>
            </button>

            <button className="post-btn" onClick={() => setPostOpen(true)}>+ פרסם משרה חדשה</button>

            {jobs.map(job => {
              const ranked = store.rankedForJob(job.id);
              const invited = store.invitedIdsForJob(job.id).length;
              return (
                <button key={job.id} className="job-card" onClick={() => router.push(`/jobs/${job.id}`)}>
                  <div className="jh">
                    <div className="jt">{ROLE_HE[job.role] ?? job.role}</div>
                    {job.status === 'active' && <span className="live"><span className="d" />פעילה</span>}
                  </div>
                  <div className="jm">
                    <span>מתאימים <b>{ranked.length}</b></span>
                    <span>הוזמנו <b>{invited}</b></span>
                    <span>פורסם <b>{agoHe(job.createdAt)}</b></span>
                  </div>
                </button>
              );
            })}

            {jobs.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <h3>אין משרות עדיין</h3><p>פרסם את המשרה הראשונה שלך כדי להתחיל לקבל מועמדים.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav newCount={newCount} activeJobCount={activeJobs.length} />
      <PostJobModal open={postOpen} onClose={() => setPostOpen(false)} />
      <GapTriggerModal open={gapOpen} onClose={() => setGapOpen(false)} />
      <Toasts />
    </div>
  );
}
