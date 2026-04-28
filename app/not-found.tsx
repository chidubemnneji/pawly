import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <Logo size={40} />
      <h1 className="font-display text-5xl tracking-tight font-semibold mt-10">Lost the trail.</h1>
      <p className="text-ink-soft mt-3 max-w-md">
        The page you&rsquo;re looking for has wandered off. Let&rsquo;s get you home.
      </p>
      <Link href="/" className="mt-8">
        <Button>Back to Pawly</Button>
      </Link>
    </main>
  );
}
