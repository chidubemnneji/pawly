import Link from 'next/link';
import { Button } from '../ui/button';
import { CheckIcon } from '../icons';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft sunrise gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[640px] bg-gradient-to-b from-biscuit-soft via-cream to-cream" />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-terracotta/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-32 w-[420px] h-[420px] rounded-full bg-moss/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-[13px] font-medium px-3 py-1.5 rounded-full bg-moss-soft text-moss-deep mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-moss"></span>
              Free for life · No ads · No data sold
            </p>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight font-semibold text-ink">
              The calm, caring app that <span className="text-moss">grows with your dog.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-soft max-w-xl leading-relaxed">
              Personalised feeding, walks, training and health reminders — built around <em>your</em> dog, not just any dog. With breed-aware AI you can ask anything, anytime.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/onboarding">
                <Button size="lg">Build your dog&rsquo;s profile</Button>
              </Link>
              <Link href="#how">
                <Button size="lg" variant="ghost">See how it works</Button>
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-ink-soft">
              {['No credit card', 'Works on any phone', '40+ breeds covered'].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <CheckIcon size={16} className="text-moss" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* phone-style preview */}
          <div className="relative md:justify-self-end animate-pop-in">
            <div className="relative w-[320px] md:w-[360px] aspect-[9/19] rounded-[44px] bg-ink p-3 shadow-lift mx-auto">
              <div className="w-full h-full rounded-[34px] bg-cream overflow-hidden relative">
                {/* notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-ink rounded-full"></div>
                <div className="pt-10 px-5">
                  <p className="text-xs text-ink-faint font-medium">Tuesday morning</p>
                  <h3 className="font-display text-2xl font-semibold mt-1">Bella&rsquo;s day</h3>
                  <p className="text-sm text-ink-soft mt-0.5">Cockapoo · 3 yr · 11 kg</p>

                  <div className="mt-5 space-y-2.5">
                    {[
                      { i: '🥣', t: 'Breakfast', s: '240g · Eukanuba Adult', time: '8:00' },
                      { i: '🚶', t: '60-min walk', s: 'Off-lead OK', time: '12:30' },
                      { i: '💛', t: 'Wellness check', s: 'Any limping or off food?', time: '' },
                      { i: '✨', t: '5-min training', s: 'Loose-lead practice', time: '' },
                    ].map((x) => (
                      <div key={x.t} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-soft">
                        <div className="w-9 h-9 rounded-full bg-biscuit-soft flex items-center justify-center text-base">{x.i}</div>
                        <div className="flex-1">
                          <p className="font-medium text-[14px] leading-tight">{x.t}</p>
                          <p className="text-[12px] text-ink-soft">{x.s}</p>
                        </div>
                        {x.time && <span className="text-[11px] text-ink-faint font-medium">{x.time}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lift p-3 w-56 hidden md:block animate-slide-r">
              <p className="text-[11px] uppercase tracking-wide text-moss font-semibold mb-1">Pawly says</p>
              <p className="text-[13px] leading-snug">Bella&rsquo;s 11 kg is right in the typical Cockapoo range. Healthy weight!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
