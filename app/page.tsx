import { LandingNav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { BreedsPreview } from '@/components/landing/breeds-preview';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function Page() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <BreedsPreview />
      <CTA />
      <Footer />
    </main>
  );
}
