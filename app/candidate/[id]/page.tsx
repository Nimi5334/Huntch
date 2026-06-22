'use client';
import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import Toasts, { addToast } from '@/components/Toasts';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצרות', cook: 'טבחות', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמנות', cashier: 'קופה', host: 'מארח/ת',
  delivery: 'שליחות', 'shift-manager': 'אחמ״ש',
};
const SHIFT_HE: Record<string, string> = {
  morning: 'בקרים', afternoon: 'צהריים', evening: 'ערבים', night: 'לילות', weekend: 'סופ״ש',
};
const LANG_HE: Record<string, string> = { he: 'עברית', ar: 'ערבית', en: 'אנגלית', ru: 'רוסית' };

export default function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const jobId = useSearchParams().get('job') ?? 'job-1';
  const store = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  if (!hydrated) return null;

  const cand = store.pool.find(c => c.id === id);
  if (!cand) {
    return (
      <div className="app"><div className="back-bar"><span className="ar" onClick={() => router.back()}>→</span><b>פרופיל מועמד</b></div>
        <div className="empty-state" style={{ paddingTop: 80 }}><h3>המועמד לא נמצא</h3></div>
      </div>
    );
  }

  const ranked = store.rankedForJob(jobId).find(c => c.id === id);
  const score = ranked?.score ?? null;
  const invited = store.invitedIdsForJob(jobId).includes(id);
  const saved = store.savedCandidateIds.includes(id);

  const distanceTxt = `${cand.willingRangeKm <= 2 ? 'קרוב' : ''} · ${cand.hasCar ? 'ברכב' : 'ברגל / אופניים'}`;
  const availTxt = `${cand.availability.immediate ? 'מיידית' : `החל מ-${cand.availability.earliestStart}`} · ${cand.availability.shifts.map(s => SHIFT_HE[s]).join(', ')}`;
  const expTxt = `${cand.experience.totalYears} שנים${cand.experience.notableWorkplaces.length ? ` — ${cand.experience.notableWorkplaces.slice(0, 2).join(', ')}` : ''}`;

  return (
    <div className="app">
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

      <div className="prof-cta">
        <button className={`save ${saved ? 'on' : ''}`} aria-label="שמור" onClick={() => { store.saveCandidate(id); addToast('a', 'נשמר לרשימה'); }}>
          {saved ? '♥' : '♡'}
        </button>
        <button className="inv" disabled={invited} onClick={() => { store.inviteCandidate(jobId, id); addToast('g', `הזמנה נשלחה ל${cand.name}`); router.push('/'); }}>
          {invited ? 'כבר הוזמן/ה ✓' : 'הזמן לראיון'}
        </button>
      </div>
      <Toasts />
    </div>
  );
}
