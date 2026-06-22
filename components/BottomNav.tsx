'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function isActive(path: string, href: string) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
}

export default function BottomNav({
  newCount = 0,
  activeJobCount = 0,
}: {
  onPostJob?: () => void;
  newCount?: number;
  activeJobCount?: number;
}) {
  const path = usePathname() ?? '';

  return (
    <nav className="bottom-nav">
      <Link href="/" className={`bnav-item ${isActive(path, '/') ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        בית
        {newCount > 0 && <span className="bnav-badge">{newCount}</span>}
      </Link>
      <Link href="/jobs" className={`bnav-item ${isActive(path, '/jobs') ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        משרות
        {activeJobCount > 0 && <span className="bnav-badge">{activeJobCount}</span>}
      </Link>
      <Link href="/pool" className={`bnav-item ${isActive(path, '/pool') ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
        מאגר
      </Link>
    </nav>
  );
}
