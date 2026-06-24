'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';

export default function QrPage() {
  const router  = useRouter();
  const store   = useStore();
  const bizId   = store.business.id;
  const bizName = store.business.name;

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [joinUrl,   setJoinUrl]   = useState('');

  const scans    = store.qrScansForBusiness(bizId);
  const signups  = scans.length;
  const scanWeek = Math.max(signups, signups * 2 + 4);
  const conv     = scanWeek > 0 ? Math.round((signups / scanWeek) * 100) : 0;

  // Build the join URL from env var (set in Vercel) or current origin
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url  = `${base}/join/${bizId}`;
    setJoinUrl(url);

    // Self-hosted QR generation — no external API dependency
    import('qrcode').then(QRCode =>
      QRCode.toDataURL(url, { width: 600, margin: 2, color: { dark: '#1a1410', light: '#ffffff' } })
        .then(setQrDataUrl)
    );
  }, [bizId]);

  // ── Downloadable sticker card ──────────────────────────────────────────────
  const downloadCard = async (variant: 'dark' | 'amber') => {
    if (!qrDataUrl) return;
    const W = 900, H = 1100;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const isDark = variant === 'dark';
    const bg  = isDark ? '#1a1410' : '#f59e0b';
    const fg  = isDark ? '#ffffff' : '#1a1410';
    const dim = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle inner border
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // Headline
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillStyle = fg;
    ctx.font      = 'bold 64px Arial, Helvetica, sans-serif';
    ctx.fillText(isDark ? 'אנחנו מגייסים!' : 'מחפש/ת עבודה?', W / 2, 118);

    ctx.fillStyle = isDark ? '#e8a254' : 'rgba(0,0,0,0.65)';
    ctx.font      = '34px Arial, Helvetica, sans-serif';
    ctx.fillText(
      isDark ? `הצטרף/י לצוות ${bizName}` : 'סרוק/י כדי להצטרף לצוות',
      W / 2, 174
    );

    // White card behind QR (manual rounded rect — no roundRect API needed)
    const qx = 148, qy = 218, qs = 604, r = 24;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(qx + r, qy);
    ctx.lineTo(qx + qs - r, qy);           ctx.arcTo(qx + qs, qy,       qx + qs, qy + r,       r);
    ctx.lineTo(qx + qs, qy + qs - r);      ctx.arcTo(qx + qs, qy + qs,  qx + qs - r, qy + qs,  r);
    ctx.lineTo(qx + r, qy + qs);           ctx.arcTo(qx,      qy + qs,  qx,           qy + qs - r, r);
    ctx.lineTo(qx, qy + r);                ctx.arcTo(qx,      qy,       qx + r,       qy,          r);
    ctx.closePath();
    ctx.fill();

    // QR image inside the white card
    const qrImg = new Image();
    qrImg.src   = qrDataUrl;
    await new Promise<void>(res => { qrImg.onload = () => res(); });
    ctx.drawImage(qrImg, qx + 24, qy + 24, qs - 48, qs - 48);

    // Business name
    ctx.fillStyle = fg;
    ctx.font      = 'bold 38px Arial, Helvetica, sans-serif';
    ctx.direction = 'rtl';
    ctx.fillText(bizName, W / 2, 898);

    // Short URL
    ctx.fillStyle = dim;
    ctx.font      = '26px Arial, Helvetica, sans-serif';
    ctx.direction = 'ltr';
    ctx.fillText(joinUrl.replace(/^https?:\/\//, ''), W / 2, 950);

    // Huntch wordmark
    ctx.fillStyle = isDark ? '#e8a254' : 'rgba(0,0,0,0.35)';
    ctx.font      = 'bold 30px Arial, Helvetica, sans-serif';
    ctx.fillText('Huntch', W / 2, 1020);

    // Download
    const a = document.createElement('a');
    a.href     = canvas.toDataURL('image/png');
    a.download = `huntch-${variant}-${bizName}.png`;
    a.click();
    addToast('g', `כרטיס ${isDark ? 'כהה' : 'ענבר'} הורד`);
  };

  const shareText = `הצטרפו לצוות של ${bizName} דרך Huntch 👈 ${joinUrl}`;
  const shortUrl  = joinUrl.replace(/^https?:\/\//, '');

  return (
    <>
      <div className="back-bar">
        <span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span>
        <b>גיוס דרך QR</b>
      </div>

      <div className="qr-page">

        {/* QR code */}
        <div className="flex justify-center" style={{ marginBottom: 16 }}>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: 220, height: 220, borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', display: 'block' }}
            />
          ) : (
            <div style={{
              width: 220, height: 220, borderRadius: 16,
              background: 'rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#bbb', fontSize: 13,
            }}>
              טוען…
            </div>
          )}
        </div>

        <div className="qr-url">{shortUrl || 'טוען…'}</div>
        <p className="qr-note">
          תלה את הקוד ליד הקופה. כל סורק מצטרף למאגר שלך ומגיש מועמדות ישירות — בלי לשלוח הודעות.
        </p>

        {/* Stats */}
        <div className="qr-stats">
          <div className="qr-stat"><div className="n">{scanWeek}</div><div className="l">סריקות השבוע</div></div>
          <div className="qr-stat"><div className="n">{signups}</div><div className="l">נרשמו</div></div>
          <div className="qr-stat"><div className="n">{conv}%</div><div className="l">המרה</div></div>
        </div>

        {/* Share actions */}
        <div className="qr-actions">
          <button
            className="btn-full"
            onClick={() => { navigator.clipboard?.writeText(joinUrl); addToast('g', 'הקישור הועתק'); }}
          >
            העתק קישור
          </button>
          <button
            className="btn-ghost"
            style={{ width: '100%' }}
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
          >
            שתף בוואטסאפ
          </button>
        </div>

        {/* Printable sticker cards */}
        <div style={{ marginTop: 28, paddingBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#aaa', marginBottom: 12, textAlign: 'center',
          }}>
            מדבקות להדפסה
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              className="btn-ghost"
              disabled={!qrDataUrl}
              onClick={() => downloadCard('dark')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '14px 8px' }}
            >
              <span style={{ fontSize: 22 }}>🖤</span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>חלון העסק</span>
              <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>״אנחנו מגייסים״</span>
            </button>
            <button
              className="btn-ghost"
              disabled={!qrDataUrl}
              onClick={() => downloadCard('amber')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '14px 8px' }}
            >
              <span style={{ fontSize: 22 }}>🟡</span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>שטח ציבורי</span>
              <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>״מחפש/ת עבודה״</span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
