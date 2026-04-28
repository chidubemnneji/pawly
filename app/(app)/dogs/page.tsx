import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { ageFromDOB, lifeStage } from '@/lib/utils';
import { PlusIcon } from '@/components/icons';

export default async function DogsIndexPage() {
  const user = await requireUser();
  const dogs = await prisma.dog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-[13px] uppercase tracking-wider text-ink-faint font-semibold">Your dogs</p>
        <h1 className="font-display text-4xl tracking-tight font-semibold mt-1 leading-[1.05]">
          {dogs.length} {dogs.length === 1 ? 'dog' : 'dogs'}
        </h1>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        {dogs.map((d) => (
          <Link
            key={d.id}
            href={`/today?dog=${d.id}`}
            className="group bg-white border border-ink/[0.06] rounded-2xl p-4 shadow-soft hover:shadow-lift transition-shadow flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-biscuit-soft flex items-center justify-center font-display text-2xl font-semibold text-moss-deep overflow-hidden shrink-0">
              {d.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
              ) : (
                d.name[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl font-semibold tracking-tight group-hover:text-moss transition-colors">
                {d.name}
              </p>
              <p className="text-[13px] text-ink-soft">
                {d.breed ?? 'Mixed breed'}
                {d.dob ? ` · ${ageFromDOB(d.dob)} ${lifeStage(d.dob) !== 'unknown' ? lifeStage(d.dob) : ''}` : ''}
              </p>
            </div>
          </Link>
        ))}

        <Link
          href="/onboarding"
          className="border-2 border-dashed border-ink/15 rounded-2xl p-4 flex items-center gap-4 hover:border-moss hover:bg-moss-soft/30 transition-colors"
        >
          <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center text-ink-soft shrink-0">
            <PlusIcon size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">Add another dog</p>
            <p className="text-[13px] text-ink-soft">Run through onboarding for a new profile</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
