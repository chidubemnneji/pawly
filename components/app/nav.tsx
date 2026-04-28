'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { HomeIcon, UserIcon, ShieldIcon, ChatIcon } from '@/components/icons';

const ITEMS = [
  { href: '/today', label: 'Today', Icon: HomeIcon },
  { href: '/profile', label: 'Profile', Icon: UserIcon },
  { href: '/health', label: 'Health', Icon: ShieldIcon },
  { href: '/chat', label: 'Pawly', Icon: ChatIcon },
];

export function SideNav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const dog = search?.get('dog');
  const qs = dog ? `?dog=${dog}` : '';

  return (
    <nav className="px-3 mt-4 space-y-1">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={`${href}${qs}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors ${
              active ? 'bg-moss-soft text-moss-deep font-medium' : 'text-ink-soft hover:bg-ink/5'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const dog = search?.get('dog');
  const qs = dog ? `?dog=${dog}` : '';
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-cream/90 backdrop-blur border-t border-ink/[0.07] md:hidden">
      <div className="grid grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={`${href}${qs}`}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                active ? 'text-moss-deep' : 'text-ink-soft'
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
