'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';
import Toasts from '@/components/Toasts';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { useStore.persist.rehydrate(); setHydrated(true); }, []);
  useEffect(() => {
    if (hydrated && !store.isLoggedIn) router.replace('/login');
  }, [hydrated, store.isLoggedIn, router]);

  if (!hydrated || !store.isLoggedIn) return null;

  return (
    <div className="app">
      <Header operatorInitial={store.clinic.operatorName[0] ?? 'ר'} />
      {children}
      <Toasts />
    </div>
  );
}
