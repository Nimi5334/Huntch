'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Toasts, { addToast } from '@/components/Toasts';
import { ExpandableCard } from '@/components/ui/expandable-card';

export default function QrPage() {
  const store = useStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  useEffect(() => { if (hydrated && !store.isLoggedIn) router.replace('/login'); }, [hydrated, store.isLoggedIn, router]);
  if (!hydrated || !store.isLoggedIn) return null;

  const bizId = store.business.id;
  const scans = store.qrScansForBusiness(bizId);
  const joinUrl = `https://huntch.co.il/join/${bizId}`;
  const shortUrl = `huntch.co.il/join/${bizId}`;
  const signups = scans.length;
  const scanWeek = Math.max(signups, signups * 2 + 4); // demo signal
  const conv = scanWeek > 0 ? Math.round((signups / scanWeek) * 100) : 0;
  const shareText = `הצטרפו לצוות של ${store.business.name} דרך Huntch — מצאו משמרות קרובות אליכם 👈 ${joinUrl}`;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="app">
      <div className="back-bar"><span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span><b>גיוס דרך QR</b></div>

      <div className="qr-page">
        {/* Tap to expand — framer-motion shared-layout opening transition */}
        <div className="flex justify-center" dir="ltr">
          <ExpandableCard
            title={store.business.name || 'Huntch'}
            src={qrImg}
            description="גיוס דרך QR"
            className="!bg-white !border-[#e8ddd5]"
            classNameExpanded="!bg-white"
          >
            <div dir="rtl" className="w-full">
              <p className="text-base text-zinc-600">
                תלה את הקוד ליד הקופה. כל סורק מצטרף למאגר שלך ומגיש מועמדות ישירות — בלי לשלוח הודעות.
              </p>
              <p className="mt-3 font-semibold text-zinc-900" style={{ fontFamily: 'var(--font-mono)', direction: 'ltr' }}>{shortUrl}</p>
              <p className="mt-1 text-sm text-zinc-500">סרקו אותי כדי להצטרף לצוות 👆</p>
            </div>
          </ExpandableCard>
        </div>
        <div className="qr-url">{shortUrl}</div>
        <p className="qr-note">תלה את הקוד ליד הקופה. כל סורק מצטרף למאגר שלך ומגיש מועמדות ישירות — בלי לשלוח הודעות.</p>

        <div className="qr-stats">
          <div className="qr-stat"><div className="n">{scanWeek}</div><div className="l">סריקות השבוע</div></div>
          <div className="qr-stat"><div className="n">{signups}</div><div className="l">נרשמו</div></div>
          <div className="qr-stat"><div className="n">{conv}%</div><div className="l">המרה</div></div>
        </div>

        <div className="qr-actions">
          <button className="btn-full" onClick={() => { navigator.clipboard?.writeText(joinUrl); addToast('g', 'הקישור הועתק'); }}>העתק קישור</button>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}>שתף בוואטסאפ</button>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => addToast('a', 'כרטיס להדפסה — בקרוב')}>הורד כרטיס להדפסה</button>
        </div>
      </div>
      <Toasts />
    </div>
  );
}
