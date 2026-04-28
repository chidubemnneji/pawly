'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon } from '@/components/icons';

type DogLite = {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
};

export function DogSwitcher({ dogs }: { dogs: DogLite[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const activeDogId = search?.get('dog') ?? dogs[0]?.id ?? '';
  const active = dogs.find((d) => d.id === activeDogId) ?? dogs[0];

  const switchTo = (id: string) => {
    const params = new URLSearchParams(search?.toString());
    params.set('dog', id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="px-4">
      <div className="flex items-center gap-2 px-2 py-2.5 rounded-xl bg-white border border-ink/[0.06]">
        <div className="w-9 h-9 rounded-full bg-biscuit-soft flex items-center justify-center font-display font-semibold text-moss-deep">
          {active?.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight truncate">{active?.name ?? '—'}</p>
          <p className="text-[12px] text-ink-faint truncate">{active?.breed ?? 'Mixed breed'}</p>
        </div>
        {dogs.length > 1 && (
          <select
            value={active?.id}
            onChange={(e) => switchTo(e.target.value)}
            className="bg-transparent text-sm text-ink-soft outline-none"
          >
            {dogs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>
      <Link
        href="/onboarding"
        className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ink-soft hover:bg-ink/5"
      >
        <PlusIcon size={16} /> Add another dog
      </Link>
    </div>
  );
}
