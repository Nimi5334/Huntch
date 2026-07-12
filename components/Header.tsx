'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CLINIC_TYPE_HE } from '@/lib/clinical';
import { effectivePlan, isTrialActive, SUBSCRIPTION_PRICE_USD } from '@/lib/plan';

const HMARK_WHITE = (
  <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
    <path d="M20,12 L20,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M60,12 L60,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M20,38 C20,56 60,56 60,38" stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none"/>
  </svg>
);

export default function Header({
  operatorInitial = 'ר',
}: {
  operatorInitial?: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(false);

  const store = useStore();
  const clinic = store.clinic;
  const patientCount = store.patients.length;
  const current = effectivePlan(clinic);
  const trialActive = isTrialActive(clinic);

  function handleLogout() {
    store.logout();
    setProfile(false);
    router.replace('/login');
  }

  return (
    <>
      <header className="hdr">
        <Link href="/" className="brand">
          <div className="h-mark">{HMARK_WHITE}</div>
          <span className="brand-name">Huntch</span>
        </Link>

        <div className="hdr-end">
          <button
            className="hdr-avatar"
            onClick={() => setProfile(p => !p)}
            aria-label="פרופיל מרפאה"
            style={{ cursor: 'pointer' }}
          >
            {operatorInitial}
          </button>
        </div>
      </header>

      {/* ── PROFILE PANEL ── */}
      <div className={`profile-scrim ${profile ? 'open' : ''}`} onClick={() => setProfile(false)} />
      <div className={`profile-panel ${profile ? 'open' : ''}`}>
        <div className="pp-head">
          <div className="pp-ava" style={{ background: 'var(--accent)' }}>
            {clinic.operatorName?.[0] ?? 'ר'}
          </div>
          <div>
            <div className="pp-name">{clinic.name || 'המרפאה שלי'}</div>
            <div className="pp-meta">
              <span className="pp-type">{CLINIC_TYPE_HE[clinic.type] ?? clinic.type}</span>
              {clinic.address && <span className="pp-addr">· {clinic.address}</span>}
            </div>
          </div>
        </div>

        <div className="pp-stats">
          <div className="pp-stat">
            <div className="pp-snum">{patientCount}</div>
            <div className="pp-slabel">מטופלים</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{store.outreach.length}</div>
            <div className="pp-slabel">הודעות נשלחו</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{current === 'advanced' ? 'מתקדם' : 'בסיסי'}</div>
            <div className="pp-slabel">תוכנית</div>
          </div>
        </div>

        {trialActive && clinic.plan === 'basic' && (
          <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 12, padding: '8px 12px', margin: '0 0 12px', fontSize: 12, color: 'var(--accent)' }}>
            🎁 בתקופת ניסיון של תוכנית מתקדמת עד {new Date(clinic.trialEndsAt!).toLocaleDateString('he-IL')}
          </div>
        )}

        <div className="pp-plan">
          <Link
            href="/profile"
            className="pp-plan-row"
            onClick={() => setProfile(false)}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div>
              <div className="pp-plan-name">פרופיל וחיוב</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>ניהול המנוי · ${SUBSCRIPTION_PRICE_USD}/חודש</div>
            </div>
            <span className="ico" style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}>פתח →</span>
          </Link>
        </div>

        <div className="pp-actions">
          <button className="pp-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            התנתק
          </button>
        </div>
      </div>
    </>
  );
}
