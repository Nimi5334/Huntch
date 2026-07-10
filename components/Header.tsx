'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { CLINIC_TYPE_HE } from '@/lib/clinical';

const HMARK_WHITE = (
  <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
    <path d="M20,12 L20,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M60,12 L60,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M20,38 C20,56 60,56 60,38" stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none"/>
  </svg>
);

const TABS = [
  { label: 'בית', href: '/' },
  { label: 'משימות', href: '/tasks' },
  { label: 'אוטומציה', href: '/automation' },
  { label: 'פעילות', href: '/activity' },
];

function isActive(path: string, href: string) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
}

export default function Header({
  operatorInitial = 'ל',
  pendingEscalations = 0,
}: {
  operatorInitial?: string;
  pendingEscalations?: number;
}) {
  const path = usePathname() ?? '/';
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [profile, setProfile] = useState(false);

  const store = useStore();
  const clinic = store.clinic;
  const patientCount = store.patients.length;
  const outreachCount = store.outreach.length;

  function handleLogout() {
    store.logout();
    setProfile(false);
    router.replace('/login');
  }

  return (
    <>
      <header className="hdr">
        <Link href="/" className="brand">
          <div className="h-mark">{HMARK_WHITE}</div>
          <span className="brand-name">Huntch</span>
        </Link>

        <div className="hdr-tabs-wrap">
          {TABS.map(t => (
            <Link key={t.href} href={t.href} className={`hdr-tab ${isActive(path, t.href) ? 'on' : ''}`}>
              {t.label}
            </Link>
          ))}
        </div>

        <div className="hdr-end">
          <button
            className="hdr-avatar"
            onClick={() => setProfile(p => !p)}
            aria-label="פרופיל מרפאה"
            style={{ cursor: 'pointer' }}
          >
            {operatorInitial}
          </button>
        </div>

        <button className="hdr-burger" aria-label="תפריט" onClick={() => setDrawer(true)}>
          <i /><i /><i />
        </button>
      </header>

      {/* ── PROFILE PANEL ── */}
      <div className={`profile-scrim ${profile ? 'open' : ''}`} onClick={() => setProfile(false)} />
      <div className={`profile-panel ${profile ? 'open' : ''}`}>
        <div className="pp-head">
          <div className="pp-ava" style={{ background: 'var(--accent)' }}>
            {clinic.operatorName?.[0] ?? 'ר'}
          </div>
          <div>
            <div className="pp-name">{clinic.name || 'המרפאה שלי'}</div>
            <div className="pp-meta">
              <span className="pp-type">{CLINIC_TYPE_HE[clinic.type] ?? clinic.type}</span>
              {clinic.address && <span className="pp-addr">· {clinic.address}</span>}
            </div>
          </div>
        </div>

        <div className="pp-stats">
          <div className="pp-stat">
            <div className="pp-snum">{patientCount}</div>
            <div className="pp-slabel">מטופלים</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{outreachCount}</div>
            <div className="pp-slabel">פניות נשלחו</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{pendingEscalations}</div>
            <div className="pp-slabel">ממתין לטיפול</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{clinic.plan === 'advanced' ? 'מתקדם' : 'בסיסי'}</div>
            <div className="pp-slabel">תוכנית</div>
          </div>
        </div>

        <div className="pp-actions">
          <Link href="/settings/billing" className="pp-logout" style={{ color: 'var(--accent)' }} onClick={() => setProfile(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            חיוב ומנוי
          </Link>
          <button className="pp-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            התנתק
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <div className={`drawer-scrim ${drawer ? 'open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer ${drawer ? 'open' : ''}`}>
        <div className="drawer-head">
          <div className="h-mark" style={{ background: 'var(--ink)' }}>{HMARK_WHITE}</div>
          <b>Huntch</b>
          <button className="x" onClick={() => setDrawer(false)} aria-label="סגור">×</button>
        </div>
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={`drawer-row ${isActive(path, t.href) ? 'on' : ''}`} onClick={() => setDrawer(false)}>
            <span>{t.label}</span>
            {t.href === '/tasks' && pendingEscalations > 0 && <span className="dbadge">{pendingEscalations}</span>}
          </Link>
        ))}
        <Link href="/settings" className={`drawer-row ${isActive(path, '/settings') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <span>פרופיל</span>
        </Link>
        <button className="drawer-row" style={{ marginTop: 'auto', color: '#b91c1c' }} onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>התנתק</span>
        </button>
      </aside>
    </>
  );
}
