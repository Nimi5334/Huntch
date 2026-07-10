'use client';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { effectivePlan, isTrialActive, PLAN_PRICE_ILS, PLAN_FEATURES_HE } from '@/lib/plan';
import type { Plan } from '@/lib/types';

export default function BillingPage() {
  const router = useRouter();
  const store = useStore();
  const clinic = store.clinic;
  const current = effectivePlan(clinic);
  const trialActive = isTrialActive(clinic);

  function choosePlan(plan: Plan) {
    store.setPlan(plan);
    addToast('g', plan === 'advanced' ? 'שודרג לתוכנית מתקדמת' : 'הועבר לתוכנית בסיסית');
  }

  return (
    <>
      <div className="back-bar"><span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span><b>חיוב ומנוי</b></div>

      <div className="body">
        <main className="main">
          <div className="feed">
            {trialActive && clinic.plan === 'basic' && (
              <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--accent)' }}>
                🎁 את/ה בתקופת ניסיון של תוכנית מתקדמת עד {new Date(clinic.trialEndsAt!).toLocaleDateString('he-IL')}
              </div>
            )}

            {(['basic', 'advanced'] as Plan[]).map(plan => {
              const isCurrent = clinic.plan === plan;
              const isEffective = current === plan;
              return (
                <div key={plan} className="dna-section" style={{ marginTop: 0, border: isEffective ? '2px solid var(--accent)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{plan === 'basic' ? 'בסיסי' : 'מתקדם'}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                        ₪{PLAN_PRICE_ILS[plan]}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>/חודש</span>
                      </div>
                    </div>
                    {isCurrent && <span className="inv-badge2 b-yes">התוכנית הנוכחית</span>}
                  </div>
                  {PLAN_FEATURES_HE[plan].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13.5 }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>{f}
                    </div>
                  ))}
                  {!isCurrent && (
                    <button className="btn-invite" style={{ marginTop: 12, width: '100%' }} onClick={() => choosePlan(plan)}>
                      {plan === 'advanced' ? 'שדרג/י למתקדם' : 'עבור/י לבסיסי'}
                    </button>
                  )}
                </div>
              );
            })}

            <p style={{ fontSize: 11.5, color: 'var(--muted2)', textAlign: 'center', marginTop: 8 }}>
              חיוב אמיתי דרך Stripe יופעל בקרוב — כרגע ניתן לעבור בין תוכניות ללא עלות בהדגמה.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
