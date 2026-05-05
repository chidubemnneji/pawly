import Link from 'next/link';
import { Logo } from '../logo';
import { Button } from '../ui/button';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-cream/85 border-b border-ink/[0.06]">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Pawly home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[15px] text-ink-soft">
          <Link href="#how" className="hover:text-ink transition">How it works</Link>
          <Link href="#features" className="hover:text-ink transition">Features</Link>
          <Link href="/breeds" className="hover:text-ink transition">Breeds</Link>
          <Link href="#faq" className="hover:text-ink transition">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/onboarding" className="hidden sm:inline-flex">
            <Button size="sm">Get started - free</Button>
          </Link>
          <Link href="/onboarding" className="sm:hidden">
            <Button size="sm">Start</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
