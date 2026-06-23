'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { computeDna, churnLabel } from '@/lib/dna';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצרות', cook: 'טבחות', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמנות', cashier: 'קופה', host: 'מארח/ת',
  delivery: 'שליחות', 'shift-manager': 'אחמ״ש',
};

export default function AnalyticsPage() {
  const store = useStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  useEffect(() => { if (hydrated && !store.isLoggedIn) router.replace('/login'); }, [hydrated, store.isLoggedIn, router]);
  if (!hydrated || !store.isLoggedIn) return null;

  const pool = store.pool;
  const invites = store.invites;
  const jobs = store.jobs;
  const newCount = store.newCandidateCount();
  const activeJobCount = jobs.filter(j => j.status === 'active').length;

  // DNA scores for all candidates
  const dnaProfiles = pool.map(c => ({ c, dna: computeDna(c) }));

  // Invite funnel
  const sent = invites.length;
  const responded = invites.filter(i => i.status === 'responded').length;
  const declined = invites.filter(i => i.status === 'declined').length;
  const pending = invites.filter(i => i.status === 'sent' || i.status === 'delivered').length;
  const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

  // Pool by role
  const roleCounts: Record<string, number> = {};
  pool.forEach(c => c.roles.forEach(r => { roleCounts[r] = (roleCounts[r] ?? 0) + 1; }));
  const roleEntries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxRoleCount = roleEntries[0]?.[1] ?? 1;

  // Churn breakdown
  const churnHigh = dnaProfiles.filter(d => d.dna.churnRisk === 'high').length;
  const churnMed = dnaProfiles.filter(d => d.dna.churnRisk === 'medium').length;
  const churnLow = dnaProfiles.filter(d => d.dna.churnRisk === 'low').length;

  // Avg DNA
  const avgDna = pool.length > 0
    ? Math.round(dnaProfiles.reduce((s, d) => s + d.dna.score, 0) / pool.length)
    : 0;

  // Top 5 by DNA
  const topDna = [...dnaProfiles].sort((a, b) => b.dna.score - a.dna.score).slice(0, 5);

  // Availability by shift
  const shiftCounts: Record<string, number> = {};
  pool.forEach(c => c.availability.shifts.forEach(s => { shiftCounts[s] = (shiftCounts[s] ?? 0) + 1; }));
  const shiftOrder = ['morning', 'afternoon', 'evening', 'night', 'weekend'];
  const shiftLabels: Record<string, string> = { morning: 'בוקר', afternoon: 'צהריים', evening: 'ערב', night: 'לילה', weekend: 'סופ״ש' };
  const maxShift = Math.max(...Object.values(shiftCounts), 1);

  return (
    <div className="app">
      <Header operatorInitial={store.business.operatorName[0] ?? 'ל'} newCount={newCount} activeJobCount={activeJobCount} />
      <div className="body">
        <main className="main">
          <div className="feed">
            <div className="scr-title">אנליטיקה</div>

            {/* KPI cards */}
            <div className="ana-kpis">
              <div className="ana-kpi">
                <div className="ana-kpi-num">{pool.length}</div>
                <div className="ana-kpi-lbl">עובדים במאגר</div>
              </div>
              <div className="ana-kpi">
                <div className="ana-kpi-num">{activeJobCount}</div>
                <div className="ana-kpi-lbl">משרות פעילות</div>
              </div>
              <div className="ana-kpi accent">
                <div className="ana-kpi-num">{responseRate}%</div>
                <div className="ana-kpi-lbl">שיעור מענה</div>
              </div>
              <div className="ana-kpi">
                <div className="ana-kpi-num">{avgDna}</div>
                <div className="ana-kpi-lbl">ממוצע DNA</div>
              </div>
            </div>

            {/* Invite funnel */}
            <div className="ana-card">
              <div className="ana-card-title">משפך הזמנות</div>
              <div className="ana-funnel">
                <div className="ana-funnel-row">
                  <span className="ana-funnel-lbl">נשלחו</span>
                  <div className="ana-funnel-bar-wrap">
                    <div className="ana-funnel-bar" style={{ width: '100%', background: 'var(--accent-soft)', border: '1px solid var(--accent)' }} />
                  </div>
                  <span className="ana-funnel-val">{sent}</span>
                </div>
                <div className="ana-funnel-row">
                  <span className="ana-funnel-lbl">אישרו</span>
                  <div className="ana-funnel-bar-wrap">
                    <div className="ana-funnel-bar" style={{ width: sent > 0 ? `${(responded / sent) * 100}%` : '0%', background: '#22c55e33', border: '1px solid #22c55e' }} />
                  </div>
                  <span className="ana-funnel-val" style={{ color: '#16a34a' }}>{responded}</span>
                </div>
                <div className="ana-funnel-row">
                  <span className="ana-funnel-lbl">ממתינים</span>
                  <div className="ana-funnel-bar-wrap">
                    <div className="ana-funnel-bar" style={{ width: sent > 0 ? `${(pending / sent) * 100}%` : '0%', background: 'var(--amber-soft)', border: '1px solid var(--amber)' }} />
                  </div>
                  <span className="ana-funnel-val" style={{ color: 'var(--amber-ink)' }}>{pending}</span>
                </div>
                <div className="ana-funnel-row">
                  <span className="ana-funnel-lbl">סירבו</span>
                  <div className="ana-funnel-bar-wrap">
                    <div className="ana-funnel-bar" style={{ width: sent > 0 ? `${(declined / sent) * 100}%` : '0%', background: '#fbe9e9', border: '1px solid #f87171' }} />
                  </div>
                  <span className="ana-funnel-val" style={{ color: '#b91c1c' }}>{declined}</span>
                </div>
              </div>
            </div>

            {/* Pool by role */}
            <div className="ana-card">
              <div className="ana-card-title">הרכב המאגר לפי תפקיד</div>
              <div className="ana-bars">
                {roleEntries.map(([role, count]) => (
                  <div key={role} className="ana-bar-row">
                    <span className="ana-bar-lbl">{ROLE_HE[role] ?? role}</span>
                    <div className="ana-bar-track">
                      <div className="ana-bar-fill" style={{ width: `${(count / maxRoleCount) * 100}%` }} />
                    </div>
                    <span className="ana-bar-val">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability by shift */}
            <div className="ana-card">
              <div className="ana-card-title">זמינות לפי משמרת</div>
              <div className="ana-shift-grid">
                {shiftOrder.map(s => {
                  const count = shiftCounts[s] ?? 0;
                  const pct = Math.round((count / pool.length) * 100);
                  return (
                    <div key={s} className="ana-shift-col">
                      <div className="ana-shift-bar-wrap">
                        <div className="ana-shift-bar" style={{ height: `${(count / maxShift) * 100}%` }} />
                      </div>
                      <div className="ana-shift-num">{count}</div>
                      <div className="ana-shift-lbl">{shiftLabels[s]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Churn risk */}
            <div className="ana-card">
              <div className="ana-card-title">סיכון עזיבה — Worker Churn</div>
              <div className="ana-churn-row">
                <div className="ana-churn-item low">
                  <div className="ana-churn-num">{churnLow}</div>
                  <div className="ana-churn-lbl">יציב</div>
                </div>
                <div className="ana-churn-item med">
                  <div className="ana-churn-num">{churnMed}</div>
                  <div className="ana-churn-lbl">בינוני</div>
                </div>
                <div className="ana-churn-item high">
                  <div className="ana-churn-num">{churnHigh}</div>
                  <div className="ana-churn-lbl">גבוה</div>
                </div>
              </div>
              {churnHigh > 0 && (
                <div className="ana-churn-warn">
                  ⚠ {churnHigh} עובדים בסיכון גבוה לעזיבה — כדאי לפנות אליהם
                </div>
              )}
            </div>

            {/* Top DNA */}
            <div className="ana-card">
              <div className="ana-card-title">TOP 5 — ציון DNA</div>
              {topDna.map(({ c, dna }) => (
                <div key={c.id} className="ana-dna-row">
                  <div className="fc-av sm" style={{ background: c.avatarColor }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div className="ana-dna-name">{c.name}</div>
                    <div className="ana-dna-sub">{ROLE_HE[c.roles[0]] ?? c.roles[0]} · {c.neighborhood}</div>
                  </div>
                  <div className="ana-dna-score" style={{
                    color: dna.score >= 70 ? '#16a34a' : dna.score >= 50 ? 'var(--amber-ink)' : '#b91c1c'
                  }}>
                    {dna.score}
                  </div>
                  <div className={`churn-pip ${dna.churnRisk}`} title={churnLabel(dna.churnRisk)} />
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
      <BottomNav newCount={newCount} activeJobCount={activeJobCount} />
    </div>
  );
}
