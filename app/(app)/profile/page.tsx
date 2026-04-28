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
    <div className="px-5 md:px-10 py-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-end gap-5">
        <div className="w-24 h-24 rounded-3xl bg-biscuit-soft flex items-center justify-center font-display text-4xl font-semibold text-moss-deep">
          {dog.name[0]}
        </div>
        <div>
          <h1 className="font-display text-4xl tracking-tight font-semibold leading-[1.05]">{dog.name}</h1>
          <p className="text-ink-soft mt-1">
            {dog.breed ?? 'Mixed breed'} · {ageFromDOB(dog.dob)} {stage !== 'unknown' ? stage : ''}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>The basics</CardTitle></CardHeader>
        <CardBody className="grid sm:grid-cols-2 gap-4">
          <Field label="Sex" value={dog.sex === 'F' ? 'Female' : dog.sex === 'M' ? 'Male' : '—'} />
          <Field label="Neutered" value={dog.neutered === true ? 'Yes' : dog.neutered === false ? 'No' : '—'} />
          <Field label="Weight" value={dog.weight ? `${dog.weight} ${dog.weightUnit.toLowerCase()}` : '—'} />
          <Field
            label="Typical for breed"
            value={breed ? `${breed.weightKg[0]}–${breed.weightKg[1]} kg` : '—'}
          />
          <Field label="Born" value={dog.dob ? new Date(dog.dob).toLocaleDateString('en-GB') : '—'} />
          <Field label="Life stage" value={stage} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Diet & feeding</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <Field label="Current food" value={dog.food ?? '—'} />
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
          <CardHeader><CardTitle>{breed.name} — what to know</CardTitle></CardHeader>
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
      <p className="text-[15px] mt-0.5">{value || '—'}</p>
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
