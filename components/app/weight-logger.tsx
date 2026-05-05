'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function WeightLogger({ dogId, defaultUnit }: { dogId: string; defaultUnit: 'KG' | 'LB' }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'KG' | 'LB'>(defaultUnit);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const w = parseFloat(weight);
    if (!w || w <= 0) { setError('Enter a valid weight'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogId,
          weight: w,
          weightUnit: unit,
          notedAt: new Date(`${date}T12:00:00`).toISOString(),
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setWeight('');
      setNotes('');
      startTransition(() => router.refresh());
    } catch {
      setError("Couldn't save - try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-ink/[0.06] shadow-soft p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight mb-3">Log a weight</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <div className="flex bg-cream rounded-xl border border-ink/10 overflow-hidden">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight"
            className="flex-1 px-4 py-3 bg-transparent outline-none text-base"
          />
          <div className="flex">
            {(['KG', 'LB'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 text-sm font-medium ${unit === u ? 'bg-moss text-cream' : 'text-ink-soft'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="bg-cream border border-ink/10 rounded-xl px-4 py-3 outline-none focus:border-moss"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="bg-cream border border-ink/10 rounded-xl px-4 py-3 outline-none focus:border-moss"
        />
      </div>
      {error && <p className="text-sm text-danger mb-2">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="bg-moss text-cream rounded-full h-11 px-6 font-medium disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save weight'}
      </button>
    </div>
  );
}
