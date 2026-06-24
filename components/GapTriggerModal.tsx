'use client';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { addToast } from './Toasts';
import { venueRoles, ROLE_HE, ROLE_ICON } from '@/lib/venue';
import type { Role } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GapTriggerModal({ open, onClose }: Props) {
  const router = useRouter();
  const reportGap = useStore(s => s.reportGap);
  const business = useStore(s => s.business);

  // Only show roles relevant to this business type
  const GAP_ROLES = venueRoles(business.type).map(r => ({
    value: r,
    label: ROLE_HE[r],
    icon: ROLE_ICON[r],
  }));

  const handleGap = (role: Role) => {
    const jobId = reportGap(role);
    onClose();
    addToast('g', `מחפשים ${ROLE_HE[role]} — חזרו עכשיו לתוצאות`);
    router.push(`/hiring/jobs/${jobId}`);
  };

  if (!open) return null;

  return (
    <div className="scrim open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>מי עזב/ה?</h3>
          <button className="modal-ico" onClick={onClose} aria-label="סגור">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-sub">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          בחרו תפקיד — נמצא את ההתאמה הטובה ביותר מיד.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {GAP_ROLES.map(r => (
            <button key={r.value} className="gap-role-btn" onClick={() => handleGap(r.value)}>
              <svg viewBox="0 0 24 24"><polyline points="13 17 18 12 13 7"/><path d="M6 12h12"/></svg>
              <span>{r.icon} {r.label}</span>
            </button>
          ))}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
