'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { canUse } from '@/lib/plan';
import UpgradeLock from '@/components/UpgradeLock';
import type { AutomationSettings } from '@/lib/types';

type ChatMsg = { role: 'patient' | 'ai'; text: string };

const FREQ_OPTIONS = [30, 60, 90, 120];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? 'var(--accent)' : '#d8cfc4', position: 'relative', transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, insetInlineStart: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'inset-inline-start .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export default function AutomationPage() {
  const store = useStore();
  const clinic = store.clinic;
  const gated = !canUse(clinic, 'ai_brain');
  const auto = store.automationSettings();

  const [hours, setHours] = useState(clinic.knowledge.hours ?? '');
  const [doctors, setDoctors] = useState(clinic.knowledge.doctors ?? '');
  const [services, setServices] = useState(clinic.knowledge.services ?? '');
  const [pricingNotes, setPricingNotes] = useState(clinic.knowledge.pricingNotes ?? '');
  const [insurance, setInsurance] = useState(clinic.knowledge.insurance ?? '');
  const [policies, setPolicies] = useState(clinic.knowledge.policies ?? '');

  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [patientInput, setPatientInput] = useState('');
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (gated) {
    return <UpgradeLock title="אוטומציה זמינה בתוכנית המתקדמת" description="נהל/י את כל מה שהמערכת עושה אוטומטית — בדיקות איכות, לידים, מענה אוטומטי וסימולציית אימון. שדרג/י כדי לפתוח את הפיצ'ר." />;
  }

  function toggle(key: keyof AutomationSettings) {
    store.updateAutomation({ [key]: !auto[key] } as Partial<AutomationSettings>);
  }

  function setFrequency(days: number) {
    store.updateAutomation({ qualityCheckFrequencyDays: days });
    addToast('g', 'תדירות הבדיקות עודכנה');
  }

  function saveKnowledge() {
    store.updateKnowledge({ hours, doctors, services, pricingNotes, insurance, policies });
    addToast('g', 'עודכן ידע העסק');
  }

  function addFaq() {
    if (!newQ.trim() || !newA.trim()) { addToast('a', 'נא למלא שאלה ותשובה'); return; }
    store.addFaq({ question: newQ.trim(), answer: newA.trim() });
    setNewQ(''); setNewA('');
    addToast('g', 'שאלה נפוצה נוספה');
  }

  async function sendSimPatientMessage() {
    if (!patientInput.trim()) return;
    const msg = patientInput.trim();
    setChat(prev => [...prev, { role: 'patient', text: msg }]);
    setPatientInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ patientMsg: msg, knowledge: clinic.knowledge, clinicName: clinic.name }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: 'ai', text: data.reply ?? 'לא הצלחתי להגיב, נסה שוב.' }]);
    } catch {
      setChat(prev => [...prev, { role: 'ai', text: 'שגיאה בתקשורת עם ה-AI. נסה שוב.' }]);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(index: number, text: string) {
    setEditing({ index, text });
  }

  function approveAndLearn() {
    if (!editing) return;
    const patientMsgEntry = [...chat].slice(0, editing.index).reverse().find(m => m.role === 'patient');
    if (!patientMsgEntry) { addToast('a', 'לא נמצאה הודעת לקוח מתאימה'); return; }
    store.addVoiceExample({ patientMsg: patientMsgEntry.text, approvedReply: editing.text });
    setChat(prev => prev.map((m, i) => i === editing.index ? { ...m, text: editing.text } : m));
    setEditing(null);
    addToast('g', 'הדוגמה נשמרה — המערכת למדה את הסגנון');
  }

  const AUTOMATIONS: { key: keyof AutomationSettings; title: string; desc: string }[] = [
    { key: 'qualityChecks', title: 'בדיקות איכות תקופתיות', desc: 'הודעה אישית אחרי טיפול — נוחות, החלמה ושביעות רצון' },
    { key: 'reactivationLeads', title: 'לידים להחזרת מטופלים', desc: 'זיהוי מטופלים רדומים והצעת פנייה מותאמת' },
    { key: 'reviewRequests', title: 'בקשות ביקורת', desc: 'בקשה עדינה לביקורת ממטופלים שביקרו לאחרונה' },
    { key: 'autoAnswer', title: 'מענה אוטומטי לשאלות', desc: 'המערכת עונה לשאלות שגרתיות מתוך הידע על העסק' },
  ];

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg"><span className="t">אוטומציה</span></div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            כאן מנוהל כל מה שהמערכת עושה באופן אוטומטי. הפעל/י, כבה/י ותאם/י כל פעולה לפי הצורך.
          </p>

          {/* ── Automatic actions ── */}
          <div className="feed-seg"><span className="t">פעולות אוטומטיות</span></div>
          {AUTOMATIONS.map(a => (
            <div key={a.key}>
              <div className="inv-row" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="nm">{a.title}</div>
                  <div className="stt">{a.desc}</div>
                </div>
                <Toggle on={!!auto[a.key]} onClick={() => toggle(a.key)} />
              </div>
              {/* Frequency control appears under quality-checks when enabled */}
              {a.key === 'qualityChecks' && auto.qualityChecks && (
                <div style={{ padding: '4px 4px 12px' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>תדירות בדיקת שלום למטופל רדום</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {FREQ_OPTIONS.map(d => (
                      <button
                        key={d}
                        className={`chip${auto.qualityCheckFrequencyDays === d ? ' on' : ''}`}
                        onClick={() => setFrequency(d)}
                      >
                        כל {d} ימים
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 8 }}>
                    בדיקות ספציפיות לטיפול (סד לילה, שתל, הלבנה ועוד) נשלחות אוטומטית במועד המתאים לכל טיפול.
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Approve-before-send */}
          <div className="inv-row" style={{ alignItems: 'center', marginTop: 4 }}>
            <div style={{ flex: 1 }}>
              <div className="nm">אישור לפני שליחה</div>
              <div className="stt">{auto.approveBeforeSend ? 'שום הודעה לא נשלחת ללא אישור שלך (מומלץ)' : 'שים לב: הודעות עשויות להישלח ללא אישור ידני'}</div>
            </div>
            <Toggle on={auto.approveBeforeSend} onClick={() => toggle('approveBeforeSend')} />
          </div>

          {/* ── Business knowledge (feeds the auto-answer) ── */}
          <div className="feed-seg" style={{ marginTop: 8 }}><span className="t">ידע על העסק</span></div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>המידע כאן מזין את המענה האוטומטי — ככל שיש יותר פרטים, התשובות מדויקות יותר.</p>
          <div className="field"><label>שעות פעילות</label><input value={hours} onChange={e => setHours(e.target.value)} placeholder="א׳-ה׳ 9:00-19:00" /></div>
          <div className="field"><label>רופאים / מטפלים</label><input value={doctors} onChange={e => setDoctors(e.target.value)} /></div>
          <div className="field"><label>שירותים</label><input value={services} onChange={e => setServices(e.target.value)} /></div>
          <div className="field"><label>הערות מחיר</label><textarea value={pricingNotes} onChange={e => setPricingNotes(e.target.value)} /></div>
          <div className="field"><label>ביטוחים</label><input value={insurance} onChange={e => setInsurance(e.target.value)} /></div>
          <div className="field"><label>מדיניות (ביטולים וכו&apos;)</label><textarea value={policies} onChange={e => setPolicies(e.target.value)} /></div>
          <button className="btn-invite" style={{ marginBottom: 24 }} onClick={saveKnowledge}>שמור ידע</button>

          {/* FAQ manager */}
          <div className="feed-seg"><span className="t">שאלות נפוצות · {clinic.knowledge.faqs.length}</span></div>
          {clinic.knowledge.faqs.map(f => (
            <div key={f.id} className="inv-row">
              <div style={{ flex: 1 }}>
                <div className="nm">{f.question}</div>
                <div className="stt">{f.answer}</div>
              </div>
              <button className="ico" aria-label="מחק" onClick={() => store.removeFaq(f.id)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          <div className="field"><label>שאלה חדשה</label><input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="לדוגמה: האם אתם עובדים בשישי?" /></div>
          <div className="field"><label>תשובה</label><textarea value={newA} onChange={e => setNewA(e.target.value)} /></div>
          <button className="btn-ghost" style={{ marginBottom: 24 }} onClick={addFaq}>+ הוסף שאלה נפוצה</button>

          {/* Simulation trainer */}
          <div className="feed-seg"><span className="t">סימולציית אימון</span></div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
            כתוב/י הודעה כאילו את/ה הלקוח/ה. המערכת תגיב, ואת/ה יכול/ה לערוך את התגובה וללמד אותה את הסגנון הנכון.
          </p>

          <div className="dna-section" style={{ marginTop: 0 }}>
            {chat.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>אין הודעות עדיין — התחל/י שיחה למטה.</div>}
            {chat.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, textAlign: m.role === 'patient' ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', maxWidth: '85%', padding: '8px 12px', borderRadius: 12, fontSize: 13.5,
                  background: m.role === 'patient' ? 'var(--cedar-soft)' : 'var(--accent-soft)',
                  color: m.role === 'patient' ? 'var(--cedar)' : 'var(--accent)',
                }}>
                  {m.text}
                </div>
                {m.role === 'ai' && editing?.index !== i && (
                  <div>
                    <button className="ico" style={{ fontSize: 11, width: 'auto', padding: '2px 8px' }} onClick={() => startEdit(i, m.text)}>ערוך ולמד</button>
                  </div>
                )}
                {editing?.index === i && (
                  <div style={{ marginTop: 6 }}>
                    <textarea value={editing.text} onChange={e => setEditing({ index: i, text: e.target.value })} style={{ width: '100%' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button className="btn-ghost" onClick={() => setEditing(null)}>ביטול</button>
                      <button className="btn-invite" onClick={approveAndLearn}>אשר ולמד</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="field">
            <label>הודעת &quot;לקוח&quot; (אתה מגלם את הלקוח)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={patientInput}
                onChange={e => setPatientInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendSimPatientMessage()}
                placeholder="לדוגמה: כמה עולה הלבנת שיניים?"
                style={{ flex: 1 }}
              />
              <button className="btn-invite" disabled={busy} onClick={sendSimPatientMessage}>{busy ? '…' : 'שלח'}</button>
            </div>
          </div>

          {clinic.knowledge.voiceExamples.length > 0 && (
            <>
              <div className="feed-seg"><span className="t">דוגמאות סגנון שנלמדו · {clinic.knowledge.voiceExamples.length}</span></div>
              {clinic.knowledge.voiceExamples.map(v => (
                <div key={v.id} className="inv-row">
                  <div style={{ flex: 1 }}>
                    <div className="stt">לקוח: {v.patientMsg}</div>
                    <div className="nm">תגובה: {v.approvedReply}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
