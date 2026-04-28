import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const entry = await prisma.diaryEntry.findUnique({ where: { id }, include: { dog: true } });
    if (!entry || entry.dog.userId !== user.id) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    await prisma.diaryEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
