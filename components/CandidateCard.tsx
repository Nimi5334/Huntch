'use client';
import { useEffect, useRef } from 'react';
import type { RankedCandidate } from '@/lib/types';

const BADGE_LABELS: Record<string, string> = {
  ex: 'התאמה מצוינת',
  gd: 'התאמה טובה',
  md: 'התאמה בינונית',
};

interface Props {
  candidate: RankedCandidate;
  isInvited: boolean;
  isSaved: boolean;
  onInvite: () => void;
  onSave: () => void;
  onDismiss: () => void;
  animate?: boolean;
  flash?: boolean;
}

export default function CandidateCard({
  candidate: c,
  isInvited,
  isSaved,
  onInvite,
  onSave,
  onDismiss,
  animate = true,
  flash = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!animate) {
      ref.current?.classList.add('in');
      return;
    }
    const t = setTimeout(() => ref.current?.classList.add('in'), 60);
    return () => clearTimeout(t);
  }, [animate]);

  useEffect(() => {
    if (flash && ref.current) {
      const t = setTimeout(() => ref.current?.classList.add('arrival'), 60);
      return () => clearTimeout(t);
    }
  }, [flash]);

  const facts = c.reasonFacts;

  return (
    <article
      ref={ref}
      className={`cand${isInvited ? ' invited' : ''}`}
    >
      <div className="cand-top">
        <div className="av" style={{ background: c.avatarColor }}>
          {c.initials}
        </div>

        <div className="cand-info">
          <div className="cand-name">{c.name}</div>
          <div className="cand-facts">
            {facts.map((f, i) => (
              <span key={i}>
                {i > 0 && <span className="cdot" />}
                {f}
              </span>
            ))}
          </div>
        </div>

        {!isInvited && <span className="score">{c.score}%</span>}
      </div>

      {isInvited ? (
        <div className="cand-actions">
          <span className="inv-badge">
            <svg viewBox="0 0 24 24" style={{ fill: 'currentColor', stroke: 'none' }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
            הוזמן/ה לראיון
          </span>
        </div>
      ) : (
        <div className="cand-actions">
          <span className={`badge ${c.badge}`}>{BADGE_LABELS[c.badge]}</span>
          <button className="btn-invite" onClick={onInvite}>הזמנה</button>
          <button
            className={`ico${isSaved ? ' saved' : ''}`}
            onClick={onSave}
            aria-label="שמור"
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="ico" onClick={onDismiss} aria-label="דחה">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </article>
  );
}
