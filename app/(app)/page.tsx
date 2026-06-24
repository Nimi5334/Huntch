'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MinimalButton from '@/components/ui/minimal-button';
import { ROLE_HE } from '@/lib/venue';
import type { ShiftType } from '@/lib/types';

export default function Dashboard() {
  const store = useStore();
  const router = useRouter();
  const [showDaily, setShowDaily] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (arrivedRef.current) return;
    const t = setTimeout(() => { arrivedRef.current = true; addToast('g', 'מועמדת חדשה נכנסה הרגע'); }, 5500);
    return () => clearTimeout(t);
  }, []);

  const activeJobs = store.jobs.filter(j => j.status === 'active');
  // Unique roles that have at least one active job — drives the home filter chips
  const uniqueActiveRoles = [...new Set(activeJobs.map(j => j.role))];
  // Pick the job matching the selected role chip, or fall back to the first active job
  const featuredJob = (roleFilter ? activeJobs.find(j => j.role === roleFilter) : null) ?? activeJobs[0] ?? null;
  const featuredJobId = featuredJob?.id ?? null;
  const ranked = featuredJobId ? store.rankedForJob(featuredJobId) : [];
  const invitedIds = new Set(featuredJobId ? store.invitedIdsForJob(featuredJobId) : []);
  const newCount = store.pool.filter(c => !invitedIds.has(c.id)).length;
  const matches = ranked.filter(c => !invitedIds.has(c.id)).slice(0, 5);

  // AI Daily Shift Summary
  const ALL_SHIFTS: ShiftType[] = ['morning', 'afternoon', 'evening'];
  const shiftSummaryData = activeJobs.map(job => {
    const required: ShiftType[] = job.shifts.length > 0 ? job.shifts as ShiftType[] : ALL_SHIFTS;
    const respondedCands = store.invites
      .filter(i => i.jobId === job.id && i.status === 'responded')
      .map(i => store.pool.find(c => c.id === i.candidateId))
      .filter(Boolean);
    const covered = new Set<ShiftType>();
    respondedCands.forEach(c => c!.availability.shifts.forEach(s => covered.add(s as ShiftType)));
    const gaps = required.filter(s => !covered.has(s));
    return { job, required, gaps, confirmedCount: respondedCands.length };
  });
  const totalSlots = shiftSummaryData.reduce((s, d) => s + d.required.length, 0);
  const totalGaps = shiftSummaryData.reduce((s, d) => s + d.gaps.length, 0);
  const totalConfirmed = shiftSummaryData.reduce((s, d) => s + d.confirmedCount, 0);
  const SHIFT_HE: Record<string, string> = { morning: 'בוקר', afternoon: 'צהריים', evening: 'ערב', night: 'לילה', weekend: 'סופ״ש' };

  const aiShiftLine = (() => {
    if (activeJobs.length === 0) return 'אין משרות פעילות — פרסם משרה כדי להתחיל.';
    if (totalGaps === 0 && totalSlots > 0) return `כל ${totalSlots} המשמרות מכוסות — העסק ערוך להיום. 🎉`;
    if (totalGaps > 0) {
      const urgentJob = shiftSummaryData.find(d => d.gaps.length > 0);
      const gapNames = urgentJob?.gaps.map(g => SHIFT_HE[g]).join(', ') ?? '';
      return `${totalGaps} משמרות פתוחות${gapNames ? ` (${gapNames})` : ''} — המלצה: שלח הזמנות מהמאגר.`;
    }
    return 'עדכן את לוח המשמרות כדי לקבל תחזית.';
  })();

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
    <>
      <div className="body">
        <main className="main">
          <div className="feed">

            {/* "מה חדש היום" — gradient toggle → compact floating panel */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 4, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setShowDaily(v => !v)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 border-0 cursor-pointer"
                style={{ background: 'linear-gradient(130deg, #4a7a5a 0%, #7c5c3e 100%)' }}
                aria-label="מה חדש היום"
              >
                <span className="ml-2 flex shrink-0 border-l border-white/30 pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} fill="none">
                    <path fill="white" d="M6.958.713a1 1 0 0 0-1.916 0l-.999 3.33-3.33 1a1 1 0 0 0 0 1.915l3.33.999 1 3.33a1 1 0 0 0 1.915 0l.999-3.33 3.33-1a1 1 0 0 0 0-1.915l-3.33-.999-1-3.33Z"/>
                  </svg>
                </span>
                {`מה חדש היום, ${store.business.operatorName || 'מנהל'}`}
              </button>

              <AnimatePresence>
                {showDaily && (
                  <motion.div
                    key="daily-panel"
                    dir="rtl"
                    initial={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 22 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      marginLeft: -136,
                      marginTop: 8,
                      width: 272,
                      zIndex: 50,
                      background: '#ffffff',
                      border: '1px solid rgba(124,92,62,0.14)',
                      borderRadius: 18,
                      boxShadow: '0 8px 28px rgba(124,92,62,0.14)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Task */}
                    <div style={{ padding: '11px 14px 9px' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.07em', color: '#7c5c3e', opacity: 0.7, textTransform: 'uppercase', marginBottom: 3 }}>המשימה של היום</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#221b16' }}>{newCount} מועמדים ממתינים לתשובה</div>
                      <MinimalButton
                        className="mt-2 w-full text-[12.5px]"
                        onClick={() => {
                          setShowDaily(false);
                          if (featuredJobId) router.push(`/hiring/jobs/${featuredJobId}`);
                          else router.push('/hiring/jobs/new');
                        }}
                      >עבור על המועמדים</MinimalButton>
                    </div>

                    <div style={{ height: 1, background: 'rgba(124,92,62,0.1)' }} />

                    {/* Shifts */}
                    <div style={{ padding: '9px 14px 11px' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.07em', color: '#7c5c3e', opacity: 0.7, textTransform: 'uppercase', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        סיכום משמרות — AI
                      </div>
                      <div style={{ fontSize: 11.5, color: '#7c6f63', lineHeight: 1.45 }}>{aiShiftLine}</div>
                      {activeJobs.length > 0 && (
                        <div style={{ display: 'flex', marginTop: 8 }}>
                          {[
                            { n: totalSlots - totalGaps, l: 'מכוסות', c: '#16a34a' },
                            { n: totalGaps, l: 'חסרות', c: totalGaps > 0 ? '#b91c1c' : '#16a34a' },
                            { n: totalConfirmed, l: 'מאושרים', c: '#221b16' },
                          ].map((s, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i > 0 ? '1px solid rgba(124,92,62,0.1)' : 'none' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.n}</div>
                              <div style={{ fontSize: 10, color: '#7c6f63' }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Link href="/workforce/schedule" style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#4a7a5a', textDecoration: 'none' }}>לוח משמרות מלא ←</Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MATCHES — applicants ranked for the most urgent open job */}
            <div id="matches" className="feed-seg">
              <span className="t">{featuredJob ? 'מועמדים מובילים' : 'מועמדים שהגישו מועמדות'}</span>
              {featuredJobId && <Link href={`/hiring/jobs/${featuredJobId}`}>ראה הכל ←</Link>}
            </div>

            {/* Role filter chips — only roles with active jobs (demo: barista only) */}
            {uniqueActiveRoles.length > 0 && (
              <div className="filter-chips" style={{ paddingBottom: 14 }}>
                {uniqueActiveRoles.map(role => (
                  <button
                    key={role}
                    className={`chip${roleFilter === role ? ' on' : ''}`}
                    onClick={() => setRoleFilter(prev => prev === role ? null : role)}
                  >
                    {ROLE_HE[role] ?? role}
                  </button>
                ))}
              </div>
            )}

            {matches.map((c, i) => (
              <Link key={c.id} href={`/candidate/${c.id}?job=${featuredJobId ?? ''}`} className="fc in" style={{ transitionDelay: `${i * 40}ms` }}>
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
                <h3>{featuredJob ? 'עברת על כולם' : 'אין משרות פעילות'}</h3>
                <p>{featuredJob ? 'אין מועמדים חדשים כרגע — נעדכן כשמישהו חדש מצטרף.' : 'פרסם משרה ראשונה בגיוס כדי לראות מועמדים מתאימים.'}</p>
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
            <Link href="/hiring/qr" className="qr-compact">
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
    </>
  );
}
