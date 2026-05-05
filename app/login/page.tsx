import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

const isDemoMode = process.env.PAWLY_DEMO_MODE === 'true';
const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const hasResend = !!process.env.AUTH_RESEND_KEY;

export default function LoginPage() {
  // In demo mode, login isn't needed - just bounce to onboarding/today
  if (isDemoMode || (!hasGoogle && !hasResend)) {
    redirect('/today');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <Link href="/" className="mb-10"><Logo size={40} /></Link>
      <div className="w-full max-w-sm bg-white rounded-3xl border border-ink/[0.06] shadow-soft p-8">
        <h1 className="font-display text-3xl tracking-tight font-semibold text-center">Welcome back</h1>
        <p className="text-ink-soft text-center mt-2 mb-8">Sign in to keep caring for your dog.</p>

        {hasGoogle && (
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/today' });
            }}
          >
            <Button className="w-full" variant="secondary" size="lg">
              Continue with Google
            </Button>
          </form>
        )}

        {hasResend && (
          <form
            action={async (formData) => {
              'use server';
              await signIn('resend', formData);
            }}
            className="mt-3 space-y-2"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-cream border border-ink/10 rounded-full px-5 h-12 outline-none focus:border-moss"
            />
            <Button type="submit" className="w-full" size="lg">
              Email me a magic link
            </Button>
          </form>
        )}

        <p className="text-[12px] text-ink-faint text-center mt-6">
          By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
