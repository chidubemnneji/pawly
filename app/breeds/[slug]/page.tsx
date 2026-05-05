import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BREEDS, findBreedBySlug } from '@/lib/breeds';
import { LandingNav } from '@/components/landing/nav';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/icons';

export function generateStaticParams() {
  return BREEDS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const breed = findBreedBySlug(slug);
  if (!breed) return { title: 'Breed not found' };
  return {
    title: `${breed.name} care guide`,
    description: `${breed.name}: ${breed.weightKg[0]}–${breed.weightKg[1]} kg · ${breed.exercise} · ${breed.traits}.`,
  };
}

export default async function BreedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const breed = findBreedBySlug(slug);
  if (!breed) return notFound();

  return (
    <main>
      <LandingNav />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-[13px] font-medium tracking-wider uppercase text-moss mb-3">{breed.group} group</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-tight font-semibold leading-[1.05]">
          {breed.name}
        </h1>
        <p className="text-ink-soft mt-4 text-lg max-w-2xl leading-relaxed">
          A care guide for {breed.name} owners. Personalised guidance - feeding, exercise, training, health - comes from setting up your dog&rsquo;s profile.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <Stat label="Typical weight" value={`${breed.weightKg[0]}–${breed.weightKg[1]} kg`} />
          <Stat label="Daily exercise" value={breed.exercise} />
          <Stat label="Common traits" value={breed.traits} />
          <Stat label="Watch for" value={breed.watchFor} />
        </div>

        <div className="mt-10 bg-moss text-cream rounded-3xl p-8 md:p-10">
          <h2 className="font-display text-2xl tracking-tight font-semibold">
            Get personalised care for your {breed.name}
          </h2>
          <p className="text-cream/85 mt-2 max-w-md">
            Pawly tailors feeding, exercise targets and reminders to your dog specifically - not a generic breed average.
          </p>
          <div className="mt-6">
            <Link href="/onboarding">
              <Button className="bg-cream !text-ink hover:bg-white">
                Build my dog&rsquo;s profile <ArrowRightIcon size={18} />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <Link href="/breeds" className="text-moss font-medium hover:underline">
            ← All breeds
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-ink/[0.05]">
      <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">{label}</p>
      <p className="text-[15px] mt-1 leading-snug">{value}</p>
    </div>
  );
}
