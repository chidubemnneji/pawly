import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { runChat } from '@/lib/ai';

const chatSchema = z.object({
  dogId: z.string(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { dogId, message } = chatSchema.parse(body);

    const dog = await prisma.dog.findFirst({ where: { id: dogId, userId: user.id } });
    if (!dog) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // Pull last 10 messages for context
    const history = await prisma.chatMessage.findMany({
      where: { dogId: dog.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true },
    });
    const orderedHistory = history
      .reverse()
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content }));

    // Persist user message
    await prisma.chatMessage.create({
      data: { dogId: dog.id, role: 'USER', content: message },
    });

    const reply = await runChat(dog, message, orderedHistory);

    const assistantMsg = await prisma.chatMessage.create({
      data: {
        dogId: dog.id,
        role: 'ASSISTANT',
        content: reply.text,
        severity: reply.severity,
      },
    });

    return NextResponse.json({
      assistantMessageId: assistantMsg.id,
      text: reply.text,
      severity: reply.severity,
      followUps: reply.followUps,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error('[/api/chat] failed:', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
