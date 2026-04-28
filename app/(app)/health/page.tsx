import { prisma } from '@/lib/db';
import { getActiveDog } from '@/lib/active-dog';
import { defaultHealthRecords } from '@/lib/tasks';
import { HealthRecordRow } from '@/components/app/health-record-row';

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);

  let records = await prisma.healthRecord.findMany({
    where: { dogId: dog.id },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  // Seed defaults on first visit
  if (records.length === 0) {
    await prisma.healthRecord.createMany({
      data: defaultHealthRecords().map((r) => ({ ...r, dogId: dog.id })),
    });
    records = await prisma.healthRecord.findMany({
      where: { dogId: dog.id },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  const vaccines = records.filter((r) => r.type === 'VACCINE');
  const parasites = records.filter((r) => r.type === 'PARASITE');
  const meds = records.filter((r) => r.type === 'MEDICATION');

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto space-y-8">
      <header>
        <p className="text-[13px] uppercase tracking-wider text-ink-faint font-semibold">Health</p>
        <h1 className="font-display text-4xl tracking-tight font-semibold mt-1 leading-[1.05]">
          {dog.name}&rsquo;s health record
        </h1>
        <p className="text-ink-soft mt-2">Track vaccinations, parasite prevention, and medications.</p>
      </header>

      <Section title="Vaccinations" empty="No vaccination records.">
        {vaccines.map((r) => <HealthRecordRow key={r.id} record={r} />)}
      </Section>

      <Section title="Parasite prevention" empty="No parasite-prevention records.">
        {parasites.map((r) => <HealthRecordRow key={r.id} record={r} />)}
      </Section>

      <Section title="Medications" empty="No active medications.">
        {meds.length > 0 ? meds.map((r) => <HealthRecordRow key={r.id} record={r} />) : null}
      </Section>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight mb-3">{title}</h2>
      {hasContent ? (
        <div className="space-y-2.5">{children}</div>
      ) : (
        <p className="text-sm text-ink-soft bg-white border border-ink/[0.06] rounded-2xl p-4">{empty}</p>
      )}
    </section>
  );
}
