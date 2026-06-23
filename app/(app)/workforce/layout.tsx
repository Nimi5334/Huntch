'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WorkforceLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '';
  const isSchedule = path.startsWith('/workforce/schedule');
  const isPool = !isSchedule;

  return (
    <>
      <div className="sub-nav">
        <Link href="/workforce/pool" className={`sub-tab ${isPool ? 'on' : ''}`}>מאגר</Link>
        <Link href="/workforce/schedule" className={`sub-tab ${isSchedule ? 'on' : ''}`}>לו״ז</Link>
      </div>
      {children}
    </>
  );
}
