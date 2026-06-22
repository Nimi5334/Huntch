'use client';
import { use, useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import PostJobModal from '@/components/PostJobModal';
import GapTriggerModal from '@/components/GapTriggerModal';
import Toasts, { addToast } from '@/components/Toasts';
import Link from 'next/link';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת',
  host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

export default function RespondersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const job = store.jobs.find(j => j.id === id);
  const invitedIds = store.invitedIdsForJob(id);
  const responders = store.respondersForJob(id);

  const handleSimulate = () => {
    setSimulating(true);
    setTimeout(() => {
      store.simulateResponses(id);
      setSimulating(false);
      addToast('g', 'תגובות נכנסו — ראה מי ענה');
    }, 1800);
  };

  return (
    <div className="app">
      <Header />
      <div className="body">
        <Sidebar
          newCount={store.newCandidateCount()}
          invitedCount={store.invitedCount()}
          activeJobCount={store.jobs.filter(j => j.status === 'active').length}
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
            <Link href={`/jobs/${id}`}>
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              {job ? ROLE_HE[job.role] ?? job.role : 'משרה'}
            </Link>
            <span className="crumb-sep">›</span>
            <span className="page-title">מגיבים</span>
          </div>

          {/* WhatsApp outreach banner */}
          <div className="wa-banner">
            <svg viewBox="0 0 24 24">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <div>
              <strong>Huntch WhatsApp Business</strong> — מספר שיתופי ·{' '}
              <strong>Meta direct BSP</strong><br/>
              {`ההזמנות נשלחות בשמכם ("${store.business.name}") ממספר Huntch המשותף.`}
              כל המועמדים הסכימו לקבל הודעות (opt-in בלבד).{' '}
              <span style={{ color: '#aaa' }}>שיעור שליחה: 1 הודעה/שעה/מועמד</span>
              {invitedIds.length > 0 && (
                <>
                  <br/>
                  <strong style={{ color: '#555' }}>{invitedIds.length} הזמנות נשלחו</strong>
                  {responders.length === 0 && (
                    <>
                      {' · '}
                      <button className="simulate-btn" onClick={handleSimulate} disabled={simulating}
                        style={{ display: 'inline-flex', padding: '4px 10px', fontSize: 11.5, marginTop: 0, verticalAlign: 'middle' }}>
                        {simulating ? 'מחכה לתגובות...' : 'סמלץ תגובות'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {responders.length > 0 ? (
            <>
              <div className="section-hd">
                <span className="section-title">{responders.length} הגיבו בחיוב</span>
              </div>
              <div className="cands">
                {responders.map(({ invite, ...cand }) => (
                  <div key={cand.id} className="resp-card">
                    <div className="av" style={{ background: cand.avatarColor }}>{cand.initials}</div>
                    <div className="cand-info">
                      <div className="cand-name">{cand.name}</div>
                      <div className="cand-facts">
                        <span>{cand.neighborhood}</span>
                        <span className="cdot" />
                        <span>ענה/תה לפני {invite.respondedAt ? Math.round((Date.now() - new Date(invite.respondedAt).getTime()) / 60000) : 0} דק׳</span>
                      </div>
                    </div>
                    <div className="cand-right">
                      <button
                        className="btn-contact"
                        onClick={() => addToast('g', `פתח/י WhatsApp עם ${cand.name}`)}
                      >
                        <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        שלח/י ראיון
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <h3>אין מגיבים עדיין</h3>
              {invitedIds.length === 0 ? (
                <p>
                  <Link href={`/jobs/${id}`} style={{ color: '#c47820', fontWeight: 700 }}>
                    הזמינו מועמדים
                  </Link>{' '}
                  קודם
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <p>שלחנו הזמנות ל{invitedIds.length} מועמדים</p>
                  <button className="simulate-btn" onClick={handleSimulate} disabled={simulating}>
                    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {simulating ? 'מחכה...' : 'סמלץ תגובות נכנסות'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <BottomNav onPostJob={() => setPostOpen(true)} />
      <PostJobModal open={postOpen} onClose={() => setPostOpen(false)} />
      <GapTriggerModal open={gapOpen} onClose={() => setGapOpen(false)} />
      <Toasts />
    </div>
  );
}
