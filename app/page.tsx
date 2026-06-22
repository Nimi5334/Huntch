'use client';
import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Toasts, { addToast } from '@/components/Toasts';
import Link from 'next/link';

const DEMO_JOB_ID = 'job-1';
const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת', host: 'מארח/ת',
  delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

export default function Dashboard() {
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const arrivedRef = useRef(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated || arrivedRef.current) return;
    const t = setTimeout(() => { arrivedRef.current = true; addToast('g', 'מועמדת חדשה נכנסה הרגע'); }, 5500);
    return () => clearTimeout(t);
  }, [hydrated]);

  if (!hydrated) return null;

  const ranked = store.rankedForJob(DEMO_JOB_ID);
  const invitedIds = new Set(store.invitedIdsForJob(DEMO_JOB_ID));
  const newCount = store.newCandidateCount();
  const activeJobs = store.jobs.filter(j => j.status === 'active');
  const matches = ranked.filter(c => !invitedIds.has(c.id)).slice(0, 5);

  const sentInvites = store.invites.slice(0, 4).map(inv => {
    const cand = store.pool.find(c => c.id === inv.candidateId);
    return cand ? { inv, cand } : null;
  }).filter(Boolean) as { inv: typeof store.invites[number]; cand: typeof store.pool[number] }[];

  const scanCount = store.qrScansForBusiness(store.business.id).length;

  const inviteStatusBadge = (status: string) => {
    if (status === 'responded') return <span className="inv-badge2 b-yes">אישר/ה ✓</span>;
    if (status === 'declined') return <span className="inv-badge2" style={{ background: '#fbe9e9', color: '#b91c1c' }}>סירב/ה</span>;
    return <span className="inv-badge2 b-wait">ממתין/ה</span>;
  };

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={newCount} activeJobCount={activeJobs.length} />
      <div className="body">
        <main className="main">
          <div className="feed">

            {/* FOCUS — today's task */}
            <section className="focus-card">
              <div className="focus-k">המשימה של היום</div>
              <h2>{newCount} מועמדים חדשים מחכים לתשובה</h2>
              <p>חלקם זמינים מיידית למשרת הבריסטה. ענה היום כדי לא לאבד אותם — מועמדים טובים נחטפים תוך 24 שעות.</p>
              <button className="focus-cta" onClick={() => document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' })}>
                עבור על המועמדים
              </button>
            </section>

            {/* MATCHES */}
            <div id="matches" className="feed-seg">
              <span className="t">הכי מתאימים — בריסטה</span>
              <Link href={`/jobs/${DEMO_JOB_ID}`}>ראה הכל ←</Link>
            </div>
            {matches.map((c, i) => (
              <Link key={c.id} href={`/candidate/${c.id}?job=${DEMO_JOB_ID}`} className="fc in" style={{ transitionDelay: `${i * 40}ms` }}>
                <div className="fc-av" style={{ background: c.avatarColor }}>{c.initials}</div>
                <div className="fc-info">
                  <div className="fc-name">{c.name}</div>
                  <div className="fc-facts">
                    {c.reasonFacts.slice(0, 3).map((f, j) => (
                      <span key={j}>{j > 0 && <span className="cdot" />}{f}</span>
                    ))}
                  </div>
                </div>
                <div className="fc-fit"><div className="pc">{c.score}</div><div className="pl">התאמה</div></div>
              </Link>
            ))}
            {matches.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <h3>עברת על כולם</h3><p>אין מועמדים חדשים כרגע. נעדכן כשמישהו חדש מצטרף.</p>
              </div>
            )}

            {/* INVITES SENT */}
            {sentInvites.length > 0 && (
              <>
                <div className="feed-seg"><span className="t">הזמנות שנשלחו</span></div>
                {sentInvites.map(({ inv, cand }) => (
                  <div key={inv.id} className="inv-row">
                    <div className="sci" style={{ background: cand.avatarColor }}>{cand.initials}</div>
                    <div>
                      <div className="nm">{cand.name}</div>
                      <div className="stt">הוזמן/ה למשרת {ROLE_HE[store.jobs.find(j => j.id === inv.jobId)?.role ?? 'barista']}</div>
                    </div>
                    {inviteStatusBadge(inv.status)}
                  </div>
                ))}
              </>
            )}

            {/* QR COMPACT */}
            <div className="feed-seg"><span className="t">גיוס דרך QR</span></div>
            <Link href="/qr" className="qr-compact">
              <div className="sq"><div className="qr-glyph" /></div>
              <div>
                <div className="nm">הקוד שלך לגיוס</div>
                <div className="ds">{scanCount} נרשמו · הוסף עובדים למאגר שלך</div>
              </div>
              <span className="go">←</span>
            </Link>

          </div>
        </main>
      </div>
      <BottomNav newCount={newCount} activeJobCount={activeJobs.length} />
      <Toasts />
    </div>
  );
}
