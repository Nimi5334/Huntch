'use client';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { CLINIC_TYPE_HE } from '@/lib/clinical';
import {
  effectivePlan,
  isTrialActive,
  PLAN_FEATURES_HE,
  SUBSCRIPTION_PRICE_USD,
  SUBSCRIPTION_PRICE_ILS,
  AVG_RETURNING_PATIENT_ILS,
  MONTHS_COVERED_PER_PATIENT,
} from '@/lib/plan';

export default function ProfilePage() {
  const router = useRouter();
  const store = useStore();
  const clinic = store.clinic;

  const subscribed = effectivePlan(clinic) === 'advanced';
  const trialActive = isTrialActive(clinic);

  function handleLogout() {
    store.logout();
    router.replace('/login');
  }

  function toggleSubscription() {
    if (subscribed) {
      store.setPlan('basic');
      addToast('a', 'המנוי בוטל — חזרת לשליחה ידנית');
    } else {
      store.setPlan('advanced');
      addToast('g', 'המנוי הופעל — האפליקציה שולחת בעצמה (באישורך)');
    }
  }

  return (
    <>
      <div className="back-bar">
        <span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span>
        <b>פרופיל וחיוב</b>
      </div>

      <div className="prof-hero">
        <div className="prof-big" style={{ background: 'var(--accent)' }}>
          {clinic.operatorName?.[0] ?? 'ר'}
        </div>
        <h2>{clinic.name || 'המרפאה שלי'}</h2>
        <div className="sub">
          {CLINIC_TYPE_HE[clinic.type] ?? clinic.type}
          {clinic.address ? ` · ${clinic.address}` : ''}
        </div>
      </div>

      {/* CLINIC STATS */}
      <div className="dna-section" style={{ marginTop: 14 }}>
        <div className="pp-stats" style={{ marginBottom: 0 }}>
          <div className="pp-stat">
            <div className="pp-snum">{store.patients.length}</div>
            <div className="pp-slabel">מטופלים</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{store.outreach.length}</div>
            <div className="pp-slabel">הודעות נשלחו</div>
          </div>
          <div className="pp-stat">
            <div className="pp-snum">{subscribed ? 'פעיל' : 'ידני'}</div>
            <div className="pp-slabel">מנוי</div>
          </div>
        </div>
      </div>

      {trialActive && clinic.plan === 'basic' && (
        <div
          className="dna-section"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 13 }}
        >
          🎁 תקופת ניסיון פעילה עד {new Date(clinic.trialEndsAt!).toLocaleDateString('he-IL')} — כל היכולות פתוחות בחינם.
        </div>
      )}

      {/* ── PLAN GLASS CARD ── */}
      <div className="dna-section">
        <div className="dna-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          מנוי Huntch
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 38, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
            ${SUBSCRIPTION_PRICE_USD}
          </span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>/ חודש · (~₪{SUBSCRIPTION_PRICE_ILS})</span>
        </div>

        <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLAN_FEATURES_HE.advanced.map((f) => (
            <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5, color: 'var(--ink)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ fill: 'var(--accent)', flex: 'none', marginTop: 1 }}>
                <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {/* ── WHY IT'S WORTH IT — real math ── */}
        <div
          style={{
            background: 'var(--cedar-soft)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cedar)', marginBottom: 10 }}>
            מטופל אחד שחוזר = כ־{MONTHS_COVERED_PER_PATIENT} חודשי מנוי מראש
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--muted)' }}>הכנסה ממטופל שחוזר לבדיקה תקופתית</span>
              <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>₪{AVG_RETURNING_PATIENT_ILS.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--muted)' }}>עלות המנוי לחודש</span>
              <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>${SUBSCRIPTION_PRICE_USD} (~₪{SUBSCRIPTION_PRICE_ILS})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 7, borderTop: '1px solid var(--line)', color: 'var(--accent)', fontWeight: 800 }}>
              <span>₪{AVG_RETURNING_PATIENT_ILS} ÷ ₪{SUBSCRIPTION_PRICE_ILS}</span>
              <span style={{ whiteSpace: 'nowrap' }}>≈ {MONTHS_COVERED_PER_PATIENT} חודשים</span>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            מספיק להחזיר מטופל אחד בלבד כל ~3 חודשים כדי שהאפליקציה תחזיר את עצמה במלואה —
            כל מטופל נוסף שחוזר החודש הוא רווח נקי למרפאה.
          </div>
        </div>

        {subscribed ? (
          <button className="btn-ghost" style={{ width: '100%' }} onClick={toggleSubscription}>
            בטל מנוי (מעבר לשליחה ידנית)
          </button>
        ) : (
          <button className="btn-invite" style={{ width: '100%', padding: '13px 18px', borderRadius: 12 }} onClick={toggleSubscription}>
            הפעל מנוי · ${SUBSCRIPTION_PRICE_USD}/חודש
          </button>
        )}
      </div>

      {/* LOGOUT */}
      <div className="dna-section">
        <button
          className="btn-ghost"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={handleLogout}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          התנתק
        </button>
      </div>

      <div aria-hidden="true" style={{ height: 40 }} />
    </>
  );
}
