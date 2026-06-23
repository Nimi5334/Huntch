'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { rankPool } from '@/lib/matching';
import type { ShiftType } from '@/lib/types';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת',
  host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

const SHIFT_HE: Record<string, string> = {
  morning: 'בוקר', afternoon: 'צהריים', evening: 'ערב', night: 'לילה', weekend: 'סופ״ש',
};

const ALL_SHIFTS: ShiftType[] = ['morning', 'afternoon', 'evening', 'night', 'weekend'];

export default function SchedulePage() {
  const store = useStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  useEffect(() => { if (hydrated && !store.isLoggedIn) router.replace('/login'); }, [hydrated, store.isLoggedIn, router]);
  if (!hydrated || !store.isLoggedIn) return null;

  const activeJobs = store.jobs.filter(j => j.status === 'active');
  const newCount = store.newCandidateCount();
  const activeJobCount = activeJobs.length;

  // For each job: compute shift coverage
  const jobData = activeJobs.map(job => {
    const requiredShifts = job.shifts.length > 0 ? job.shifts : ALL_SHIFTS.slice(0, 3);

    // Candidates who responded to this job's invites
    const respondedInvites = store.invites.filter(i => i.jobId === job.id && i.status === 'responded');
    const respondedCandidates = respondedInvites.map(inv => store.pool.find(c => c.id === inv.candidateId)).filter(Boolean);

    // Which shifts are covered by responded candidates
    const coveredShifts = new Set<ShiftType>();
    respondedCandidates.forEach(c => c!.availability.shifts.forEach(s => coveredShifts.add(s)));

    // Gaps
    const gaps = requiredShifts.filter(s => !coveredShifts.has(s));

    // Smart suggestions for gaps (top matches from pool not yet invited)
    const invitedIds = new Set(store.invitedIdsForJob(job.id));
    const ranked = rankPool(store.pool.filter(c => !invitedIds.has(c.id)), job);
    const suggestions = ranked
      .filter(c => gaps.some(g => c.availability.shifts.includes(g)))
      .slice(0, 3);

    return { job, requiredShifts, coveredShifts, respondedCandidates, gaps, suggestions };
  });

  const totalGaps = jobData.reduce((s, d) => s + d.gaps.length, 0);

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={newCount} activeJobCount={activeJobCount} />
      <div className="body">
        <main className="main">
          <div className="feed">
            <div className="scr-title">לוח משמרות</div>

            {/* Summary */}
            <div className="sch-summary">
              <div className="sch-sum-item">
                <span className="sch-sum-num">{activeJobCount}</span>
                <span className="sch-sum-lbl">משרות פעילות</span>
              </div>
              <div className="sch-sum-sep" />
              <div className="sch-sum-item">
                <span className="sch-sum-num" style={{ color: totalGaps > 0 ? '#b91c1c' : '#16a34a' }}>{totalGaps}</span>
                <span className="sch-sum-lbl">חורים במשמרות</span>
              </div>
              <div className="sch-sum-sep" />
              <div className="sch-sum-item">
                <span className="sch-sum-num" style={{ color: '#16a34a' }}>
                  {jobData.reduce((s, d) => s + d.respondedCandidates.length, 0)}
                </span>
                <span className="sch-sum-lbl">מאושרים</span>
              </div>
            </div>

            {/* Gap alert banner */}
            {totalGaps > 0 && (
              <div className="sch-gap-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {totalGaps} משמרות ללא כיסוי — המערכת מציעה פתרונות למטה
              </div>
            )}

            {activeJobs.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <h3>אין משרות פעילות</h3>
                <p>פרסם משרה כדי לנהל משמרות</p>
              </div>
            )}

            {jobData.map(({ job, requiredShifts, coveredShifts, respondedCandidates, gaps, suggestions }) => (
              <div key={job.id} className="sch-card">
                {/* Job header */}
                <div className="sch-card-head">
                  <div>
                    <div className="sch-job-role">{ROLE_HE[job.role] ?? job.role}</div>
                    <div className="sch-job-addr">{job.locationAddress}</div>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="sch-job-link">פרטים ←</Link>
                </div>

                {/* Shift slots */}
                <div className="sch-slots">
                  {requiredShifts.map(shift => {
                    const filled = coveredShifts.has(shift);
                    const worker = filled
                      ? respondedCandidates.find(c => c!.availability.shifts.includes(shift))
                      : null;
                    return (
                      <div key={shift} className={`sch-slot ${filled ? 'filled' : 'gap'}`}>
                        <div className="sch-slot-shift">{SHIFT_HE[shift]}</div>
                        {filled && worker ? (
                          <>
                            <div className="sch-slot-av" style={{ background: worker.avatarColor }}>{worker.initials}</div>
                            <div className="sch-slot-name">{worker.name.split(' ')[0]}</div>
                          </>
                        ) : (
                          <>
                            <div className="sch-slot-gap-icon">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            </div>
                            <div className="sch-slot-name" style={{ color: '#b91c1c' }}>חסר עובד</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Smart suggestions for gaps */}
                {gaps.length > 0 && suggestions.length > 0 && (
                  <div className="sch-suggest">
                    <div className="sch-suggest-title">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      המלצות AI לכיסוי {gaps.map(g => SHIFT_HE[g]).join(', ')}
                    </div>
                    {suggestions.map(c => (
                      <Link key={c.id} href={`/candidate/${c.id}?job=${job.id}`} className="sch-suggest-row">
                        <div className="fc-av sm" style={{ background: c.avatarColor }}>{c.initials}</div>
                        <div className="sch-suggest-info">
                          <div className="sch-suggest-name">{c.name}</div>
                          <div className="sch-suggest-facts">
                            {c.availability.shifts.filter(s => gaps.includes(s)).map(s => SHIFT_HE[s]).join(' · ')}
                            {' · '}{c.experience.totalYears} שנות ניסיון
                          </div>
                        </div>
                        <div className="sch-suggest-score">{c.score}%</div>
                      </Link>
                    ))}
                  </div>
                )}

                {gaps.length === 0 && (
                  <div className="sch-all-good">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    כל המשמרות מכוסות
                  </div>
                )}
              </div>
            ))}

          </div>
        </main>
      </div>
      <BottomNav newCount={newCount} activeJobCount={activeJobCount} />
    </div>
  );
}
