import Link from 'next/link';
import { BREEDS } from '@/lib/breeds';
import { ArrowRightIcon } from '../icons';

const FEATURED = [
  'Cockapoo', 'Labrador Retriever', 'Border Collie', 'French Bulldog',
  'Cavapoo', 'Dachshund', 'Golden Retriever', 'German Shepherd',
];

export function BreedsPreview() {
  const featured = BREEDS.filter((b) => FEATURED.includes(b.name));

  return (
    <section id="breeds" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium tracking-wider uppercase text-moss mb-3">Built for every dog</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight font-semibold leading-[1.05]">
              Breed-aware care, from puppy to senior.
            </h2>
          </div>
          <Link href="/breeds" className="inline-flex items-center gap-1.5 text-moss font-medium hover:gap-2.5 transition-all">
            Browse all {BREEDS.length} breeds <ArrowRightIcon size={18} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((b) => (
            <Link
              key={b.slug}
              href={`/breeds/${b.slug}`}
              className="group bg-white rounded-2xl p-5 border border-ink/[0.05] hover:shadow-soft transition-shadow"
            >
              <p className="text-[12px] font-medium uppercase tracking-wider text-ink-faint">{b.group}</p>
              <h3 className="font-display text-xl font-semibold tracking-tight mt-1 group-hover:text-moss transition-colors">
                {b.name}
              </h3>
              <p className="text-[13px] text-ink-soft mt-2 leading-snug">
                {b.weightKg[0]}–{b.weightKg[1]} kg · {b.exercise}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
