'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { VenueType } from '@/lib/types';

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'cafe',        label: 'בית קפה' },
  { value: 'restaurant',  label: 'מסעדה' },
  { value: 'bar',         label: 'בר' },
  { value: 'fast-food',   label: 'מזון מהיר' },
  { value: 'catering',    label: 'קייטרינג' },
  { value: 'hotel',       label: 'מלון' },
];

const HMARK = (
  <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
    <path d="M20,12 L20,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M60,12 L60,68" stroke="#fff" strokeWidth="16" strokeLinecap="round"/>
    <path d="M20,38 C20,56 60,56 60,38" stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login state
  const [lPhone, setLPhone] = useState('');
  const [lPass,  setLPass]  = useState('');
  const [lErr,   setLErr]   = useState('');
  const [lBusy,  setLBusy]  = useState(false);

  // Signup state
  const [sName,     setSName]     = useState('');
  const [sType,     setSType]     = useState<VenueType>('cafe');
  const [sAddress,  setSAddress]  = useState('');
  const [sOperator, setSOperator] = useState('');
  const [sPhone,    setSPhone]    = useState('');
  const [sPass,     setSPass]     = useState('');
  const [sPass2,    setSPass2]    = useState('');
  const [sErr,      setSErr]      = useState('');
  const [sBusy,     setSBusy]     = useState(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // Already logged in → go home
  useEffect(() => {
    if (hydrated && store.isLoggedIn) router.replace('/');
  }, [hydrated, store.isLoggedIn, router]);

  if (!hydrated) return null;

  /* ── LOGIN ── */
  function handleLogin() {
    setLErr('');
    if (!lPhone || !lPass) { setLErr('אנא מלאו את כל השדות'); return; }
    setLBusy(true);
    setTimeout(() => {                       // brief UX delay
      const ok = store.login(lPhone.replace(/\D/g, ''), lPass);
      if (ok) { router.replace('/'); }
      else    { setLErr('מספר טלפון או סיסמה שגויים'); setLBusy(false); }
    }, 400);
  }

  /* ── SIGNUP ── */
  function handleSignup() {
    setSErr('');
    if (!sName || !sAddress || !sOperator || !sPhone || !sPass) {
      setSErr('אנא מלאו את כל השדות'); return;
    }
    if (sPass.length < 6) { setSErr('הסיסמה חייבת להכיל לפחות 6 תווים'); return; }
    if (sPass !== sPass2)  { setSErr('הסיסמאות אינן תואמות'); return; }
    setSBusy(true);
    setTimeout(() => {
      store.signup({
        name: sName,
        type: sType,
        address: sAddress,
        operatorName: sOperator,
        phone: sPhone.replace(/\D/g, ''),
        password: sPass,
      });
      router.replace('/');
    }, 400);
  }

  return (
    <div className="login-shell">
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div className="login-logo" style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 32, justifyContent: 'center' }}>
          <div className="h-mark" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
            {HMARK}
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)' }}>Huntch</span>
        </div>

        <div className="login-card" style={{ borderRadius: 22, boxShadow: '0 12px 40px -20px rgba(22,36,26,0.25)' }}>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'on' : ''}`} onClick={() => { setTab('login'); setLErr(''); }}>כניסה</button>
            <button className={`auth-tab ${tab === 'signup' ? 'on' : ''}`} onClick={() => { setTab('signup'); setSErr(''); }}>הרשמה</button>
          </div>

          {/* ─── LOGIN FORM ─── */}
          {tab === 'login' && (
            <div>
              <div className="login-title">ברוכים הבאים</div>
              <div className="login-sub">הכנסו לחשבון העסק שלכם</div>

              {/* Demo hint */}
              <div className="demo-hint">
                <span className="demo-dot" />
                הדגמה: <b>0500000000</b> / <b>533433</b>
              </div>

              <div className="field">
                <label>מספר טלפון</label>
                <input type="tel" dir="ltr" placeholder="050-000-0000"
                  value={lPhone} onChange={e => setLPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="field">
                <label>סיסמה</label>
                <input type="password" placeholder="••••••"
                  value={lPass} onChange={e => setLPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>

              {lErr && <div className="auth-err">{lErr}</div>}

              <button className="btn-full" onClick={handleLogin} disabled={lBusy}
                style={{ marginTop: 8, opacity: lBusy ? 0.6 : 1 }}>
                {lBusy ? 'נכנס…' : 'כניסה לחשבון'}
              </button>
            </div>
          )}

          {/* ─── SIGNUP FORM ─── */}
          {tab === 'signup' && (
            <div>
              <div className="login-title">הצטרפו להאנץ׳</div>
              <div className="login-sub">פרטי העסק שלכם — ישמשו לחיפוש מועמדים בקרבת מקום</div>

              <div className="field">
                <label>שם העסק</label>
                <input type="text" placeholder='בית קפה לינה'
                  value={sName} onChange={e => setSName(e.target.value)} />
              </div>
              <div className="field">
                <label>סוג העסק</label>
                <select value={sType} onChange={e => setSType(e.target.value as VenueType)}>
                  {VENUE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>כתובת העסק</label>
                <input type="text" placeholder='רחוב הנמל 12, חיפה'
                  value={sAddress} onChange={e => setSAddress(e.target.value)} />
              </div>
              <div className="field">
                <label>שמך (איש/ת הקשר)</label>
                <input type="text" placeholder='לוסיה'
                  value={sOperator} onChange={e => setSOperator(e.target.value)} />
              </div>
              <div className="field">
                <label>מספר טלפון</label>
                <input type="tel" dir="ltr" placeholder="050-000-0000"
                  value={sPhone} onChange={e => setSPhone(e.target.value)} />
              </div>
              <div className="field">
                <label>סיסמה (לפחות 6 תווים)</label>
                <input type="password" placeholder="••••••"
                  value={sPass} onChange={e => setSPass(e.target.value)} />
              </div>
              <div className="field">
                <label>אישור סיסמה</label>
                <input type="password" placeholder="••••••"
                  value={sPass2} onChange={e => setSPass2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignup()} />
              </div>

              {sErr && <div className="auth-err">{sErr}</div>}

              <button className="btn-full" onClick={handleSignup} disabled={sBusy}
                style={{ marginTop: 8, opacity: sBusy ? 0.6 : 1 }}>
                {sBusy ? 'יוצר חשבון…' : 'צור חשבון והתחל לגייס'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--muted2)' }}>
          הצטרפות = הסכמה לתנאי השימוש ומדיניות הפרטיות
        </div>
      </div>
    </div>
  );
}
