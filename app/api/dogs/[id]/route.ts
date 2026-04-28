import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  breed: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  sex: z.enum(['M', 'F']).nullable().optional(),
  neutered: z.boolean().nullable().optional(),
  weight: z.number().nullable().optional(),
  weightUnit: z.enum(['KG', 'LB']).optional(),
  conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  food: z.string().nullable().optional(),
  feedingTimes: z.array(z.string()).optional(),
  exerciseMins: z.number().int().optional(),
  walkStyle: z.enum(['ON_LEAD', 'OFF_LEAD', 'MIXED']).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  social: z.number().int().min(1).max(5).optional(),
  vetName: z.string().nullable().optional(),
  vetClinic: z.string().nullable().optional(),
  vetPhone: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const owned = await prisma.dog.findFirst({ where: { id, userId: user.id } });
    if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const dog = await prisma.dog.update({
      where: { id },
      data: {
        ...data,
        dob: data.dob === undefined ? undefined : data.dob ? new Date(data.dob) : null,
      },
    });
    return NextResponse.json({ dog });
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
    const owned = await prisma.dog.findFirst({ where: { id, userId: user.id } });
    if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    await prisma.dog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
