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
  hiring: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
    </svg>
  ),
  workforce: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  activity: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
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
    { icon: ICONS.hiring, label: `גיוס${activeJobCount > 0 ? ` · ${activeJobCount}` : ''}`, onClick: () => router.push('/hiring'), active: isActive(path, '/hiring') },
    { icon: ICONS.workforce, label: 'כוח אדם', onClick: () => router.push('/workforce'), active: isActive(path, '/workforce') },
    { icon: ICONS.activity, label: 'פעילות', onClick: () => router.push('/activity'), active: isActive(path, '/activity') },
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
