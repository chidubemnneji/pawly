import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { sendPush, pushReady } from '@/lib/push';

/**
 * Sends a test notification to all of the current user's subscriptions.
 * Use this from the "Enable reminders" UI to confirm push is working.
 */
export async function POST() {
  try {
    if (!pushReady) {
      return NextResponse.json({ error: 'push_not_configured' }, { status: 501 });
    }
    const user = await requireUser();
    const subs = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
    if (subs.length === 0) {
      return NextResponse.json({ error: 'no_subscriptions' }, { status: 400 });
    }

    const results = await Promise.all(
      subs.map((s) =>
        sendPush(s, {
          title: 'Pawly is set up ✓',
          body: 'You\'ll get reminders here when something needs your attention.',
          url: '/today',
          tag: 'pawly-test',
        }).then((r) => ({ id: s.id, ...r })),
      ),
    );

    // Clean up gone subscriptions
    const goneIds = results.filter((r) => r.gone).map((r) => r.id);
    if (goneIds.length) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: goneIds } } });
    }

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ sent, removedExpired: goneIds.length });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
