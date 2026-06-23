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
      <Link href="/schedule" className={`bnav-item ${isActive(path, '/schedule') ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        לו״ז
      </Link>
      <Link href="/analytics" className={`bnav-item ${isActive(path, '/analytics') ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        אנליטיקה
      </Link>
    </nav>
  );
}
