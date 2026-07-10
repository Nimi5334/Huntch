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
  tasks: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
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
    router.prefetch('/tasks');
    router.prefetch('/automation');
    router.prefetch('/activity');
  }, [router]);

  const items: MenuBarItem[] = [
    { icon: ICONS.home, label: 'בית', onClick: () => router.push('/'), active: isActive(path, '/') },
    { icon: ICONS.tasks, label: 'משימות', onClick: () => router.push('/tasks'), active: isActive(path, '/tasks') },
    { icon: ICONS.auto, label: 'אוטומציה', onClick: () => router.push('/automation'), active: isActive(path, '/automation') },
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
