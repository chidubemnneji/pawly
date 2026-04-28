import Link from 'next/link';
import { Logo } from '../logo';

export function Footer() {
  return (
    <footer className="border-t border-ink/[0.07] bg-cream-deep/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <Logo />
            <p className="text-sm text-ink-soft mt-4 max-w-xs leading-relaxed">
              The calm, caring AI app for dog parents. Free for life. Built with respect for your dog and your data.
            </p>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold mb-3">Product</p>
            <ul className="space-y-2 text-[14px] text-ink-soft">
              <li><Link href="/onboarding" className="hover:text-ink">Get started</Link></li>
              <li><Link href="#features" className="hover:text-ink">Features</Link></li>
              <li><Link href="/breeds" className="hover:text-ink">Breeds</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold mb-3">Company</p>
            <ul className="space-y-2 text-[14px] text-ink-soft">
              <li><Link href="/about" className="hover:text-ink">About</Link></li>
              <li><Link href="/blog" className="hover:text-ink">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold mb-3">Legal</p>
            <ul className="space-y-2 text-[14px] text-ink-soft">
              <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-ink">Terms</Link></li>
              <li><Link href="/cookies" className="hover:text-ink">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-ink/[0.07] flex flex-wrap items-center justify-between gap-4 text-[13px] text-ink-faint">
          <p>© {new Date().getFullYear()} Pawly. Pawly is not a substitute for veterinary advice.</p>
          <p>Made with care for dogs everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
