'use client';
import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import CandidateCard from '@/components/CandidateCard';
import PostJobModal from '@/components/PostJobModal';
import GapTriggerModal from '@/components/GapTriggerModal';
import Toasts, { addToast } from '@/components/Toasts';
import QRPanel from '@/components/QRPanel';
import Link from 'next/link';

const DEMO_JOB_ID = 'job-1';
const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית',
  'line-cook': 'טבח קו', dishwasher: 'שטיפה', bartender: 'ברמן/ית',
  cashier: 'קופאי/ת', host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

export default function Dashboard() {
  const store = useStore();
  const [postOpen, setPostOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const arrivedRef = useRef(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || arrivedRef.current) return;
    const t = setTimeout(() => {
      arrivedRef.current = true;
      addToast('g', 'מועמדת חדשה נכנסה הרגע');
    }, 5500);
    return () => clearTimeout(t);
  }, [hydrated]);

  if (!hydrated) return null;

  const ranked = store.rankedForJob(DEMO_JOB_ID);
  const invitedIds = new Set(store.invitedIdsForJob(DEMO_JOB_ID));
  const newCount = store.newCandidateCount();
  const invCount = store.invitedCount();
  const activeJobs = store.jobs.filter(j => j.status === 'active');

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} />
      <div className="body">
        <Sidebar
          newCount={newCount}
          invitedCount={invCount}
          activeJobCount={activeJobs.length}
          onPostJob={() => setPostOpen(true)}
          onGapTrigger={() => setGapOpen(true)}
        />

        <main className="main">
          {/* Hero */}
          <div className="hero">
            <div className="hero-left">
              <div className="greeting">
                <span className="greeting-dot" />
                בוקר טוב, {store.business.operatorName}
              </div>
              <h1>
                <span className="hi">{newCount} מועמדים חדשים</span> התאימו<br />
                למשרת הבריסטה שלך
              </h1>
            </div>
            <button className="btn-post" onClick={() => setPostOpen(true)}>
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              פרסם משרה
            </button>
          </div>

          {/* Stats */}
          <div className="stats">
            <div className="stat-card">
              <div className="stat-num a">{newCount}</div>
              <div className="stat-label">מועמדים חדשים</div>
            </div>
            <div className="stat-card">
              <div className="stat-num g">{invCount}</div>
              <div className="stat-label">הוזמנו לראיון</div>
            </div>
            <div className="stat-card">
              <div className="stat-num n">{activeJobs.length}</div>
              <div className="stat-label">משרות פעילות</div>
            </div>
          </div>

          {/* Active jobs pills */}
          <div>
            <div className="section-hd">
              <span className="section-title">משרות פעילות</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeJobs.map(job => {
                const jRanked = store.rankedForJob(job.id);
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="job-pill">
                    <span className="active-dot" />
                    <span className="job-pill-role">{ROLE_HE[job.role] ?? job.role}</span>
                    <span className="job-pill-count">{jRanked.length} מתאימים</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* QR Panel */}
          <div style={{ marginBottom: 20 }}>
            <QRPanel
              businessId={store.business.id}
              businessName={store.business.name}
              scanCount={store.qrScansForBusiness(store.business.id).length}
            />
          </div>

          {/* Match list */}
          <div>
            <div className="section-hd">
              <span className="section-title">מועמדים מומלצים — בריסטה</span>
              <Link href={`/jobs/${DEMO_JOB_ID}`} style={{ fontSize: 12, fontWeight: 700, color: '#c47820' }}>
                ראה הכל עם פילטרים ←
              </Link>
            </div>
            <div className="cands">
              {ranked.slice(0, 6).map(c => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  isInvited={invitedIds.has(c.id)}
                  isSaved={store.savedCandidateIds.includes(c.id)}
                  onInvite={() => {
                    store.inviteCandidate(DEMO_JOB_ID, c.id);
                    addToast('g', `הזמנה נשלחה ל${c.name}`);
                  }}
                  onSave={() => {
                    store.saveCandidate(c.id);
                    addToast('a', 'נשמר למאגר שלך');
                  }}
                  onDismiss={() => store.dismissCandidate(c.id)}
                />
              ))}
              {ranked.length === 0 && (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <h3>אין מועמדים עדיין</h3>
                  <p>פרסם משרה או ייבא מועמדים למאגר</p>
                </div>
              )}
            </div>
          </div>

          {/* Gap trigger */}
          <div>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: 'rgba(196,120,32,0.06)', border: '1px solid rgba(196,120,32,0.18)',
                borderRadius: 12, cursor: 'pointer', width: '100%', textAlign: 'right',
                fontSize: 13, fontWeight: 700, color: '#a86515',
              }}
              onClick={() => setGapOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c47820" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              עזב/ה אצלך? דווח על עזיבה — נשלוף מהמאגר מיד
            </button>
          </div>
        </main>
      </div>

      <BottomNav onPostJob={() => setPostOpen(true)} />
      <PostJobModal open={postOpen} onClose={() => setPostOpen(false)} />
      <GapTriggerModal open={gapOpen} onClose={() => setGapOpen(false)} />
      <Toasts />
    </div>
  );
}
