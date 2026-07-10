'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const store = useStore();
  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="scr-title">פרופיל</div>

          <Link href="/settings/billing" className="qr-compact">
            <div className="sq" style={{ background: 'var(--accent-soft)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontSize: 18 }}>💳</span>
            </div>
            <div>
              <div className="nm">חיוב ומנוי</div>
              <div className="ds">תוכנית נוכחית: {store.clinic.plan === 'advanced' ? 'מתקדם' : 'בסיסי'}</div>
            </div>
            <span className="go">←</span>
          </Link>

          <div className="prow" style={{ marginTop: 16 }}><div className="lab">שם מרפאה</div><div className="val">{store.clinic.name}</div></div>
          <div className="prow"><div className="lab">כתובת</div><div className="val">{store.clinic.address}</div></div>
          <div className="prow"><div className="lab">איש קשר</div><div className="val">{store.clinic.operatorName}</div></div>
        </div>
      </main>
    </div>
  );
}
