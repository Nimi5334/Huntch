'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  newCount: number;
  invitedCount: number;
  activeJobCount: number;
  onPostJob: () => void;
  onGapTrigger: () => void;
}

export default function Sidebar({ newCount, invitedCount, activeJobCount, onPostJob, onGapTrigger }: SidebarProps) {
  const path = usePathname();

  return (
    <aside className="sidebar">
      <div className="sb-section">גיוס</div>

      <Link href="/" className={`sb-row ${path === '/' ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>מועמדים</span>
        {newCount > 0 && <span className="sb-num">{newCount}</span>}
      </Link>

      <Link href="/jobs/new" className={`sb-row ${path === '/jobs/new' ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        <span>משרות פעילות</span>
        {activeJobCount > 0 && <span className="sb-num">{activeJobCount}</span>}
      </Link>

      <Link href="/pool" className={`sb-row ${path === '/pool' ? 'on' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>מאגר כישרונות</span>
      </Link>

      <div className="sb-section">כלים</div>

      <button className="sb-row" onClick={onGapTrigger}>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>דווח על עזיבה</span>
      </button>

      <button className="sb-row" onClick={onPostJob}>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        <span>פרסם משרה</span>
      </button>
    </aside>
  );
}
