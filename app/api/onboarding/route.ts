import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { defaultHealthRecords } from '@/lib/tasks';
import { addDays } from '@/lib/utils';

const onboardingSchema = z.object({
  name: z.string().trim().min(1),
  photoUrl: z.string().max(800_000).optional().nullable(), // ~600KB data-url cap
  breed: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  sex: z.enum(['M', 'F']).nullable().optional(),
  neutered: z.boolean().nullable().optional(),
  weight: z.number().nullable().optional(),
  weightUnit: z.enum(['KG', 'LB']).default('KG'),
  conditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  food: z.string().optional().nullable(),
  feedingTimes: z.array(z.string()).default(['08:00', '18:00']),
  exerciseMins: z.number().int().default(60),
  walkStyle: z.enum(['ON_LEAD', 'OFF_LEAD', 'MIXED']).default('MIXED'),
  energy: z.number().int().min(1).max(5).default(3),
  confidence: z.number().int().min(1).max(5).default(3),
  social: z.number().int().min(1).max(5).default(3),
  /** Map of healthRecord name → ISO date string for "last given". Empty/missing → unknown. */
  healthDates: z.record(z.string(), z.string()).default({}),
  vetName: z.string().optional().nullable(),
  vetClinic: z.string().optional().nullable(),
  vetPhone: z.string().optional().nullable(),
  livesWithDogs: z.number().int().min(0).default(0),
  livesWithKids: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const json = await req.json();
    const data = onboardingSchema.parse(json);

    const dog = await prisma.dog.create({
      data: {
        userId: user.id,
        name: data.name,
        photoUrl: data.photoUrl ?? null,
        breed: data.breed ?? null,
        dob: data.dob ? new Date(data.dob) : null,
        sex: data.sex ?? null,
        neutered: data.neutered ?? null,
        weight: data.weight ?? null,
        weightUnit: data.weightUnit,
        conditions: data.conditions,
        allergies: data.allergies,
        food: data.food ?? null,
        feedingTimes: data.feedingTimes,
        exerciseMins: data.exerciseMins,
        walkStyle: data.walkStyle,
        energy: data.energy,
        confidence: data.confidence,
        social: data.social,
        vetName: data.vetName ?? null,
        vetClinic: data.vetClinic ?? null,
        vetPhone: data.vetPhone ?? null,
        livesWithDogs: data.livesWithDogs,
        livesWithKids: data.livesWithKids,
      },
    });

    // Seed health records. If the user provided a "last given" date in onboarding,
    // compute next-due from that. Otherwise leave lastGiven null and assume the
    // record is fresh (next-due = today + interval) so the UI shows "Up to date"
    // until the user confirms in the Health tab.
    const today = new Date();
    await prisma.healthRecord.createMany({
      data: defaultHealthRecords().map((r) => {
        const lastGivenStr = data.healthDates[r.name];
        const lastGiven = lastGivenStr ? new Date(lastGivenStr) : null;
        const nextDue = lastGiven
          ? addDays(lastGiven, r.intervalDays)
          : addDays(today, r.intervalDays);
        return {
          dogId: dog.id,
          type: r.type,
          name: r.name,
          frequency: r.frequency,
          intervalDays: r.intervalDays,
          lastGiven,
          nextDue,
        };
      }),
    });

    return NextResponse.json({ dogId: dog.id });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    console.error('[/api/onboarding] failed:', e);
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
