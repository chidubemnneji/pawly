import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const createSchema = z.object({
  dogId: z.string(),
  weight: z.number().positive(),
  weightUnit: z.enum(['KG', 'LB']).default('KG'),
  notedAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = createSchema.parse(body);

    const dog = await prisma.dog.findFirst({ where: { id: data.dogId, userId: user.id } });
    if (!dog) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const log = await prisma.weightLog.create({
      data: {
        dogId: dog.id,
        weight: data.weight,
        weightUnit: data.weightUnit,
        notedAt: data.notedAt ? new Date(data.notedAt) : new Date(),
        notes: data.notes ?? null,
      },
    });

    // Also update the canonical dog.weight to the most recent value
    await prisma.dog.update({
      where: { id: dog.id },
      data: { weight: data.weight, weightUnit: data.weightUnit },
    });

    return NextResponse.json({ log });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
