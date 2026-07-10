'use client';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MenuBar, type MenuBarItem } from '@/components/ui/bottom-menu';

function isActive(path: string, href: string) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
}

const ICONS = {
  home: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  today: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  auto: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  activity: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
};

export default function BottomNav() {
  const path = usePathname() ?? '';
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/today');
    router.prefetch('/auto-reply');
    router.prefetch('/activity');
  }, [router]);

  const items: MenuBarItem[] = [
    { icon: ICONS.home, label: 'בית', onClick: () => router.push('/'), active: isActive(path, '/') },
    { icon: ICONS.today, label: 'מה חדש', onClick: () => router.push('/today'), active: isActive(path, '/today') },
    { icon: ICONS.auto, label: 'מענה אוטומטי', onClick: () => router.push('/auto-reply'), active: isActive(path, '/auto-reply') },
    { icon: ICONS.activity, label: 'פעילות', onClick: () => router.push('/activity'), active: isActive(path, '/activity') },
  ];

  return (
    <nav
      className="bottom-nav"
      style={{
        background: 'transparent',
        borderTop: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        justifyContent: 'center',
        boxShadow: 'none',
      }}
    >
      <MenuBar items={items} />
    </nav>
  );
}
