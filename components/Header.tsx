'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';

const HMARK_DARK = (
  <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
    <path d="M20,12 L20,68" stroke="#16241a" strokeWidth="16" strokeLinecap="round"/>
    <path d="M60,12 L60,68" stroke="#16241a" strokeWidth="16" strokeLinecap="round"/>
    <path d="M20,38 C20,56 60,56 60,38" stroke="#16241a" strokeWidth="14" strokeLinecap="round" fill="none"/>
  </svg>
);
const HMARK_WHITE = (
  <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
    <path d="M20,12 L20,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M60,12 L60,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M20,38 C20,56 60,56 60,38" stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none"/>
  </svg>
);

const VENUE_HE: Record<string, string> = {
  cafe: 'בית קפה', restaurant: 'מסעדה', bar: 'בר',
  'fast-food': 'מזון מהיר', catering: 'קייטרינג', hotel: 'מלון',
};

const TABS = [
  { label: 'בית', href: '/' },
  { label: 'גיוס', href: '/hiring' },
  { label: 'כוח אדם', href: '/workforce' },
  { label: 'פעילות', href: '/activity' },
];

function isActive(path: string, href: string) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
}

export default function Header({
  operatorInitial = 'ל',
  newCount = 0,
  activeJobCount = 0,
}: {
  operatorInitial?: string;
  newCount?: number;
  activeJobCount?: number;
}) {
  const path = usePathname() ?? '/';
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [profile, setProfile] = useState(false);

  // Store access for profile stats
  const store = useStore();
  const biz = store.business;
  const poolCount = store.pool.length;
  const inviteCount = store.invites.length;
  const scanCount = store.qrScansForBusiness(biz.id).length;

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
          <button className="hdr-icon-btn" title="התראות" aria-label="התראות">
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {newCount > 0 && <span className="ping" />}
          </button>
          {/* Avatar — click to open profile panel */}
          <button
            className="hdr-avatar"
            onClick={() => setProfile(p => !p)}
            aria-label="פרופיל עסק"
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
        {/* Business identity */}
        <div className="pp-head">
          <div className="pp-ava" style={{ background: 'var(--accent)' }}>
            {biz.operatorName?.[0] ?? 'ע'}
          </div>
          <div>
            <div className="pp-name">{biz.name || 'העסק שלי'}</div>
            <div className="pp-meta">
              <span className="pp-type">{VENUE_HE[biz.type] ?? biz.type}</span>
              {biz.address && <span className="pp-addr">· {biz.address}</span>}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="pp-stats">
          <div className="pp-stat">
            <div className="pp-snum">{activeJobCount}</div>
            <div className="pp-slabel">משרות פעילות</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{poolCount}</div>
            <div className="pp-slabel">עובדים במאגר</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{inviteCount}</div>
            <div className="pp-slabel">הוזמנו לראיון</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{scanCount}</div>
            <div className="pp-slabel">סריקות QR</div>
          </div>
        </div>

        {/* Actions */}
        <div className="pp-actions">
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
        <Link href="/" className={`drawer-row ${isActive(path, '/') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>בית</span>{newCount > 0 && <span className="dbadge">{newCount}</span>}
        </Link>
        <Link href="/hiring" className={`drawer-row ${isActive(path, '/hiring') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
          <span>גיוס</span>{activeJobCount > 0 && <span className="dbadge">{activeJobCount}</span>}
        </Link>
        <Link href="/hiring/qr" className={`drawer-row ${isActive(path, '/hiring/qr') ? 'on' : ''}`} onClick={() => setDrawer(false)} style={{ paddingRight: 32, fontSize: 13 }}>
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 21v.01M21 14v.01M14 21v.01"/></svg>
          <span>QR גיוס דרך</span>
        </Link>
        <Link href="/workforce" className={`drawer-row ${isActive(path, '/workforce') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>כוח אדם</span>
        </Link>
        <Link href="/activity" className={`drawer-row ${isActive(path, '/activity') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>פעילות</span>
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
