'use client';
import { useState } from 'react';

interface QRPanelProps {
  businessId: string;
  businessName: string;
  scanCount: number;
}

export default function QRPanel({ businessId, businessName, scanCount }: QRPanelProps) {
  const [copied, setCopied] = useState(false);

  const joinUrl = `https://huntch.co.il/join/${businessId}`;
  const shortUrl = `huntch.co.il/join/${businessId}`;
  const shareText = `הצטרפו לבריכת העובדים של ${businessName} דרך Huntch — מצאו משמרות קרובות אליכם 👉 ${joinUrl}`;

  function handleCopy() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 16,
      padding: 20,
      direction: 'rtl',
    }}>
      {/* Header */}
      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 14 }}>
        הקישור שלכם לגיוס עובדים
      </div>

      {/* URL chip */}
      <div style={{
        display: 'inline-block',
        background: 'rgba(196,120,32,0.07)',
        border: '1px solid rgba(196,120,32,0.2)',
        borderRadius: 8,
        padding: '6px 12px',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: 13,
        color: '#c47820',
        marginBottom: 18,
        wordBreak: 'break-all',
      }}>
        {shortUrl}
      </div>

      {/* QR placeholder */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
        <div style={{
          width: 140,
          height: 140,
          background: '#fff',
          border: '2px dashed #c47820',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          {/* H-mark SVG */}
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="17" height="17" rx="4" fill="#c47820"/>
            <path d="M4 4h2v3.5h5V4h2v9h-2V9.5H6V13H4V4z" fill="#fff"/>
          </svg>
          <span style={{
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            fontSize: 9,
            color: '#888',
            textAlign: 'center',
            padding: '0 6px',
            wordBreak: 'break-all',
          }}>
            {shortUrl}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>סרוק להצטרפות לבריכה</div>
      </div>

      {/* Scan stats chip */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: scanCount > 0 ? 'rgba(29,122,80,0.07)' : 'rgba(0,0,0,0.04)',
        borderRadius: 20,
        padding: '5px 12px',
        fontSize: 13,
        fontWeight: 600,
        color: scanCount > 0 ? '#1d7a50' : '#999',
        marginBottom: 16,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: scanCount > 0 ? '#1d7a50' : '#ccc',
          display: 'inline-block',
        }} />
        {scanCount} עובדים הצטרפו דרך הקישור שלכם
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '11px 0',
            background: copied ? '#1d7a50' : '#c47820',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {copied ? '✓ הועתק!' : 'העתק קישור'}
        </button>
        <button
          onClick={handleWhatsApp}
          style={{
            width: '100%',
            padding: '11px 0',
            background: '#fff',
            color: '#25d366',
            border: '1.5px solid #25d366',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          שתף בוואטסאפ
        </button>
      </div>
    </div>
  );
}
