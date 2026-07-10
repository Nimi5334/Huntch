'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Patient, Lead } from '@/lib/types';

interface Props {
  patient: Patient;
  lead: Lead;
  onSendLead?: () => void;
  sent?: boolean;
}

export default function PatientCard({ patient, lead, onSendLead, sent }: Props) {
  const isUpToDate = lead.headline === 'הכל מעודכן';
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.classList.add('in'), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <article className="cand" ref={ref}>
      <Link href={`/patients/${patient.id}`} className="cand-top" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="av" style={{ background: patient.avatarColor }}>{patient.initials}</div>
        <div className="cand-info">
          <div className="cand-name">{patient.name}</div>
          <div className="cand-facts">
            <span>{lead.headline}</span>
            <span className="cdot" />
            <span>{lead.reason}</span>
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
        ) : (
          <>
            <button className="btn-invite" onClick={onSendLead}>אשר ושלח</button>
            <Link href={`/patients/${patient.id}`} className="ico" aria-label="פרופיל">
              <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
