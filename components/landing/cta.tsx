import Link from 'next/link';
import { Button } from '../ui/button';

export function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="relative overflow-hidden rounded-3xl bg-moss text-cream p-10 md:p-14 text-center">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terracotta/30 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-biscuit/30 blur-3xl"></div>
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl tracking-tight font-semibold leading-[1.05] mb-4">
              Your dog deserves a calmer, more confident you.
            </h2>
            <p className="text-cream/85 text-lg max-w-xl mx-auto mb-8">
              Pawly is free, will always have a generous free tier, and never sells your data. Set up your dog&rsquo;s profile in two minutes.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="bg-cream !text-ink hover:bg-white">Start with my dog</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
