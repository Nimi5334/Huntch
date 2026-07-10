'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import PatientCard from '@/components/PatientCard';
import AddPatientModal from '@/components/AddPatientModal';
import { generateLead } from '@/lib/leads';
import { canUse } from '@/lib/plan';

interface DailyFeedItem {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  href: string;
}

export default function Home() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [showDaily, setShowDaily] = useState(false);

  const clinic = store.clinic;
  const leads = useMemo(
    () => store.patients.map(p => ({ patient: p, lead: generateLead(p, clinic.type) })),
    [store.patients, clinic.type],
  );

  const actionable = leads.filter(l => l.lead.headline !== 'הכל מעודכן');
  const upToDate = leads.filter(l => l.lead.headline === 'הכל מעודכן');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? leads.filter(l => l.patient.name.toLowerCase().includes(q) || l.patient.phone.includes(q))
    : [...actionable, ...upToDate];

  const roi = store.roiSummary();
  const showRoiTeaser = !canUse(clinic, 'roi_dashboard');

  const pendingEscalations = store.pendingEscalationCount();
  const checkinsDue = store.checkinsDueToday();
  const recentReplies = store.outreach.filter(o => o.status === 'replied').length;

  const dailyFeed: DailyFeedItem[] = [
    { key: 'escalations', label: 'דורש התערבות אנושית', sublabel: 'פניות שממתינות לטיפול', count: pendingEscalations, urgency: 'high', href: '/inbox' },
    { key: 'checkins', label: 'בדיקות איכות תקופתיות', sublabel: 'מוכנות לאישור ושליחה', count: checkinsDue.length, urgency: 'medium', href: '/today' },
    { key: 'leads', label: 'לידים לטיפול', sublabel: 'מטופלים שכדאי להחזיר', count: actionable.length, urgency: 'medium', href: '/today' },
    { key: 'replies', label: 'תגובות ממטופלים', sublabel: 'הגיבו להודעות שנשלחו', count: recentReplies, urgency: 'low', href: '/today' },
  ];
  const totalActionable = dailyFeed.reduce((s, item) => s + item.count, 0);

  const urgencyColor = (u: DailyFeedItem['urgency'], hasCount: boolean) => {
    if (!hasCount) return '#e0d8d0';
    if (u === 'high') return '#b91c1c';
    if (u === 'medium') return '#c08a2e';
    return '#4a7a5a';
  };

  function handleSendLead(patientId: string, message: string) {
    const id = store.createOutreach(patientId, 'reactivation', message);
    store.approveOutreach(id);
    store.sendOutreach(id);
    setSentIds(prev => new Set(prev).add(patientId));
    addToast('g', 'ההודעה אושרה ונשלחה');
  }

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg">
            <span className="t">{clinic.name} · {store.patients.length} מטופלים</span>
          </div>

          {/* "מה חדש היום" — gradient toggle → floating panel */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 4, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowDaily(v => !v)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 border-0 cursor-pointer"
              style={{ background: 'linear-gradient(130deg, #4a7a5a 0%, #7c5c3e 100%)', position: 'relative' }}
              aria-label="מה חדש היום"
            >
              {totalActionable > 0 && (
                <span style={{
                  position: 'absolute', top: -3, insetInlineStart: -3,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#b91c1c', border: '2px solid #fff',
                }} />
              )}
              <span className="ml-2 flex shrink-0 border-l border-white/30 pl-2">
                <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} fill="none">
                  <path fill="white" d="M6.958.713a1 1 0 0 0-1.916 0l-.999 3.33-3.33 1a1 1 0 0 0 0 1.915l3.33.999 1 3.33a1 1 0 0 0 1.915 0l.999-3.33 3.33-1a1 1 0 0 0 0-1.915l-3.33-.999-1-3.33Z" />
                </svg>
              </span>
              {`מה חדש היום, ${clinic.operatorName.split(' ')[0] || 'מנהל'}`}
            </button>

            <AnimatePresence>
              {showDaily && (
                <motion.div
                  key="daily-panel"
                  dir="rtl"
                  initial={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 22 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    marginLeft: -150,
                    marginTop: 8,
                    width: 300,
                    zIndex: 50,
                    background: '#ffffff',
                    border: '1px solid rgba(124,92,62,0.14)',
                    borderRadius: 18,
                    boxShadow: '0 8px 28px rgba(124,92,62,0.14)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(124,92,62,0.1)' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', color: '#7c5c3e', opacity: 0.7, textTransform: 'uppercase' }}>
                      משימות היום · {dailyFeed.filter(i => i.count > 0).length} פעילות
                    </div>
                  </div>

                  {dailyFeed.map((item, idx) => {
                    const hasCount = item.count > 0;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setShowDaily(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 14px',
                          textDecoration: 'none',
                          color: 'inherit',
                          borderBottom: idx < dailyFeed.length - 1 ? '1px solid rgba(124,92,62,0.07)' : 'none',
                          opacity: hasCount ? 1 : 0.45,
                          borderInlineStart: `3px solid ${urgencyColor(item.urgency, hasCount)}`,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#221b16' }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#7c6f63', marginTop: 2 }}>{item.sublabel}</div>
                        </div>
                        {hasCount && (
                          <span style={{
                            fontSize: 12, fontWeight: 800, color: '#fff',
                            background: urgencyColor(item.urgency, true),
                            borderRadius: 20, padding: '1px 8px', flexShrink: 0,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {item.count}
                          </span>
                        )}
                        <span style={{ fontSize: 13, color: '#7c6f63', flexShrink: 0 }}>←</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="btn-ghost" style={{ marginBottom: 14 }} onClick={() => setAddOpen(true)}>
            + הוסף מטופל חדש
          </button>

          {showRoiTeaser && roi.potentialRevenue > 0 && (
            <Link href="/settings/billing" className="qr-compact" style={{ marginBottom: 14 }}>
              <div className="sq" style={{ background: 'var(--accent-soft)', display: 'grid', placeItems: 'center' }}>
                <span style={{ fontSize: 18 }}>💡</span>
              </div>
              <div>
                <div className="nm">₪{roi.potentialRevenue.toLocaleString()} ניתן להחזיר אוטומטית</div>
                <div className="ds">שדרג/י למתקדם כדי להפעיל שליחה אוטומטית ולוח ROI</div>
              </div>
              <span className="go">←</span>
            </Link>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="חיפוש מטופל לפי שם או טלפון…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <h3>לא נמצאו מטופלים</h3>
              <p>נסה/י מונח חיפוש אחר, או הוסף/הוסיפי מטופל חדש.</p>
            </div>
          )}

          {filtered.map(({ patient, lead }) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              lead={lead}
              sent={sentIds.has(patient.id)}
              onSendLead={() => handleSendLead(patient.id, lead.draftMessage)}
            />
          ))}
        </div>
      </main>
      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
