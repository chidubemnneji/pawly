import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { addDays } from '@/lib/utils';

const patchSchema = z.object({
  lastGiven: z.string().optional(),
  nextDue: z.string().optional(),
  product: z.string().nullable().optional(),
  doseMg: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json();
    const data = patchSchema.parse(body);

    const record = await prisma.healthRecord.findUnique({ where: { id }, include: { dog: true } });
    if (!record || record.dog.userId !== user.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (data.lastGiven) {
      const last = new Date(data.lastGiven);
      updates.lastGiven = last;
      if (record.intervalDays && !data.nextDue) {
        updates.nextDue = addDays(last, record.intervalDays);
      }
    }
    if (data.nextDue) updates.nextDue = new Date(data.nextDue);
    if (data.product !== undefined) updates.product = data.product;
    if (data.doseMg !== undefined) updates.doseMg = data.doseMg;
    if (data.notes !== undefined) updates.notes = data.notes;

    const updated = await prisma.healthRecord.update({ where: { id }, data: updates });
    return NextResponse.json({ record: updated });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const record = await prisma.healthRecord.findUnique({ where: { id }, include: { dog: true } });
    if (!record || record.dog.userId !== user.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    await prisma.healthRecord.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
