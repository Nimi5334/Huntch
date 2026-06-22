'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

const STEPS = ['phone', 'otp', 'business'] as const;
type Step = typeof STEPS[number];

const VENUE_TYPES = [
  { value: 'cafe', label: '☕ בית קפה' },
  { value: 'restaurant', label: '🍽 מסעדה' },
  { value: 'bar', label: '🍸 בר' },
  { value: 'fast-food', label: '🍔 מזון מהיר' },
  { value: 'catering', label: '🎉 קייטרינג' },
  { value: 'hotel', label: '🏨 מלון' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const login = useStore(s => s.login);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState<'cafe' | 'restaurant' | 'bar' | 'fast-food' | 'catering' | 'hotel'>('cafe');
  const [operatorName, setOperatorName] = useState('');

  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  const stepIndex = STEPS.indexOf(step);

  const handlePhone = () => {
    if (phone.length >= 9) setStep('otp');
  };

  const handleOtp = () => {
    if (otp.length >= 4) setStep('business');
  };

  const handleBusiness = () => {
    if (!bizName || !operatorName) return;
    login(operatorName, bizName, bizType);
    router.push('/');
  };

  return (
    <div className="login-shell">
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div className="h-mark">
            <svg width="17" height="17" viewBox="0 0 80 80" fill="none">
              <path d="M22,16 L22,64" stroke="white" strokeWidth="10" strokeLinecap="round"/>
              <path d="M58,16 L58,64" stroke="white" strokeWidth="10" strokeLinecap="round"/>
              <path d="M22,42 C22,26 58,26 58,42" stroke="white" strokeWidth="9" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em' }}>Huntch</span>
        </div>

        <div className="login-card">
          {/* Step dots */}
          <div className="step-dots" style={{ justifyContent: 'center', marginBottom: 24 }}>
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}
              />
            ))}
          </div>

          {step === 'phone' && (
            <>
              <div className="login-title">ברוכים הבאים לHuntch</div>
              <div className="login-sub">גיוס חכם לעסקי מזון ואירוח. הכניסו מספר טלפון להמשך.</div>
              <div className="field">
                <label>מספר טלפון</label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="050-0000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePhone()}
                />
              </div>
              <button className="btn-full" onClick={handlePhone}>שלח קוד אימות</button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="login-title">הכניסו את הקוד</div>
              <div className="login-sub" style={{ marginBottom: 16 }}>שלחנו קוד ל{phone} (לצורך ההדגמה — הכניסו כל קוד)</div>
              <input
                className="otp-input"
                type="text"
                dir="ltr"
                placeholder="• • • •"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOtp()}
              />
              <button className="btn-full" onClick={handleOtp}>אמת וכנס</button>
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#bbb' }}>
                <button onClick={() => setStep('phone')} style={{ color: '#c47820', fontWeight: 700, fontSize: 12 }}>
                  שנה מספר
                </button>
              </div>
            </>
          )}

          {step === 'business' && (
            <>
              <div className="login-title">ספרו לנו על העסק</div>
              <div className="login-sub">פרטים אלו ישמשו לחיפוש מועמדים בקרבת מקום.</div>
              <div className="field">
                <label>שמך</label>
                <input
                  type="text"
                  placeholder="למשל: לוסיה"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>שם העסק</label>
                <input
                  type="text"
                  placeholder='למשל: בית קפה לינה'
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>סוג עסק</label>
                <select value={bizType} onChange={e => setBizType(e.target.value as typeof bizType)}>
                  {VENUE_TYPES.map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-full" onClick={handleBusiness} disabled={!bizName || !operatorName}>
                כניסה לHuntch →
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#ccc' }}>
          כניסה לאפליקציה = הסכמה לתנאי השימוש ומדיניות הפרטיות
        </div>
      </div>
    </div>
  );
}
