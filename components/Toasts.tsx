'use client';
import { useEffect, useRef, useState } from 'react';

export type ToastType = 'g' | 'a' | 'r';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let _add: ((type: ToastType, message: string) => void) | null = null;

export function addToast(type: ToastType, message: string) {
  _add?.(type, message);
}

export default function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    _add = (type, message) => {
      const id = ++counterRef.current;
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400);
    };
    return () => { _add = null; };
  }, []);

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
  );
  const BookmarkIcon = () => (
    <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
  );
  const AlertIcon = () => (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );

  const icon = (type: ToastType) => {
    if (type === 'g') return <CheckIcon />;
    if (type === 'a') return <BookmarkIcon />;
    return <AlertIcon />;
  };

  return (
    <div className="toasts">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className={`t-dot ${t.type}`}>{icon(t.type)}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
