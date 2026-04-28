import Link from 'next/link';
import type { Dog } from '@prisma/client';
import { ChevronRightIcon } from '@/components/icons';

/**
 * Shows up only when the dog profile has missing-but-useful fields.
 * Quietly disappears once everything is filled in.
 */
export function SetupChecklist({ dog }: { dog: Dog }) {
  const items: { key: string; label: string; href: string; done: boolean }[] = [
    {
      key: 'photo',
      label: `Add a photo of ${dog.name}`,
      href: `/profile?dog=${dog.id}`,
      done: !!dog.photoUrl,
    },
    {
      key: 'weight',
      label: 'Record current weight',
      href: `/weight?dog=${dog.id}`,
      done: !!dog.weight,
    },
    {
      key: 'vet',
      label: 'Add your vet',
      href: `/profile?dog=${dog.id}`,
      done: !!dog.vetClinic,
    },
    {
      key: 'food',
      label: 'Note current food',
      href: `/profile?dog=${dog.id}`,
      done: !!dog.food,
    },
    {
      key: 'breed',
      label: 'Confirm breed',
      href: `/profile?dog=${dog.id}`,
      done: !!dog.breed,
    },
  ];

  const remaining = items.filter((i) => !i.done);
  if (remaining.length === 0) return null;

  const total = items.length;
  const completed = total - remaining.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="bg-white border border-ink/[0.06] rounded-2xl p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">Finish setup</p>
          <p className="font-display text-lg font-semibold leading-tight">
            {remaining.length} {remaining.length === 1 ? 'thing' : 'things'} to add
          </p>
        </div>
        <p className="text-sm text-ink-soft">{completed}/{total}</p>
      </div>
      <div className="h-1.5 rounded-full bg-ink/[0.07] overflow-hidden mb-3">
        <div className="h-full bg-moss" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1">
        {remaining.slice(0, 3).map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              className="flex items-center justify-between py-2 hover:bg-ink/[0.02] -mx-2 px-2 rounded-lg transition-colors"
            >
              <span className="text-[14px]">{it.label}</span>
              <ChevronRightIcon size={16} className="text-ink-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
