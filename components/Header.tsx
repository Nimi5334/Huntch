'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const HMARK = (
  <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
    <path d="M22,16 L22,64" strokeWidth="10" strokeLinecap="round"/>
    <path d="M58,16 L58,64" strokeWidth="10" strokeLinecap="round"/>
    <path d="M22,42 C22,26 58,26 58,42" strokeWidth="9" strokeLinecap="round" fill="none"/>
  </svg>
);

const TABS = [
  { label: 'בית', href: '/' },
  { label: 'משרות', href: '/jobs' },
  { label: 'מאגר', href: '/pool' },
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
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <header className="hdr">
        <Link href="/" className="brand">
          <div className="h-mark">{HMARK}</div>
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
          <div className="hdr-avatar">{operatorInitial}</div>
        </div>

        <button className="hdr-burger" aria-label="תפריט" onClick={() => setDrawer(true)}>
          <i /><i /><i />
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={`drawer-scrim ${drawer ? 'open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer ${drawer ? 'open' : ''}`}>
        <div className="drawer-head">
          <div className="h-mark">{HMARK}</div>
          <b>Huntch</b>
          <button className="x" onClick={() => setDrawer(false)} aria-label="סגור">×</button>
        </div>

        <Link href="/" className={`drawer-row ${isActive(path, '/') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>בית</span>{newCount > 0 && <span className="dbadge">{newCount}</span>}
        </Link>
        <Link href="/jobs" className={`drawer-row ${isActive(path, '/jobs') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span>משרות</span>{activeJobCount > 0 && <span className="dbadge">{activeJobCount}</span>}
        </Link>
        <Link href="/pool" className={`drawer-row ${isActive(path, '/pool') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
          <span>מאגר שכונתי</span>
        </Link>
        <Link href="/qr" className={`drawer-row ${isActive(path, '/qr') ? 'on' : ''}`} onClick={() => setDrawer(false)}>
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 21v.01M21 14v.01M14 21v.01"/></svg>
          <span>גיוס דרך QR</span>
        </Link>
      </aside>
    </>
  );
}
