'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Toasts, { addToast } from '@/components/Toasts';
import { parseCSV } from '@/lib/csv';
import { computeDna, dnaLabel } from '@/lib/dna';
import type { Role } from '@/lib/types';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצרות', cook: 'טבחות', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמנות', cashier: 'קופה', host: 'מארח/ת',
  delivery: 'שליחות', 'shift-manager': 'אחמ״ש',
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'barista', label: 'בריסטה' },
  { key: 'server', label: 'מלצרות' },
  { key: 'cook', label: 'טבחות' },
  { key: 'dishwasher', label: 'שטיפה' },
  { key: 'near', label: 'עד 2 ק"מ' },
];

export default function PoolPage() {
  const store = useStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  if (!hydrated) return null;
  if (!store.isLoggedIn) { router.replace('/login'); return null; }

  const newCount = store.newCandidateCount();
  const activeJobCount = store.jobs.filter(j => j.status === 'active').length;

  const filtered = store.pool.filter(c => {
    if (query) {
      const q = query.toLowerCase();
      if (!(c.name.includes(query) || c.neighborhood.includes(query) || c.roles.some(r => r.includes(q)))) return false;
    }
    if (filter === 'near') return c.willingRangeKm <= 2;
    if (filter !== 'all') return c.roles.includes(filter as Role);
    return true;
  });

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCSV(ev.target?.result as string, store.business.id);
      store.bulkAddToPool(parsed);
      addToast('g', `יובאו ${parsed.length} מועמדים בהצלחה`);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={newCount} activeJobCount={activeJobCount} />
      <div className="body">
        <main className="main">
          <div className="feed">
            <div className="scr-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              מאגר שכונתי
              <button className="btn-ghost" style={{ fontSize: 12.5, padding: '8px 12px' }} onClick={() => fileRef.current?.click()}>ייבוא CSV</button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            </div>

            <div className="search-bar">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="search" placeholder="חפש לפי שם, תפקיד או שכונה…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>

            <div className="filter-row">
              {FILTERS.map(f => (
                <button key={f.key} className={`fchip ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            <div className="pool-count">{filtered.length} עובדים{filter === 'near' ? ' עד 2 ק"מ' : ' ברדיוס 3 ק"מ'}</div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <h3>{query || filter !== 'all' ? 'אין תוצאות' : 'עדיין אין מועמדים'}</h3>
                <p>{query || filter !== 'all' ? 'נסה סינון אחר' : 'ייבא מועמדים מ-CSV או שתף את קוד ה-QR'}</p>
              </div>
            ) : (
              filtered.map((c, i) => {
                const dna = computeDna(c);
                return (
                  <Link key={c.id} href={`/candidate/${c.id}`} className="fc in" style={{ transitionDelay: `${i * 30}ms` }}>
                    <div className="fc-av" style={{ background: c.avatarColor }}>{c.initials}</div>
                    <div className="fc-info">
                      <div className="fc-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.name}
                        <span className={`churn-pip ${dna.churnRisk}`} title={dna.churnRisk === 'high' ? 'סיכון עזיבה גבוה' : dna.churnRisk === 'medium' ? 'סיכון בינוני' : 'יציב'} />
                      </div>
                      <div className="fc-facts">
                        <span>{ROLE_HE[c.roles[0]] ?? c.roles[0]}</span>
                        <span className="cdot" /><span>{c.neighborhood}</span>
                        <span className="cdot" /><span>{c.willingRangeKm} ק"מ</span>
                      </div>
                      {dna.tags.length > 0 && (
                        <div className="fc-dna-tags">
                          {dna.tags.slice(0, 2).map(tag => <span key={tag} className="fc-tag">{tag}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="fc-dna">
                      <div className="fc-dna-score" style={{ color: dna.score >= 70 ? '#16a34a' : dna.score >= 50 ? 'var(--amber-ink)' : '#b91c1c' }}>{dna.score}</div>
                      <div className="fc-dna-lbl">DNA</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </main>
      </div>
      <BottomNav newCount={newCount} activeJobCount={activeJobCount} />
      <Toasts />
    </div>
  );
}
