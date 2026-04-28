import { prisma } from '@/lib/db';
import { getActiveDog } from '@/lib/active-dog';
import { ageFromDOB, lifeStage } from '@/lib/utils';
import { findBreed } from '@/lib/breeds';
import { buildTasksForDog } from '@/lib/tasks';
import { TaskCard } from '@/components/app/task-card';
import { Card, CardBody } from '@/components/ui/card';
import { StreakCard } from '@/components/app/streak-card';
import { SetupChecklist } from '@/components/app/setup-checklist';
import { PushPrompt } from '@/components/app/push-prompt';
import { startOfWeek, endOfWeek, computeWeekStats, computeStreak } from '@/lib/care-stats';

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);
  const breed = findBreed(dog.breed);

  const healthRecords = await prisma.healthRecord.findMany({ where: { dogId: dog.id } });

  // Build today's tasks if not already in DB for today
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const existingTasks = await prisma.task.findMany({
    where: {
      dogId: dog.id,
      scheduledFor: {
        gte: new Date(`${todayKey}T00:00:00`),
        lt: new Date(`${todayKey}T23:59:59`),
      },
    },
    orderBy: [{ urgent: 'desc' }, { timeOfDay: 'asc' }, { createdAt: 'asc' }],
  });

  let tasks = existingTasks;
  if (existingTasks.length === 0) {
    const generated = buildTasksForDog(dog, healthRecords, today);
    await prisma.task.createMany({
      data: generated.map((t) => ({
        dogId: dog.id,
        type: t.type,
        title: t.title,
        subtitle: t.subtitle,
        iconKey: t.iconKey,
        scheduledFor: t.scheduledFor,
        timeOfDay: t.timeOfDay,
        urgent: t.urgent,
      })),
    });
    tasks = await prisma.task.findMany({
      where: {
        dogId: dog.id,
        scheduledFor: {
          gte: new Date(`${todayKey}T00:00:00`),
          lt: new Date(`${todayKey}T23:59:59`),
        },
      },
      orderBy: [{ urgent: 'desc' }, { timeOfDay: 'asc' }, { createdAt: 'asc' }],
    });
  }

  const open = tasks.filter((t) => t.status === 'OPEN');
  const done = tasks.filter((t) => t.status === 'DONE');
  const urgentCount = open.filter((t) => t.urgent).length;

  // Weekly care stats
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekTasks = await prisma.task.findMany({
    where: {
      dogId: dog.id,
      scheduledFor: { gte: weekStart, lt: weekEnd },
    },
  });
  const weekStats = computeWeekStats(weekTasks, today);

  // Streak: look back at the prior 8 weeks
  const streakStart = new Date(weekStart);
  streakStart.setDate(streakStart.getDate() - 8 * 7);
  const recent = await prisma.task.findMany({
    where: {
      dogId: dog.id,
      scheduledFor: { gte: streakStart, lt: weekStart },
    },
    orderBy: { scheduledFor: 'desc' },
  });
  const byWeek: Record<string, typeof recent> = {};
  for (const t of recent) {
    const ws = startOfWeek(t.scheduledFor).toISOString().slice(0, 10);
    (byWeek[ws] ||= []).push(t);
  }
  const weekArrays = Object.keys(byWeek).sort().reverse().map((k) => byWeek[k]);
  const streak = computeStreak(weekArrays);

  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="text-[13px] uppercase tracking-wider text-ink-faint font-semibold">
          {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight font-semibold mt-1 leading-[1.05]">
          {greeting}.
        </h1>
        <p className="text-ink-soft mt-2 text-lg">
          {dog.name} · {ageFromDOB(dog.dob)} {lifeStage(dog.dob) !== 'unknown' ? lifeStage(dog.dob) : ''} {dog.breed ?? ''}
          {dog.weight ? ` · ${dog.weight} ${dog.weightUnit.toLowerCase()}` : ''}
        </p>
      </header>

      {urgentCount > 0 && (
        <Card className="mb-6 border-danger/30 bg-danger/5">
          <CardBody>
            <p className="font-display text-lg font-semibold text-danger">
              {urgentCount} urgent {urgentCount === 1 ? 'task' : 'tasks'} need attention
            </p>
            <p className="text-sm text-ink-soft mt-1">Tap to mark them done after handling.</p>
          </CardBody>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <StreakCard
          pct={weekStats.pct}
          completed={weekStats.completed}
          total={weekStats.total}
          streak={streak}
          dogName={dog.name}
        />
        <SetupChecklist dog={dog} />
      </div>

      <div className="mb-6">
        <PushPrompt vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''} />
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight mb-3">Today&rsquo;s plan</h2>
        {open.length === 0 ? (
          <Card>
            <CardBody>
              <p className="font-medium">All done for today.</p>
              <p className="text-sm text-ink-soft mt-1">{dog.name} is well-cared-for. See you tomorrow.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {open.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-base font-semibold tracking-tight text-ink-faint mb-3">
            Completed · {done.length}
          </h2>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.03] text-ink-soft">
                <span className="line-through text-sm">{t.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {breed && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-3">For your {breed.name}</h2>
          <Card>
            <CardBody className="space-y-2">
              <KV label="Typical exercise" value={breed.exercise} />
              <KV label="Common traits" value={breed.traits} />
              <KV label="Watch for" value={breed.watchFor} />
            </CardBody>
          </Card>
        </section>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">{label}</p>
      <p className="text-[15px]">{value}</p>
    </div>
  );
}
