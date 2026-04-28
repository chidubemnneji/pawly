import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Logo } from '@/components/logo';
import { DogSwitcher } from '@/components/app/dog-switcher';
import { SideNav, BottomNav } from '@/components/app/nav';

// These routes are per-user and hit Prisma — never statically pre-render them.
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const dogs = await prisma.dog.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, breed: true, photoUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  if (dogs.length === 0) redirect('/onboarding');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (md+) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-ink/[0.07] bg-cream/60 sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-ink/[0.07]">
          <Link href="/today" aria-label="Pawly home"><Logo /></Link>
        </div>
        <div className="pt-4">
          <Suspense>
            <DogSwitcher dogs={dogs} />
          </Suspense>
          <Suspense>
            <SideNav />
          </Suspense>
        </div>
        <div className="mt-auto px-5 py-4 border-t border-ink/[0.07] text-[12px] text-ink-faint">
          {user.email}
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 bg-cream/85 backdrop-blur border-b border-ink/[0.07] px-5 h-14 flex items-center">
          <Link href="/today" aria-label="Pawly home"><Logo /></Link>
        </div>
        {children}
      </main>

      <Suspense>
        <BottomNav />
      </Suspense>
    </div>
  );
}
