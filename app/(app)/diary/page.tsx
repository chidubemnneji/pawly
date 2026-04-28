import { prisma } from '@/lib/db';
import { getActiveDog } from '@/lib/active-dog';
import { fmtDate } from '@/lib/utils';
import { DiaryAdder } from '@/components/app/diary-adder';

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);

  const entries = await prisma.diaryEntry.findMany({
    where: { dogId: dog.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-[13px] uppercase tracking-wider text-ink-faint font-semibold">Diary</p>
        <h1 className="font-display text-4xl tracking-tight font-semibold mt-1 leading-[1.05]">
          {dog.name}&rsquo;s photo diary
        </h1>
        <p className="text-ink-soft mt-2">
          A small, growing record of {dog.name}&rsquo;s life. Useful when you want to remember.
        </p>
      </header>

      <DiaryAdder dogId={dog.id} />

      {entries.length === 0 ? (
        <p className="bg-white border border-ink/[0.06] rounded-2xl p-6 text-center text-ink-soft">
          No diary entries yet. Add the first one above.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {entries.map((e) => (
            <figure key={e.id} className="bg-white border border-ink/[0.06] rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.photoUrl} alt={e.caption ?? ''} className="w-full aspect-square object-cover" />
              <figcaption className="p-3">
                {e.caption && <p className="text-[14px] leading-tight">{e.caption}</p>}
                <p className="text-[11px] text-ink-faint mt-1">{fmtDate(e.createdAt)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
