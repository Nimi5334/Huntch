'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import WorkersTable from '@/components/WorkersTable';
import { addToast } from '@/components/Toasts';
import { computeDna } from '@/lib/dna';
import { venueRoles, ROLE_HE } from '@/lib/venue';

export default function EmployeesPage() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Only show roles relevant to this business type
  const relevantRoles = venueRoles(store.business.type);

  const filtered = store.employees.filter(c => {
    if (query) {
      const q = query.toLowerCase();
      if (!(c.name.includes(query) || c.neighborhood.includes(query) || c.roles.some(r => r.includes(q)))) return false;
    }
    if (roleFilter !== 'all') return c.roles.includes(roleFilter as typeof relevantRoles[number]);
    return true;
  });

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="scr-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            צוות פעיל
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted2)', background: 'var(--accent-soft)', borderRadius: 20, padding: '3px 10px' }}>
              {store.employees.length} עובדים
            </span>
          </div>

          <div className="search-bar">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="search"
              placeholder="חפש לפי שם, תפקיד או שכונה…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Role filter chips — only shows roles relevant to this business type */}
          <div className="filter-row">
            <button
              className={`fchip ${roleFilter === 'all' ? 'on' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              הכל
            </button>
            {relevantRoles.map(r => (
              <button
                key={r}
                className={`fchip ${roleFilter === r ? 'on' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {ROLE_HE[r]}
              </button>
            ))}
          </div>

          <div className="pool-count">
            {filtered.length} עובדים פעילים
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <h3>{query || roleFilter !== 'all' ? 'אין תוצאות' : 'אין עובדים פעילים עדיין'}</h3>
              <p>{query || roleFilter !== 'all' ? 'נסה סינון אחר' : 'עובדים שמתקבלים לעבודה יופיעו כאן'}</p>
            </div>
          ) : (
            <>
              {/* Desktop: sortable data table */}
              <div className="hidden md:block">
                <WorkersTable rows={filtered} />
              </div>
              {/* Mobile: employee cards */}
              <div className="md:hidden">
                {filtered.map((c, i) => {
                  const dna = computeDna(c);
                  return (
                    <Link
                      key={c.id}
                      href={`/candidate/${c.id}`}
                      className="fc in"
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      <div className="fc-av" style={{ background: c.avatarColor }}>{c.initials}</div>
                      <div className="fc-info">
                        <div className="fc-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {c.name}
                          <span
                            className={`churn-pip ${dna.churnRisk}`}
                            title={
                              dna.churnRisk === 'high' ? 'סיכון עזיבה גבוה'
                              : dna.churnRisk === 'medium' ? 'סיכון בינוני'
                              : 'יציב'
                            }
                          />
                        </div>
                        <div className="fc-facts">
                          <span>{ROLE_HE[c.roles[0]] ?? c.roles[0]}</span>
                          <span className="cdot" /><span>{c.neighborhood}</span>
                          <span className="cdot" />
                          <span>{c.availability.hoursPerWeek} שעות/שבוע</span>
                        </div>
                        {dna.tags.length > 0 && (
                          <div className="fc-dna-tags">
                            {dna.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="fc-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="fc-dna">
                        <div
                          className="fc-dna-score"
                          style={{ color: dna.score >= 70 ? '#16a34a' : dna.score >= 50 ? 'var(--amber-ink)' : '#b91c1c' }}
                        >
                          {dna.score}
                        </div>
                        <div className="fc-dna-lbl">DNA</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
