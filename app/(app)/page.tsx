'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import PatientCard from '@/components/PatientCard';
import AddPatientModal from '@/components/AddPatientModal';
import { generateLead } from '@/lib/leads';
import { daysSince } from '@/lib/clinical';

interface TaskItem {
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
  const [addOpen, setAddOpen] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  const clinic = store.clinic;
  const auto = store.automationSettings();

  const q = query.trim().toLowerCase();
  const patients = useMemo(() => {
    const sorted = [...store.patients].sort((a, b) => (b.lastVisit ?? '').localeCompare(a.lastVisit ?? ''));
    if (!q) return sorted;
    return sorted.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
  }, [store.patients, q]);

  // Task counts for the "המשימות שלי" popover
  const now = new Date().toISOString().slice(0, 10);
  const pendingEscalations = store.pendingEscalationCount();
  const checkinsDue = auto.qualityChecks ? store.checkinsDueToday().length : 0;
  const actionableLeads = useMemo(
    () => auto.reactivationLeads
      ? store.patients.filter(p => generateLead(p, clinic.type).headline !== 'הכל מעודכן').length
      : 0,
    [store.patients, clinic.type, auto.reactivationLeads],
  );
  const reviewNudges = useMemo(
    () => auto.reviewRequests
      ? store.patients.filter(p => {
          const lastT = p.treatments.find(t => t.status === 'completed');
          if (!lastT) return false;
          const d = daysSince(lastT.date, now);
          return d >= 2 && d <= 10;
        }).length
      : 0,
    [store.patients, now, auto.reviewRequests],
  );

  const tasks: TaskItem[] = [
    { key: 'escalations', label: 'דורש התערבות אנושית', sublabel: 'פניות שממתינות לטיפול', count: pendingEscalations, urgency: 'high', href: '/tasks?focus=escalations' },
    { key: 'checkins', label: 'בדיקות איכות תקופתיות', sublabel: 'מוכנות לאישור ושליחה', count: checkinsDue, urgency: 'medium', href: '/tasks?focus=checkins' },
    { key: 'leads', label: 'לידים להחזרת מטופלים', sublabel: 'מטופלים שכדאי להחזיר', count: actionableLeads, urgency: 'medium', href: '/tasks?focus=leads' },
    { key: 'reviews', label: 'בקשות ביקורת', sublabel: 'מטופלים שביקרו לאחרונה', count: reviewNudges, urgency: 'low', href: '/tasks?focus=reviews' },
  ];
  const totalActionable = tasks.reduce((s, item) => s + item.count, 0);

  const urgencyColor = (u: TaskItem['urgency'], hasCount: boolean) => {
    if (!hasCount) return '#e0d8d0';
    if (u === 'high') return '#b91c1c';
    if (u === 'medium') return '#c08a2e';
    return '#4a7a5a';
  };

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg">
            <span className="t">{clinic.name} · {store.patients.length} מטופלים</span>
          </div>

          {/* "המשימות שלי" — gradient toggle → floating panel */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 4, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowTasks(v => !v)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 border-0 cursor-pointer"
              style={{ background: 'linear-gradient(130deg, #4a7a5a 0%, #7c5c3e 100%)', position: 'relative' }}
              aria-label="המשימות שלי"
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
              המשימות שלי
            </button>

            <AnimatePresence>
              {showTasks && (
                <motion.div
                  key="tasks-panel"
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
                      משימות להתייעלות · {tasks.filter(i => i.count > 0).length} פעילות
                    </div>
                  </div>

                  {tasks.map((item, idx) => {
                    const hasCount = item.count > 0;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setShowTasks(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 14px',
                          textDecoration: 'none',
                          color: 'inherit',
                          borderBottom: idx < tasks.length - 1 ? '1px solid rgba(124,92,62,0.07)' : 'none',
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

          <div className="field" style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="חיפוש מטופל לפי שם או טלפון…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {patients.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <h3>לא נמצאו מטופלים</h3>
              <p>נסה/י מונח חיפוש אחר, או הוסף/הוסיפי מטופל חדש.</p>
            </div>
          )}

          {patients.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      </main>
      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
