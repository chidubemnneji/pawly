import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { runChat } from '@/lib/ai';
import { isEnabled } from '@/lib/flags';

const chatSchema = z.object({
  dogId: z.string(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Feature flag gate — ai-chat must be enabled for this user
    const chatEnabled = await isEnabled('ai-chat', userId);
    if (!chatEnabled) {
      return NextResponse.json(
        { error: 'feature_disabled', message: 'AI chat is not available yet.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dogId, message } = chatSchema.parse(body);

    const dog = await db.dog.findFirst({ where: { id: dogId, userId } });
    if (!dog) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const response = await runChat(dog, message, []);
    return NextResponse.json(response);
  } catch (err) {
    console.error('[chat]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
