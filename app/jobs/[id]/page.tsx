'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import CandidateCard from '@/components/CandidateCard';
import PostJobModal from '@/components/PostJobModal';
import GapTriggerModal from '@/components/GapTriggerModal';
import Toasts, { addToast } from '@/components/Toasts';
import Link from 'next/link';
import type { Role, ShiftType } from '@/lib/types';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת',
  host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
};

const ALL_SHIFTS: { value: ShiftType; label: string }[] = [
  { value: 'morning', label: 'בקרים' },
  { value: 'afternoon', label: 'צהריים' },
  { value: 'evening', label: 'ערבים' },
  { value: 'night', label: 'לילות' },
  { value: 'weekend', label: 'סופ״ש' },
];

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'barista', label: 'בריסטה' },
  { value: 'server', label: 'מלצר/ית' },
  { value: 'cook', label: 'טבח/ית' },
  { value: 'bartender', label: 'ברמן/ית' },
  { value: 'dishwasher', label: 'שטיפה' },
  { value: 'cashier', label: 'קופאי/ת' },
];

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);

  // Filter state
  const [maxDist, setMaxDist] = useState(10);
  const [selectedShifts, setSelectedShifts] = useState<ShiftType[]>([]);
  const [mustImmediate, setMustImmediate] = useState(false);
  const [minScore, setMinScore] = useState(70);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const job = store.jobs.find(j => j.id === id);
  if (!job) {
    return (
      <div className="app">
        <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={store.newCandidateCount()} activeJobCount={store.jobs.filter(j => j.status === 'active').length} />
        <div className="main">
          <div className="empty-state">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
            <h3>משרה לא נמצאה</h3>
            <Link href="/" style={{ color: '#2e6b46', fontWeight: 700, fontSize: 13 }}>חזרה לדאשבורד</Link>
          </div>
        </div>
      </div>
    );
  }

  // Apply filters
  const allRanked = store.rankedForJob(id);
  const filtered = allRanked.filter(c => {
    const dist = Math.sqrt(
      Math.pow((c.location.lat - job.location.lat) * 111, 2) +
      Math.pow((c.location.lng - job.location.lng) * 87, 2)
    );
    if (dist > maxDist) return false;
    if (selectedShifts.length > 0 && !selectedShifts.some(s => c.availability.shifts.includes(s))) return false;
    if (mustImmediate && !c.availability.immediate) return false;
    return true;
  });

  const invitedIds = new Set(store.invitedIdsForJob(id));
  const aboveThreshold = filtered.filter(c => c.score >= minScore && !invitedIds.has(c.id));

  const toggleShift = (s: ShiftType) =>
    setSelectedShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={store.newCandidateCount()} activeJobCount={store.jobs.filter(j => j.status === 'active').length} />
      <div className="body">
        <Sidebar
          newCount={store.newCandidateCount()}
          invitedCount={store.invitedCount()}
          activeJobCount={store.jobs.filter(j => j.status === 'active').length}
          onPostJob={() => setPostOpen(true)}
          onGapTrigger={() => setGapOpen(true)}
        />

        <div className="job-layout">
          {/* Filter panel */}
          <aside className="filter-panel">
            <div className="filter-head">פילטרים</div>

            <div className="filter-section">
              <div className="filter-label">משמרות</div>
              <div className="filter-chips">
                {ALL_SHIFTS.map(s => (
                  <button
                    key={s.value}
                    className={`chip${selectedShifts.includes(s.value) ? ' on' : ''}`}
                    onClick={() => toggleShift(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-label">מרחק מקסימלי</div>
              <div className="filter-range">
                <input
                  type="range" min={1} max={20} value={maxDist}
                  onChange={e => setMaxDist(+e.target.value)}
                />
                <span className="filter-range-val">עד {maxDist} ק״מ</span>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-label">ציון מינימלי להזמנה bulk</div>
              <div className="filter-range">
                <input
                  type="range" min={50} max={95} step={5} value={minScore}
                  onChange={e => setMinScore(+e.target.value)}
                />
                <span className="filter-range-val">≥ {minScore}%</span>
              </div>
            </div>

            <div className="filter-section">
              <div className="must-toggle">
                <label htmlFor="imm-toggle">זמינות מיידית בלבד</label>
                <button
                  id="imm-toggle"
                  className={`must-badge`}
                  onClick={() => setMustImmediate(p => !p)}
                  style={{ background: mustImmediate ? 'rgba(46,107,70,0.15)' : undefined }}
                >
                  {mustImmediate ? 'חובה ✓' : 'לא חובה'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, fontSize: 11.5, color: '#aaa' }}>
              <strong style={{ color: '#888', display: 'block', marginBottom: 4 }}>אופן חישוב ציון</strong>
              זמינות 30% · מרחק 25% · תפקיד+ניסיון 20% · כישורים 10% · שכר 10% · פעילות 5%
            </div>

            <div style={{ marginTop: 12 }}>
              <Link
                href={`/jobs/${id}/responders`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1d7a50', padding: '8px 0' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                מגיבים ({store.respondersForJob(id).length})
              </Link>
            </div>
          </aside>

          {/* Match list */}
          <div className="match-main">
            {/* Breadcrumb */}
            <div className="page-title-row">
              <Link href="/">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                דאשבורד
              </Link>
              <span className="crumb-sep">›</span>
              <span className="page-title">{ROLE_HE[job.role] ?? job.role}</span>
            </div>

            <div className="section-hd" style={{ marginBottom: 16 }}>
              <span className="section-title">{filtered.length} מועמדים · ממוינים לפי התאמה</span>
            </div>

            {/* Bulk invite bar */}
            {aboveThreshold.length > 0 && (
              <div className="bulk-bar">
                <div className="bulk-bar-txt">
                  <strong>{aboveThreshold.length} מועמדים</strong> עם ציון ≥{minScore}% ממתינים
                </div>
                <div className="bulk-bar-actions">
                  <button className="btn-bulk primary" onClick={() => {
                    store.bulkInvite(id, minScore);
                    addToast('g', `הוזמנו ${aboveThreshold.length} מועמדים בבת אחת`);
                  }}>
                    הזמן הכל
                  </button>
                </div>
              </div>
            )}

            <div className="cands">
              {filtered.map(c => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  isInvited={invitedIds.has(c.id)}
                  isSaved={store.savedCandidateIds.includes(c.id)}
                  onInvite={() => {
                    store.inviteCandidate(id, c.id);
                    addToast('g', `הזמנה נשלחה ל${c.name}`);
                  }}
                  onSave={() => {
                    store.saveCandidate(c.id);
                    addToast('a', 'נשמר');
                  }}
                  onDismiss={() => store.dismissCandidate(c.id)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <h3>אין תוצאות</h3>
                  <p>שנה את הפילטרים או הרחב את טווח החיפוש</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav newCount={store.newCandidateCount()} activeJobCount={store.jobs.filter(j => j.status === 'active').length} />
      <PostJobModal open={postOpen} onClose={() => setPostOpen(false)} />
      <GapTriggerModal open={gapOpen} onClose={() => setGapOpen(false)} />
      <Toasts />
    </div>
  );
}
