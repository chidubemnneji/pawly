import Link from 'next/link';
import type { Metadata } from 'next';
import { BREEDS, BREED_GROUPS, groupBreeds } from '@/lib/breeds';
import { LandingNav } from '@/components/landing/nav';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'All breeds - Pawly',
  description: `Breed-aware care for ${BREEDS.length}+ dog breeds. Find weight ranges, exercise needs, common traits and what to watch for.`,
};

export default function BreedsIndexPage() {
  const grouped = groupBreeds(BREEDS);

  return (
    <main>
      <LandingNav />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-[13px] font-medium tracking-wider uppercase text-moss mb-3">Breeds</p>
        <h1 className="font-display text-5xl tracking-tight font-semibold leading-[1.05]">
          Care notes for {BREEDS.length}+ breeds.
        </h1>
        <p className="text-ink-soft mt-4 text-lg max-w-2xl">
          Find your dog&rsquo;s typical weight, exercise needs, behaviour and health watch-points - and start a personalised plan.
        </p>

        <div className="mt-12 space-y-10">
          {BREED_GROUPS.map((group) => {
            const list = grouped[group];
            if (!list?.length) return null;
            return (
              <div key={group}>
                <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">{group}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/breeds/${b.slug}`}
                      className="group bg-white rounded-2xl p-5 border border-ink/[0.05] hover:shadow-soft transition-shadow"
                    >
                      <h3 className="font-display text-lg font-semibold tracking-tight group-hover:text-moss transition-colors">{b.name}</h3>
                      <p className="text-[13px] text-ink-soft mt-1">{b.weightKg[0]}–{b.weightKg[1]} kg · {b.exercise}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </main>
  );
}
