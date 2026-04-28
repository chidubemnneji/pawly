import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = schema.parse(await req.json());

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: user.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        authSecret: data.keys.auth,
      },
      update: {
        userId: user.id,
        p256dh: data.keys.p256dh,
        authSecret: data.keys.auth,
      },
    });
    return NextResponse.json({ id: sub.id });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { endpoint } = z.object({ endpoint: z.string() }).parse(await req.json());
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
