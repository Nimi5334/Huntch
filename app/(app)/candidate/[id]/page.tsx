'use client';
import { use, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { computeDna, dnaLabel, churnLabel } from '@/lib/dna';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצרות', cook: 'טבחות', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמנות', cashier: 'קופה', host: 'מארח/ת',
  delivery: 'שליחות', 'shift-manager': 'אחמ״ש',
};
const SHIFT_HE: Record<string, string> = {
  morning: 'בקרים', afternoon: 'צהריים', evening: 'ערבים', night: 'לילות', weekend: 'סופ״ש',
};
const LANG_HE: Record<string, string> = { he: 'עברית', ar: 'ערבית', en: 'אנגלית', ru: 'רוסית' };

function generateCandidateSummary(cand: any, score: number | null, dna: any): string {
  const roleHe = ROLE_HE[cand.roles[0]] ?? cand.roles[0];
  const dist = `${cand.willingRangeKm} ק"מ`;
  const exp = cand.experience.totalYears;
  const scoreDesc = score != null ? (score >= 80 ? 'התאמה גבוהה מאוד' : score >= 65 ? 'התאמה טובה' : 'התאמה בינונית') : '';
  const avail = cand.availability.immediate ? 'זמין/ה מיידית' : `זמין/ה מ-${cand.availability.earliestStart}`;
  const churnNote = dna.churnRisk === 'high' ? ' שים לב: ציון הפעילות נמוך — מומלץ לוודא זמינות לפני ההזמנה.' : '';

  return `${cand.name} ${roleHe} עם ${exp} שנות ניסיון, גר/ה במרחק ${dist} מהעסק. ${avail}${scoreDesc ? ` — ${scoreDesc}` : ''}.${churnNote}`;
}

function generateInterviewQuestions(cand: any, dna: any): string[] {
  const questions: string[] = [];
  const role = cand.roles[0];

  if (role === 'barista') questions.push('ספר/י על החוויה הכי מאתגרת שלך מאחורי הבר — איך התמודדת?');
  else if (role === 'cook' || role === 'line-cook') questions.push('מה הניסיון שלך עם עומסים גבוהים במטבח?');
  else if (role === 'server') questions.push('תאר/י מצב בו לקוח היה לא מרוצה — מה עשית?');
  else questions.push('ספר/י על הניסיון הקודם שלך בתפקיד זה.');

  if (cand.availability.shifts.includes('morning')) questions.push('האם יש לך אפשרות להגיע בזמן למשמרת בוקר מוקדמת (6:00-7:00)?');
  else questions.push('מה הזמינות שלך לשבועיים הקרובים?');

  if (dna.churnRisk !== 'low') questions.push('מה גרם לך לעזוב את המקום הקודם? מה חשוב לך בסביבת עבודה?');
  else questions.push(`מה אתה/את מחפש/ת בעבודה הבאה שלך ב${ROLE_HE[role] ?? role}?`);

  return questions;
}

