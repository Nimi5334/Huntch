'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav({ onPostJob }: { onPostJob: () => void }) {
  const path = usePathname() ?? '';

  return (
    <nav className="bottom-nav">
      <Link href="/" className={`bnav-item ${path === '/' ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        מועמדים
      </Link>
      <Link href="/pool" className={`bnav-item ${path === '/pool' ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        מאגר
      </Link>
      <button className="bnav-item" onClick={onPostJob}>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        פרסם
      </button>
      <Link href="/jobs/new" className={`bnav-item ${path.startsWith('/jobs') ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        משרות
      </Link>
    </nav>
  );
}
