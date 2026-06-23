'use client';
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
  jobs: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  pool: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  schedule: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  analytics: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

export default function BottomNav({
  newCount = 0,
  activeJobCount = 0,
}: {
  onPostJob?: () => void;
  newCount?: number;
  activeJobCount?: number;
}) {
  const path = usePathname() ?? '';
  const router = useRouter();

  const items: MenuBarItem[] = [
    { icon: ICONS.home, label: `בית${newCount > 0 ? ` · ${newCount} חדשים` : ''}`, onClick: () => router.push('/'), active: isActive(path, '/') },
    { icon: ICONS.jobs, label: `משרות${activeJobCount > 0 ? ` · ${activeJobCount}` : ''}`, onClick: () => router.push('/jobs'), active: isActive(path, '/jobs') },
    { icon: ICONS.pool, label: 'מאגר', onClick: () => router.push('/pool'), active: isActive(path, '/pool') },
    { icon: ICONS.schedule, label: 'לו״ז', onClick: () => router.push('/schedule'), active: isActive(path, '/schedule') },
    { icon: ICONS.analytics, label: 'אנליטיקה', onClick: () => router.push('/analytics'), active: isActive(path, '/analytics') },
  ];

  // Reuse the existing .bottom-nav fixed/positioning + show-on-mobile rules,
  // but render the animated MenuBar pill centered inside it.
  return (
    <nav
      className="bottom-nav"
      style={{ background: 'transparent', borderTop: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none', justifyContent: 'center', boxShadow: 'none' }}
    >
      <MenuBar items={items} />
    </nav>
  );
}
