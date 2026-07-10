'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Patient, TreatmentRecord } from '@/lib/types';
import { CATEGORY_HE, monthsSince, daysSince } from '@/lib/clinical';

interface Props {
  patient: Patient;
}

function latestCompleted(patient: Patient): TreatmentRecord | undefined {
  return patient.treatments
    .filter(t => t.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function relativeWhen(dateStr: string): string {
  const now = new Date().toISOString().slice(0, 10);
  const days = daysSince(dateStr, now);
  if (days <= 0) return 'היום';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return w <= 1 ? 'לפני שבוע' : `לפני ${w} שבועות`;
  }
  const months = monthsSince(dateStr, now);
  if (months < 1) return 'החודש';
  if (months === 1) return 'לפני חודש';
  if (months < 12) return `לפני ${months} חודשים`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'לפני שנה' : `לפני ${years} שנים`;
}

export default function PatientCard({ patient }: Props) {
  const ref = useRef<HTMLElement>(null);
  const last = latestCompleted(patient);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.classList.add('in'), 30);
    return () => clearTimeout(t);
  }, []);

  const treatmentLabel = last
    ? `${CATEGORY_HE[last.category] ?? last.name} · ${relativeWhen(last.date)}`
    : 'אין טיפולים רשומים';

  return (
    <article className="cand" ref={ref}>
      <Link href={`/patients/${patient.id}`} className="cand-top" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
        <div className="av" style={{ background: patient.avatarColor }}>{patient.initials}</div>
        <div className="cand-info">
          <div className="cand-name">{patient.name}</div>
          <div className="cand-facts">
            <span>{treatmentLabel}</span>
          </div>
        </div>
        <span className="ico" aria-hidden="true" style={{ pointerEvents: 'none' }}>
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        </span>
      </Link>
    </article>
  );
}
