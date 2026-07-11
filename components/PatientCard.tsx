'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Patient, Lead } from '@/lib/types';
import { addToast } from '@/components/Toasts';

interface Props {
  patient: Patient;
  lead: Lead;
  /** Advanced plan: the app can send the reactivation message itself (approve-before-send). */
  canAutoSend: boolean;
  sent?: boolean;
  onSendLead?: () => void;
}

export default function PatientCard({ patient, lead, canAutoSend, sent, onSendLead }: Props) {
  const isUpToDate = lead.headline === 'הכל מעודכן';
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.classList.add('in'), 30);
    return () => clearTimeout(t);
  }, []);

  function handleCopy() {
    navigator.clipboard?.writeText(lead.draftMessage).catch(() => {});
    setCopied(true);
    addToast('a', 'ההודעה הועתקה');
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="cand" ref={ref}>
      <Link href={`/patients/${patient.id}`} className="cand-top" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="av" style={{ background: patient.avatarColor }}>{patient.initials}</div>
        <div className="cand-info">
          <div className="cand-name">{patient.name}</div>
          <div className="cand-facts">
            <span>{lead.headline}</span>
            {!isUpToDate && <span className="cdot" />}
            {!isUpToDate && <span>{lead.reason}</span>}
          </div>
        </div>
        {!isUpToDate && <span className="score" style={{ background: 'var(--cedar-soft)', color: 'var(--cedar)' }}>ליד</span>}
      </Link>

      <div className="cand-actions">
        {isUpToDate ? (
          <span className="inv-badge">
            <svg viewBox="0 0 24 24" style={{ fill: 'currentColor', stroke: 'none' }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
            עדכני
          </span>
        ) : sent ? (
          <span className="inv-badge">נשלח ✓</span>
        ) : canAutoSend ? (
          <button className="btn-invite" onClick={onSendLead}>אשר ושלח</button>
        ) : (
          <button className="btn-ghost" onClick={handleCopy}>{copied ? 'הועתק ✓' : 'העתק הודעה'}</button>
        )}
      </div>
    </article>
  );
}
