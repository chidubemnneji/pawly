import { prisma } from '@/lib/db';
import { getActiveDog } from '@/lib/active-dog';
import { findBreed } from '@/lib/breeds';
import { fmtDate } from '@/lib/utils';
import { WeightChart } from '@/components/app/weight-chart';
import { WeightLogger } from '@/components/app/weight-logger';

export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);
  const breed = findBreed(dog.breed);

  const logs = await prisma.weightLog.findMany({
    where: { dogId: dog.id },
    orderBy: { notedAt: 'asc' },
    take: 200,
  });

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const change = latest && first ? latest.weight - first.weight : 0;
  const inRange = breed && latest
    ? latest.weight >= breed.weightKg[0] && latest.weight <= breed.weightKg[1]
    : null;

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-[13px] uppercase tracking-wider text-ink-faint font-semibold">Weight</p>
        <h1 className="font-display text-4xl tracking-tight font-semibold mt-1 leading-[1.05]">
          {dog.name}&rsquo;s weight
        </h1>
        <p className="text-ink-soft mt-2">
          Log a weight every 30 days. Trends matter more than any single number.
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat
          label="Current"
          value={latest ? `${latest.weight} ${latest.weightUnit.toLowerCase()}` : (dog.weight ? `${dog.weight} kg` : '-')}
          sub={latest ? fmtDate(latest.notedAt) : 'Not logged yet'}
        />
        <Stat
          label="Breed range"
          value={breed ? `${breed.weightKg[0]}–${breed.weightKg[1]} kg` : '-'}
          sub={inRange === null ? '' : inRange ? 'In range' : 'Outside typical range'}
          tone={inRange === false ? 'warn' : inRange ? 'good' : 'neutral'}
        />
        <Stat
          label="Change"
          value={logs.length >= 2 ? `${change >= 0 ? '+' : ''}${change.toFixed(1)} kg` : '-'}
          sub={logs.length >= 2 ? 'Since first log' : 'Need 2+ logs'}
          tone={Math.abs(change) > 1 ? 'warn' : 'neutral'}
        />
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-ink/[0.06] shadow-soft p-5">
          <WeightChart logs={logs.map((l) => ({ x: l.notedAt.toISOString(), y: l.weight }))} breedRange={breed?.weightKg} />
        </div>
      )}

      <WeightLogger dogId={dog.id} defaultUnit={dog.weightUnit} />

      {logs.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight mb-3">History</h2>
          <div className="space-y-2">
            {[...logs].reverse().map((l) => (
              <div key={l.id} className="bg-white border border-ink/[0.06] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{l.weight} {l.weightUnit.toLowerCase()}</p>
                  {l.notes && <p className="text-[13px] text-ink-soft">{l.notes}</p>}
                </div>
                <p className="text-[13px] text-ink-faint">{fmtDate(l.notedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone = 'neutral' }: {
  label: string;
  value: string;
  sub: string;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  const toneClass =
    tone === 'good' ? 'text-moss-deep'
    : tone === 'warn' ? 'text-warn'
    : 'text-ink-soft';
  return (
    <div className="bg-white border border-ink/[0.06] rounded-2xl p-4">
      <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">{label}</p>
      <p className="font-display text-2xl font-semibold tracking-tight mt-1">{value}</p>
      <p className={`text-[12px] mt-1 ${toneClass}`}>{sub}</p>
    </div>
  );
}
