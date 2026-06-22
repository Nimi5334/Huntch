'use client';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import PostJobModal from '@/components/PostJobModal';
import GapTriggerModal from '@/components/GapTriggerModal';
import Toasts, { addToast } from '@/components/Toasts';
import { parseCSV } from '@/lib/csv';

export default function PoolPage() {
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [postOpen, setPostOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const filtered = store.pool.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.includes(q) ||
      c.neighborhood.includes(q) ||
      c.roles.some(r => r.includes(q))
    );
  });

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text, store.business.id);
      store.bulkAddToPool(parsed);
      addToast('g', `יובאו ${parsed.length} מועמדים למאגר`);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const ROLE_HE: Record<string, string> = {
    barista: 'בריסטה', server: 'מלצר/ית', cook: 'טבח/ית', 'line-cook': 'טבח קו',
    dishwasher: 'שטיפה', bartender: 'ברמן/ית', cashier: 'קופאי/ת',
    host: 'מארח/ת', delivery: 'שליח/ה', 'shift-manager': 'אחמ״ש',
  };

  const SOURCE_LABEL: Record<string, string> = {
    'apply-form': 'טופס הגשה', 'csv-import': 'ייבוא CSV', direct: 'ישיר', 'lead-ad': 'מודעת לידים',
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
            <span className="page-title">מאגר כישרונות</span>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>
            {store.pool.length} מועמדים · כולל הסכמה לקבלת הודעות (opt-in בלבד)
          </div>

          {/* Toolbar */}
          <div className="pool-toolbar">
            <input
              className="search-input"
              type="search"
              placeholder="חפש לפי שם, שכונה, תפקיד..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              ייבוא CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
          </div>

          {/* CSV hint */}
          <div style={{ fontSize: 11, color: '#ccc', marginBottom: 16, padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
            פורמט CSV: name, neighborhood, age, roles, shifts, languages, wagenis, experience
          </div>

          {/* Pool list */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <h3>{query ? 'אין תוצאות' : 'המאגר ריק'}</h3>
              <p>{query ? 'נסה חיפוש אחר' : 'ייבא מועמדים מ-CSV'}</p>
            </div>
          ) : (
            <div className="cands">
              {filtered.map((c, i) => (
                <article
                  key={c.id}
                  className="cand in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="av" style={{ background: c.avatarColor }}>{c.initials}</div>
                  <div className="cand-info">
                    <div className="cand-name">{c.name}</div>
                    <div className="cand-facts">
                      <span>{c.neighborhood}</span>
                      <span className="cdot" />
                      <span>{c.roles.slice(0, 2).map(r => ROLE_HE[r] ?? r).join('/')}</span>
                      <span className="cdot" />
                      <span>{c.experience.totalYears} שנות ניסיון</span>
                    </div>
                  </div>
                  <div className="cand-right">
                    <span
                      style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 700,
                        background: 'rgba(0,0,0,0.05)', color: '#aaa', border: '1px solid rgba(0,0,0,0.08)',
                      }}
                    >
                      {SOURCE_LABEL[c.consentSource] ?? c.consentSource}
                    </span>
                    <button
                      className={`ico${store.savedCandidateIds.includes(c.id) ? ' saved' : ''}`}
                      onClick={() => { store.saveCandidate(c.id); addToast('a', 'נשמר'); }}
                      aria-label="שמור"
                    >
                      <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </button>
                  </div>
                </article>
              ))}
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
