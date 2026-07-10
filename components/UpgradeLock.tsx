'use client';
import Link from 'next/link';

export default function UpgradeLock({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href="/settings/billing" className="btn-invite" style={{ marginTop: 8, padding: '10px 20px', display: 'inline-block' }}>
        שדרג/י למתקדם
      </Link>
    </div>
  );
}
