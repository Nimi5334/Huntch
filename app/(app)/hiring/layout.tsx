'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HiringLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '';
  const isQR = path.startsWith('/hiring/qr');
  const isJobs = !isQR;

  return (
    <>
      <div className="sub-nav">
        <Link href="/hiring/jobs" className={`sub-tab ${isJobs ? 'on' : ''}`}>משרות</Link>
        <Link href="/hiring/qr" className={`sub-tab ${isQR ? 'on' : ''}`}>QR גיוס</Link>
      </div>
      {children}
    </>
  );
}
