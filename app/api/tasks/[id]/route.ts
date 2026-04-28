import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { addDays } from '@/lib/utils';

const patchSchema = z.object({
  status: z.enum(['DONE', 'SNOOZED', 'SKIPPED', 'OPEN']).optional(),
  snoozeMinutes: z.number().int().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json();
    const data = patchSchema.parse(body);

    const task = await prisma.task.findUnique({ where: { id }, include: { dog: true } });
    if (!task || task.dog.userId !== user.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (data.status === 'DONE') {
      updates.status = 'DONE';
      updates.completedAt = new Date();
    } else if (data.status === 'SNOOZED' && data.snoozeMinutes) {
      updates.status = 'SNOOZED';
      updates.snoozedUntil = new Date(Date.now() + data.snoozeMinutes * 60 * 1000);
    } else if (data.status === 'SKIPPED') {
      updates.status = 'SKIPPED';
    } else if (data.status === 'OPEN') {
      updates.status = 'OPEN';
      updates.completedAt = null;
      updates.snoozedUntil = null;
    }

    const updated = await prisma.task.update({ where: { id }, data: updates });
    return NextResponse.json({ task: updated });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
