import { getActiveDog } from '@/lib/active-dog';
import { ageFromDOB, lifeStage, suggestedPortion } from '@/lib/utils';
import { findBreed } from '@/lib/breeds';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);
  const breed = findBreed(dog.breed);

  const stage = lifeStage(dog.dob);
  const portion = suggestedPortion(dog.weight, dog.dob);

  return (
    <div className="px-5 md:px-10 py-6 max-w-3xl mx-auto space-y-6">
      {/* Full-bleed gradient hero with photo */}
      <header className="gradient-warm rounded-[28px] overflow-hidden border border-white/40 shadow-soft relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-moss/30 via-transparent to-white/20 mix-blend-overlay" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-5">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-cream/60 backdrop-blur flex items-center justify-center font-display text-5xl font-semibold text-moss-deep overflow-hidden shrink-0 ring-4 ring-white/70 shadow-lift">
            {dog.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dog.photoUrl} alt={dog.name} className="w-full h-full object-cover" />
            ) : (
              dog.name[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] uppercase tracking-wider text-ink/70 font-semibold">Profile</p>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight font-semibold leading-[1.02] mt-1 text-ink">
              {dog.name}
            </h1>
            <p className="text-ink/80 mt-1 text-[15px]">
              {dog.breed ?? 'Mixed breed'} · {ageFromDOB(dog.dob)} {stage !== 'unknown' ? stage : ''}
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>The basics</CardTitle></CardHeader>
        <CardBody className="grid sm:grid-cols-2 gap-4">
          <Field label="Sex" value={dog.sex === 'F' ? 'Female' : dog.sex === 'M' ? 'Male' : '-'} />
          <Field label="Neutered" value={dog.neutered === true ? 'Yes' : dog.neutered === false ? 'No' : '-'} />
          <Field label="Weight" value={dog.weight ? `${dog.weight} ${dog.weightUnit.toLowerCase()}` : '-'} />
          <Field
            label="Typical for breed"
            value={breed ? `${breed.weightKg[0]}–${breed.weightKg[1]} kg` : '-'}
          />
          <Field label="Born" value={dog.dob ? new Date(dog.dob).toLocaleDateString('en-GB') : '-'} />
          <Field label="Life stage" value={stage} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diet & feeding</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Current food" value={dog.food ?? '-'} />
          <Field label="Suggested portion" value={`~${portion} g/day · split across ${dog.feedingTimes.length || 2} meals`} />
          <Field label="Feeding times" value={(dog.feedingTimes ?? []).join(' · ')} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Health</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Conditions" value={dog.conditions.length ? dog.conditions.join(', ') : 'None recorded'} />
          <Field label="Allergies" value={dog.allergies.length ? dog.allergies.join(', ') : 'None recorded'} />
          {dog.vetName && <Field label="Vet" value={`${dog.vetName}${dog.vetClinic ? ` · ${dog.vetClinic}` : ''}`} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lifestyle</CardTitle></CardHeader>
        <CardBody className="grid sm:grid-cols-3 gap-4">
          <Field label="Daily exercise" value={`${dog.exerciseMins} min`} />
          <Field
            label="Walk style"
            value={
              dog.walkStyle === 'OFF_LEAD' ? 'Off-lead OK'
              : dog.walkStyle === 'ON_LEAD' ? 'On-lead'
              : 'Mixed'
            }
          />
          <Field label="Lives with" value={`${dog.livesWithDogs ? `${dog.livesWithDogs} dog(s)` : 'No other dogs'}${dog.livesWithKids ? ', kids' : ''}`} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personality</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <Slider label="Energy" value={dog.energy} />
          <Slider label="Confidence" value={dog.confidence} />
          <Slider label="Sociability" value={dog.social} />
        </CardBody>
      </Card>

      {breed && (
        <Card>
          <CardHeader><CardTitle>{breed.name} - what to know</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <Field label="Group" value={breed.group} />
            <Field label="Typical exercise" value={breed.exercise} />
            <Field label="Common traits" value={breed.traits} />
            <Field label="Watch for" value={breed.watchFor} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">{label}</p>
      <p className="text-[15px] mt-0.5">{value || '-'}</p>
    </div>
  );
}

function Slider({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <p className="text-[14px] font-medium">{label}</p>
        <p className="text-[12px] text-ink-faint">{value}/5</p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-ink/[0.07] overflow-hidden">
        <div className="h-full bg-moss" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}