function CandidateProfileInner({ id }: { id: string }) {
  const router = useRouter();
  const jobId = useSearchParams().get('job') ?? 'job-1';
  const store = useStore();

  const cand = store.pool.find(c => c.id === id);
  if (!cand) {
    return (
      <>
        <div className="back-bar"><span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span><b>פרופיל מועמד</b></div>
        <div className="empty-state" style={{ paddingTop: 80 }}><h3>המועמד לא נמצא</h3></div>
      </>
    );
  }

  const ranked = store.rankedForJob(jobId).find(c => c.id === id);
  const score = ranked?.score ?? null;
  const invited = store.invitedIdsForJob(jobId).includes(id);
  const saved = store.savedCandidateIds.includes(id);
  const dna = computeDna(cand);

  const distanceTxt = ` · ${cand.hasCar ? 'ברכב' : 'ברגל / אופניים'}`;
  const availTxt = `${cand.availability.immediate ? 'מיידית' : `החל מ-${cand.availability.earliestStart}`} · ${cand.availability.shifts.map(s => SHIFT_HE[s]).join(', ')}`;
  const expTxt = `${cand.experience.totalYears} שנים${cand.experience.notableWorkplaces.length ? ` — ${cand.experience.notableWorkplaces.slice(0, 2).join(', ')}` : ''}`;

  return (
    <>
      <div className="back-bar"><span className="ar" style={{ cursor: 'pointer' }} onClick={() => router.back()}>→</span><b>פרופיל מועמד</b></div>

      <div className="prof-hero">
        <div className="prof-big" style={{ background: cand.avatarColor }}>{cand.initials}</div>
        <h2>{cand.name}</h2>
        <div className="sub">{ROLE_HE[cand.roles[0]] ?? cand.roles[0]} · {cand.neighborhood}</div>
        {score != null && <div className="prof-fit">התאמה למשרה <b>{score}%</b></div>}
      </div>

      <div className="prof-body">
        <div className="prow"><div className="lab">מרחק</div><div className="val">עד {cand.willingRangeKm} ק"מ{distanceTxt}</div></div>
        <div className="prow"><div className="lab">זמינות</div><div className="val">{availTxt}</div></div>
        <div className="prow"><div className="lab">היקף</div><div className="val">{cand.availability.hoursPerWeek} שעות שבועיות</div></div>
        <div className="prow"><div className="lab">ניסיון</div><div className="val">{expTxt}</div></div>
        <div className="prow"><div className="lab">שכר מבוקש</div><div className="val">{cand.expectedWageNis} ₪ לשעה</div></div>
        <div className="prow"><div className="lab">תפקידים</div><div className="chips">{cand.roles.map(r => <span key={r}>{ROLE_HE[r] ?? r}</span>)}</div></div>
        {cand.skills.length > 0 && <div className="prow"><div className="lab">כישורים</div><div className="chips">{cand.skills.map(s => <span key={s}>{s}</span>)}</div></div>}
        <div className="prow" style={{ borderBottom: 'none' }}><div className="lab">שפות</div><div className="chips">{cand.languages.map(l => <span key={l}>{LANG_HE[l] ?? l}</span>)}</div></div>
      </div>

      {/* AI INTERVIEW PROFILE */}
      <div className="dna-section" style={{ marginTop: 0, borderRadius: '20px 20px 0 0', borderBottom: '1px solid rgba(124,92,62,0.1)' }}>
        <div className="dna-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          AI Interview Profile
        </div>
        {/* Context tags */}
        <div className="dna-tags" style={{ marginBottom: 10 }}>
          {cand.roles.map(r => ROLE_HE[r]).filter(Boolean).slice(0,1).map(role => (
            <span key={role} className="dna-tag" style={{ background: 'rgba(74,122,90,0.1)', color: '#4a7a5a' }}>✓ מנוסה ב{role}</span>
          ))}
          {cand.availability.shifts.includes('morning') && <span className="dna-tag">משמרות בוקר</span>}
          {cand.availability.shifts.includes('evening') && <span className="dna-tag">משמרות ערב</span>}
          {cand.availability.immediate && <span className="dna-tag" style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>⚡ זמין מיידית</span>}
          {cand.willingRangeKm <= 2 && <span className="dna-tag">קרוב לעסק</span>}
          {cand.experience.totalYears >= 3 && <span className="dna-tag">{cand.experience.totalYears}+ שנות ניסיון</span>}
        </div>
        {/* AI-generated summary */}
        <div style={{ fontSize: 13, color: '#7c6f63', lineHeight: 1.55, marginBottom: 12, padding: '0 2px' }}>
          {generateCandidateSummary(cand, score, dna)}
        </div>
        {/* Suggested interview questions */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7c5c3e', opacity: 0.7, marginBottom: 6 }}>
          שאלות ראיון מומלצות
        </div>
        {generateInterviewQuestions(cand, dna).map((q, i) => (
          <div key={i} style={{ fontSize: 13, color: '#221b16', padding: '5px 0', borderBottom: i < 2 ? '1px solid rgba(124,92,62,0.08)' : 'none' }}>
            {i + 1}. {q}
          </div>
        ))}
      </div>

      {/* DNA SECTION */}
      <div className="dna-section">
        <div className="dna-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Worker DNA Engine
        </div>
        <div className="dna-top">
          <div className="dna-big">
            <div className="dna-big-num" style={{ color: dna.score >= 70 ? '#16a34a' : dna.score >= 50 ? 'var(--amber-ink)' : '#b91c1c' }}>{dna.score}</div>
            <div className="dna-big-lbl">{dnaLabel(dna.score)}</div>
          </div>
          <div className="dna-churn-pill" data-risk={dna.churnRisk}>
            <span className={`churn-pip ${dna.churnRisk}`} />
            {churnLabel(dna.churnRisk)}
          </div>
        </div>

        <div className="dna-sub-bars">
          <div className="dna-sub-row">
            <span className="dna-sub-lbl">אמינות</span>
            <div className="dna-sub-track"><div className="dna-sub-fill" style={{ width: `${dna.reliability}%` }} /></div>
            <span className="dna-sub-val">{dna.reliability}</span>
          </div>
          <div className="dna-sub-row">
            <span className="dna-sub-lbl">מהירות מענה</span>
            <div className="dna-sub-track"><div className="dna-sub-fill" style={{ width: `${dna.responseSpeed}%` }} /></div>
            <span className="dna-sub-val">{dna.responseSpeed}</span>
          </div>
          <div className="dna-sub-row">
            <span className="dna-sub-lbl">פעילות לאחרונה</span>
            <div className="dna-sub-track"><div className="dna-sub-fill" style={{ width: `${dna.recency}%` }} /></div>
            <span className="dna-sub-val">{dna.recency}</span>
          </div>
        </div>

        {dna.tags.length > 0 && (
          <div className="dna-tags">
            {dna.tags.map(tag => <span key={tag} className="dna-tag">{tag}</span>)}
          </div>
        )}
      </div>

      {/* RETENTION PANEL — shown only if medium/high churn risk */}
      {dna.churnRisk !== 'low' && (
        <div className="dna-section" style={{ background: dna.churnRisk === 'high' ? 'rgba(185,28,28,0.04)' : 'rgba(180,83,9,0.04)', borderTop: '1px solid rgba(124,92,62,0.1)', borderRadius: 0 }}>
          <div className="dna-header" style={{ color: dna.churnRisk === 'high' ? '#b91c1c' : '#b45309' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {dna.churnRisk === 'high' ? 'סיכון עזיבה גבוה — פעל עכשיו' : 'סיכון עזיבה בינוני — מעקב מומלץ'}
          </div>
          <div style={{ fontSize: 13, color: '#7c6f63', marginBottom: 12 }}>
            {dna.churnRisk === 'high'
              ? 'הפעילות של עובד/ת זה/ז ירדה משמעותית. ייתכן שהוא/היא מחפש/ת אלטרנטיבות.'
              : 'נרשמה ירידה קלה בפעילות. כדאי לשמור על קשר.'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7c5c3e', opacity: 0.7, marginBottom: 8 }}>המלצות שימור</div>
          {[
            dna.churnRisk === 'high' ? 'שלח/י הודעת בדיקת זמינות אישית' : 'בדוק/י מה הזמינות לשבוע הבא',
            'שקול/י להציע שינוי שעות שמתאים יותר',
            `הצע/י משמרות ${cand.availability.shifts[0] ? SHIFT_HE[cand.availability.shifts[0]] : 'מתאימות'} שמתאימות לו/ה`,
          ].map((action, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(124,92,62,0.08)' : 'none', fontSize: 13, color: '#221b16' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>
              {action}
            </div>
          ))}
        </div>
      )}

      <div className="prof-cta">
        <button className={`save ${saved ? 'on' : ''}`} aria-label="שמור" onClick={() => { store.saveCandidate(id); addToast('a', 'נשמר לרשימה'); }}>
          {saved ? '♥' : '♡'}
        </button>
        <button className="inv" disabled={invited} onClick={() => { store.inviteCandidate(jobId, id); addToast('g', `הזמנה נשלחה ל${cand.name}`); router.push('/'); }}>
          {invited ? 'כבר הוזמן/ה ✓' : 'הזמן לראיון'}
        </button>
      </div>
    </>
  );
}

export default function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <>
        <div className="back-bar"><b>פרופיל מועמד</b></div>
        <div className="empty-state" style={{ paddingTop: 80 }}><h3>טוען…</h3></div>
      </>
    }>
      <CandidateProfileInner id={id} />
    </Suspense>
  );
}
