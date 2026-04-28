import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const createSchema = z.object({
  dogId: z.string(),
  photoUrl: z.string().max(800_000),
  caption: z.string().max(280).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = createSchema.parse(body);

    const dog = await prisma.dog.findFirst({ where: { id: data.dogId, userId: user.id } });
    if (!dog) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const entry = await prisma.diaryEntry.create({
      data: {
        dogId: dog.id,
        photoUrl: data.photoUrl,
        caption: data.caption ?? null,
      },
    });
    return NextResponse.json({ entry });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
