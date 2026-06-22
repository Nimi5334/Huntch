'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'מועמדים', href: '/' },
  { label: 'משרות', href: '/jobs/new' },
  { label: 'מאגר', href: '/pool' },
];

export default function Header({ operatorInitial = 'ל' }: { operatorInitial?: string }) {
  const path = usePathname();

  return (
    <header className="hdr">
      <Link href="/" className="brand">
        <div className="h-mark">
          <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
            <path d="M22,16 L22,64" stroke="white" strokeWidth="10" strokeLinecap="round"/>
            <path d="M58,16 L58,64" stroke="white" strokeWidth="10" strokeLinecap="round"/>
            <path d="M22,42 C22,26 58,26 58,42" stroke="white" strokeWidth="9" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <span className="brand-name">Huntch</span>
      </Link>

      <div className="hdr-tabs-wrap">
        {TABS.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className={`hdr-tab ${path === t.href ? 'on' : ''}`}
          >
            {t.label}
          </Link>
        ))}
        <span className="hdr-tab" style={{ cursor: 'default', color: '#ccc' }}>ניתוחים</span>
      </div>

      <div className="hdr-end">
        <button className="hdr-icon-btn" title="התראות" aria-label="התראות">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <div className="hdr-avatar">{operatorInitial}</div>
      </div>
    </header>
  );
}
