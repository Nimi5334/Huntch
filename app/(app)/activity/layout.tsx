'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '';
  const isAnalytics = path.startsWith('/activity/analytics');
  const isCampaigns = path.startsWith('/activity/campaigns');
  const isFeed = !isAnalytics && !isCampaigns;

  return (
    <>
      <div className="sub-nav">
        <Link href="/activity" className={`sub-tab ${isFeed ? 'on' : ''}`}>מה קורה</Link>
        <Link href="/activity/analytics" className={`sub-tab ${isAnalytics ? 'on' : ''}`}>נתונים</Link>
        <Link href="/activity/campaigns" className={`sub-tab ${isCampaigns ? 'on' : ''}`}>קמפיינים</Link>
      </div>
      {children}
    </>
  );
}
