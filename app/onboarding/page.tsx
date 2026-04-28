'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@/components/icons';
import { BREEDS, BREED_GROUPS, groupBreeds, searchBreeds } from '@/lib/breeds';

type WalkStyle = 'ON_LEAD' | 'OFF_LEAD' | 'MIXED';
type Sex = 'M' | 'F' | null;

type Form = {
  name: string;
  breed: string;
  dob: string;
  sex: Sex;
  neutered: boolean | null;
  weight: string;
  weightUnit: 'KG' | 'LB';
  conditions: string[];
  allergies: string[];
  food: string;
  feedingTimes: string[];
  exerciseMins: number;
  walkStyle: WalkStyle;
  energy: number;
  confidence: number;
  social: number;
};

const COMMON_CONDITIONS = ['Hip dysplasia', 'Allergies (skin)', 'Allergies (food)', 'Anxiety', 'Epilepsy', 'Arthritis', 'Heart murmur', 'Diabetes'];
const COMMON_ALLERGIES = ['Chicken', 'Beef', 'Wheat', 'Dairy', 'Pollen (env.)', 'Grass mites'];

const STEPS = [
  'Welcome',
  'Name',
  'Breed',
  'Age',
  'Body',
  'Health',
  'Lifestyle',
  'Personality',
  'Done',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Form>({
    name: '',
    breed: '',
    dob: '',
    sex: null,
    neutered: null,
    weight: '',
    weightUnit: 'KG',
    conditions: [],
    allergies: [],
    food: '',
    feedingTimes: ['08:00', '18:00'],
    exerciseMins: 60,
    walkStyle: 'MIXED',
    energy: 3,
    confidence: 3,
    social: 3,
  });

  const update = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const totalSteps = STEPS.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1: return form.name.trim().length > 0;
      case 2: return form.breed.trim().length > 0;
      case 3: return form.dob.length > 0;
      default: return true;
    }
  }, [step, form]);

  const onFinish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weight: form.weight ? parseFloat(form.weight) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Could not save your dog. Try again?');
      }
      const { dogId } = await res.json();
      router.push(`/today?dog=${dogId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="border-b border-ink/[0.07] bg-cream/85 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-3xl h-16 px-5 flex items-center justify-between">
          <Link href="/" aria-label="Pawly home"><Logo /></Link>
          <p className="text-sm text-ink-faint">Step {step + 1} of {totalSteps}</p>
        </div>
        <div className="h-1 bg-ink/[0.07]">
          <div
            className="h-full bg-moss transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-5 py-10 md:py-16">
        <div className="animate-fade-in">
          {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
          {step === 1 && <NameStep form={form} update={update} />}
          {step === 2 && <BreedStep form={form} update={update} />}
          {step === 3 && <AgeStep form={form} update={update} />}
          {step === 4 && <BodyStep form={form} update={update} />}
          {step === 5 && <HealthStep form={form} update={update} />}
          {step === 6 && <LifestyleStep form={form} update={update} />}
          {step === 7 && <PersonalityStep form={form} update={update} />}
          {step === 8 && <DoneStep form={form} onFinish={onFinish} submitting={submitting} error={error} />}
        </div>
      </main>

      {/* nav buttons */}
      {step > 0 && step < 8 && (
        <div className="border-t border-ink/[0.07] bg-cream/85 backdrop-blur sticky bottom-0">
          <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ChevronLeftIcon size={18} /> Back
            </Button>
            <Button disabled={!canAdvance} onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}>
              Continue <ChevronRightIcon size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- step components ---------- */

function StepHeading({ tag, title, body }: { tag: string; title: string; body?: string }) {
  return (
    <div className="mb-8">
      <p className="text-[13px] font-medium tracking-wider uppercase text-moss mb-3">{tag}</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight font-semibold leading-[1.05]">{title}</h1>
      {body && <p className="text-ink-soft mt-3 text-lg leading-relaxed max-w-xl">{body}</p>}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center pt-8">
      <div className="inline-block animate-pop-in">
        <Logo size={64} withWordmark={false} />
      </div>
      <h1 className="font-display text-5xl md:text-6xl tracking-tight font-semibold mt-6 leading-[1.05]">
        Let&rsquo;s build your dog&rsquo;s profile.
      </h1>
      <p className="text-ink-soft mt-5 text-lg max-w-xl mx-auto">
        Eight quick questions. About two minutes. We&rsquo;ll personalise everything based on your answers — feeding, walks, training, health.
      </p>
      <div className="mt-10">
        <Button size="lg" onClick={onNext}>Start <ChevronRightIcon size={18} /></Button>
      </div>
      <p className="text-[13px] text-ink-faint mt-6">Free forever · No credit card · Skip anything you&rsquo;re not sure of</p>
    </div>
  );
}

function NameStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  return (
    <div>
      <StepHeading tag="01 / Name" title="What&rsquo;s your dog&rsquo;s name?" body="We&rsquo;ll use it throughout the app." />
      <input
        autoFocus
        type="text"
        value={form.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="e.g. Bella"
        className="w-full text-3xl font-display font-medium bg-transparent border-b-2 border-ink/15 focus:border-moss outline-none py-4 transition-colors"
      />
    </div>
  );
}

function BreedStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  const [q, setQ] = useState('');
  const grouped = useMemo(() => groupBreeds(searchBreeds(q)), [q]);

  return (
    <div>
      <StepHeading tag="02 / Breed" title={`What breed is ${form.name || 'your dog'}?`} body="Don't know? Start typing to search, or pick &lsquo;Mixed breed&rsquo;." />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search breeds…"
        className="w-full bg-white border border-ink/10 rounded-2xl px-5 py-4 text-base outline-none focus:border-moss"
      />
      <div className="mt-6 max-h-[420px] overflow-y-auto pr-2 space-y-5">
        {BREED_GROUPS.map((group) => {
          const list = grouped[group];
          if (!list?.length) return null;
          return (
            <div key={group}>
              <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold mb-2">{group}</p>
              <div className="grid grid-cols-2 gap-2">
                {list.map((b) => (
                  <button
                    key={b.slug}
                    onClick={() => update({ breed: b.name })}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      form.breed === b.name
                        ? 'bg-moss text-cream border-moss'
                        : 'bg-white border-ink/10 hover:border-ink/30'
                    }`}
                  >
                    <p className="font-medium text-[14px]">{b.name}</p>
                    <p className={`text-[12px] mt-0.5 ${form.breed === b.name ? 'text-cream/80' : 'text-ink-faint'}`}>
                      {b.weightKg[0]}–{b.weightKg[1]} kg
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgeStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  return (
    <div>
      <StepHeading tag="03 / Age" title={`When was ${form.name || 'your dog'} born?`} body="Approximate is fine — even just a guess at the year." />
      <input
        autoFocus
        type="date"
        value={form.dob}
        onChange={(e) => update({ dob: e.target.value })}
        max={new Date().toISOString().slice(0, 10)}
        className="w-full bg-white border border-ink/10 rounded-2xl px-5 py-4 text-lg outline-none focus:border-moss"
      />
      <p className="text-[13px] text-ink-faint mt-3">If unsure, ask your vet — they can estimate from teeth and joints.</p>
    </div>
  );
}

function BodyStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  return (
    <div>
      <StepHeading tag="04 / Body" title="A few quick body details." body="We use these to personalise feeding portions and exercise targets." />
      <div className="space-y-6 mt-2">
        <div>
          <label className="text-sm font-medium text-ink-soft">Sex</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(['F', 'M'] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ sex: s })}
                className={`px-4 py-3 rounded-2xl border transition-all ${
                  form.sex === s ? 'bg-moss text-cream border-moss' : 'bg-white border-ink/10 hover:border-ink/30'
                }`}
              >
                {s === 'F' ? 'Female' : 'Male'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-soft">Neutered / spayed?</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { key: true, label: 'Yes' },
              { key: false, label: 'Not yet' },
            ].map((o) => (
              <button
                key={String(o.key)}
                onClick={() => update({ neutered: o.key })}
                className={`px-4 py-3 rounded-2xl border transition-all ${
                  form.neutered === o.key ? 'bg-moss text-cream border-moss' : 'bg-white border-ink/10 hover:border-ink/30'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-soft">Weight</label>
          <div className="flex gap-3 mt-2">
            <input
              type="number"
              inputMode="decimal"
              value={form.weight}
              onChange={(e) => update({ weight: e.target.value })}
              placeholder="11"
              className="flex-1 bg-white border border-ink/10 rounded-2xl px-5 py-3 text-lg outline-none focus:border-moss"
            />
            <div className="flex bg-white border border-ink/10 rounded-2xl overflow-hidden">
              {(['KG', 'LB'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => update({ weightUnit: u })}
                  className={`px-4 text-sm font-medium ${form.weightUnit === u ? 'bg-moss text-cream' : 'text-ink-soft'}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  const toggle = (key: 'conditions' | 'allergies', v: string) => {
    const list = form[key];
    update({ [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as Partial<Form>);
  };
  return (
    <div>
      <StepHeading tag="05 / Health" title="Anything we should know?" body="Skip if none apply — you can add later in Health." />
      <div className="space-y-7">
        <div>
          <p className="text-sm font-medium text-ink-soft mb-3">Existing conditions</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CONDITIONS.map((c) => (
              <Chip key={c} active={form.conditions.includes(c)} onClick={() => toggle('conditions', c)}>{c}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-ink-soft mb-3">Allergies</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((c) => (
              <Chip key={c} active={form.allergies.includes(c)} onClick={() => toggle('allergies', c)}>{c}</Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LifestyleStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  return (
    <div>
      <StepHeading tag="06 / Lifestyle" title="Food and movement." body="Defaults are sensible for most dogs — adjust if you know better." />
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-ink-soft">Current food (brand or type)</label>
          <input
            type="text"
            value={form.food}
            onChange={(e) => update({ food: e.target.value })}
            placeholder="e.g. Eukanuba Adult"
            className="w-full mt-2 bg-white border border-ink/10 rounded-2xl px-5 py-3 text-base outline-none focus:border-moss"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink-soft">Daily exercise target: <span className="text-ink font-semibold">{form.exerciseMins} min</span></label>
          <input
            type="range"
            min={20}
            max={150}
            step={5}
            value={form.exerciseMins}
            onChange={(e) => update({ exerciseMins: Number(e.target.value) })}
            className="w-full mt-2"
          />
          <div className="flex justify-between text-[11px] text-ink-faint mt-1">
            <span>20</span><span>60</span><span>120</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-soft">Walking style</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { k: 'ON_LEAD' as const, label: 'On-lead' },
              { k: 'MIXED' as const, label: 'Mixed' },
              { k: 'OFF_LEAD' as const, label: 'Off-lead' },
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => update({ walkStyle: o.k })}
                className={`px-3 py-3 rounded-2xl border text-sm font-medium transition-all ${
                  form.walkStyle === o.k ? 'bg-moss text-cream border-moss' : 'bg-white border-ink/10 hover:border-ink/30'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalityStep({ form, update }: { form: Form; update: (p: Partial<Form>) => void }) {
  const Slider = ({ label, value, lowLabel, highLabel, onChange }: {
    label: string;
    value: number;
    lowLabel: string;
    highLabel: string;
    onChange: (v: number) => void;
  }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="font-medium text-[15px]">{label}</p>
        <span className="text-[13px] text-ink-faint">{value}/5</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="flex justify-between text-[12px] text-ink-faint mt-1">
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );

  return (
    <div>
      <StepHeading tag="07 / Personality" title="Who are they, really?" body="Helps us tailor training and behaviour tips." />
      <div className="space-y-7">
        <Slider label="Energy" value={form.energy} lowLabel="Couch buddy" highLabel="Always on" onChange={(v) => update({ energy: v })} />
        <Slider label="Confidence" value={form.confidence} lowLabel="Cautious" highLabel="Bold" onChange={(v) => update({ confidence: v })} />
        <Slider label="Sociability" value={form.social} lowLabel="My human only" highLabel="Loves everyone" onChange={(v) => update({ social: v })} />
      </div>
    </div>
  );
}

function DoneStep({ form, onFinish, submitting, error }: {
  form: Form;
  onFinish: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="text-center pt-8">
      <div className="inline-flex w-20 h-20 rounded-full bg-moss-soft text-moss items-center justify-center animate-check-bounce">
        <CheckIcon size={36} />
      </div>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight font-semibold mt-6 leading-[1.05]">
        {form.name ? `Welcome, ${form.name}!` : 'All set!'}
      </h1>
      <p className="text-ink-soft mt-4 text-lg max-w-lg mx-auto">
        We&rsquo;re building today&rsquo;s personalised plan — feeding, walks, training, health reminders. You can change anything later.
      </p>
      {error && <p className="text-danger text-sm mt-4">{error}</p>}
      <div className="mt-10">
        <Button size="lg" onClick={onFinish} disabled={submitting}>
          {submitting ? 'Saving…' : 'See my dog\u2019s plan'} <ChevronRightIcon size={18} />
        </Button>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm border transition-all ${
        active ? 'bg-moss text-cream border-moss' : 'bg-white border-ink/10 hover:border-ink/30'
      }`}
    >
      {children}
    </button>
  );
}
