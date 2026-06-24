'use client';
import { useStore } from '@/lib/store';
import { addToast } from '@/components/Toasts';
import { REQUEST_TYPE_HE } from '@/lib/types';

export default function RequestsPage() {
  const store = useStore();

  const requests = store.employeeRequests.filter(
    r => r.businessId === store.business.id,
  );
  const pendingFirst = [
    ...requests.filter(r => r.status === 'pending'),
    ...requests.filter(r => r.status !== 'pending'),
  ];

  const employee = (id: string) => store.employees.find(e => e.id === id);

  const handleApprove = (id: string, name: string) => {
    store.respondToRequest(id, 'approved');
    addToast('g', `אושרה בקשת ${name}`);
  };
  const handleDeny = (id: string, name: string) => {
    store.respondToRequest(id, 'denied');
    addToast('r', `נדחתה בקשת ${name}`);
  };

  const statusBadge = (s: 'pending' | 'approved' | 'denied') => {
    if (s === 'approved') return { label: 'אושר', bg: 'var(--accent-soft)', color: 'var(--accent)' };
    if (s === 'denied')   return { label: 'נדחה',  bg: '#fbe9e9',          color: '#b91c1c' };
    return { label: 'ממתין', bg: '#fef3c7', color: '#92400e' };
  };

  return (
    <div className="body">
      <main className="main">
        <div className="feed">
          <div className="feed-seg">
            <span className="t">בקשות עובדים</span>
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#b91c1c',
                background: '#fbe9e9', borderRadius: 20, padding: '2px 9px',
              }}>
                {requests.filter(r => r.status === 'pending').length} ממתינות
              </span>
            )}
          </div>

          {pendingFirst.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3>אין בקשות</h3>
              <p>כשעובד יגיש בקשה היא תופיע כאן</p>
            </div>
          )}

          {pendingFirst.map(req => {
            const emp = employee(req.employeeId);
            if (!emp) return null;
            const badge = statusBadge(req.status);
            const isPending = req.status === 'pending';
            const submittedDate = new Date(req.submittedAt).toLocaleDateString('he-IL', {
              day: 'numeric', month: 'short',
            });

            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: '13px 15px',
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  opacity: isPending ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13,
                    background: emp.avatarColor, color: '#fff',
                    display: 'grid', placeItems: 'center',
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {emp.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                      {REQUEST_TYPE_HE[req.type]} · {submittedDate}
                    </div>
                    {req.details && (
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, fontStyle: 'italic' }}>
                        {req.details}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: badge.bg, color: badge.color,
                    borderRadius: 20, padding: '4px 10px', flexShrink: 0,
                  }}>
                    {badge.label}
                  </span>
                </div>

                {isPending && (
                  <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                    <button
                      onClick={() => handleApprove(req.id, emp.name)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 11,
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                      }}
                    >
                      אשר
                    </button>
                    <button
                      onClick={() => handleDeny(req.id, emp.name)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 11,
                        background: '#fbe9e9', color: '#b91c1c',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                      }}
                    >
                      דחה
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
