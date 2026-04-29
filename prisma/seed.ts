/**
 * Seed script — creates a demo user and a sample dog (Bella, a Cockapoo).
 * Run with: pnpm db:seed
 *
 * Safe to run multiple times — it upserts.
 */
import { PrismaClient } from '@prisma/client';
import { addDays } from '../lib/utils';
import { defaultHealthRecords } from '../lib/tasks';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@pawly.local' },
    update: {},
    create: {
      email: 'demo@pawly.local',
      name: 'Demo Owner',
    },
  });

  const existing = await prisma.dog.findFirst({ where: { userId: user.id, name: 'Bella' } });
  if (existing) {
    console.log('✔ Demo dog already exists, skipping');
    return;
  }

  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - 3);

  const dog = await prisma.dog.create({
    data: {
      userId: user.id,
      name: 'Bella',
      breed: 'Cockapoo',
      dob,
      sex: 'F',
      neutered: true,
      weight: 11,
      weightUnit: 'KG',
      conditions: [],
      allergies: [],
      food: 'Eukanuba Adult',
      feedingTimes: ['08:00', '18:00'],
      exerciseMins: 60,
      walkStyle: 'MIXED',
      energy: 4,
      confidence: 4,
      social: 5,
    },
  });

  const today = new Date();
  await prisma.healthRecord.createMany({
    data: defaultHealthRecords().map((r, i) => ({
      dogId: dog.id,
      type: r.type,
      name: r.name,
      frequency: r.frequency,
      intervalDays: r.intervalDays,
      lastGiven: addDays(today, -r.intervalDays + 30),
      // make one overdue, one due-soon for demo
      nextDue: i === 0 ? addDays(today, -3) : addDays(today, i === 1 ? 14 : r.intervalDays),
    })),
  });

  console.log('✔ Seeded demo dog: Bella (Cockapoo, 3yr, 11kg)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// Seed feature flags
import { seedFlags } from '../lib/flags'
await seedFlags()
console.log('Feature flags seeded')
