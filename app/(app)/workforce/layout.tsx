'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WorkforceLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '';
  const isRequests = path.startsWith('/workforce/requests');
  const isSchedule = path.startsWith('/workforce/schedule');
  const isPool = !isSchedule && !isRequests;

  return (
    <>
      <div className="sub-nav">
        <Link href="/workforce/pool" className={`sub-tab ${isPool ? 'on' : ''}`}>עובדים</Link>
        <Link href="/workforce/schedule" className={`sub-tab ${isSchedule ? 'on' : ''}`}>לו״ז</Link>
        <Link href="/workforce/requests" className={`sub-tab ${isRequests ? 'on' : ''}`}>בקשות</Link>
      </div>
      {children}
    </>
  );
}
