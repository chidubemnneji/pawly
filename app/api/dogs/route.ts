import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const dogs = await prisma.dog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ dogs });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
