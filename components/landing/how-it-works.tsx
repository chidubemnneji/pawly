const STEPS = [
  {
    n: 1,
    title: 'Tell us about your dog',
    body: '8 quick steps — name, breed, age, weight, lifestyle. Two minutes, and we have what we need.',
  },
  {
    n: 2,
    title: 'Get a personalised plan',
    body: 'Daily feeding, walks, training and health reminders — all calibrated for your dog specifically.',
  },
  {
    n: 3,
    title: 'Ask anything, anytime',
    body: 'The AI care companion knows your dog by name. Replace 20 panicky Google searches with one calm answer.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-20 bg-cream-deep/60">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-[13px] font-medium tracking-wider uppercase text-moss mb-3">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight font-semibold leading-[1.05]">
            From confused to confident in one evening.
          </h2>
        </div>
        <ol className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-white rounded-2xl p-7 border border-ink/[0.05]">
              <div className="w-10 h-10 rounded-full bg-moss text-cream flex items-center justify-center font-display text-lg font-semibold mb-4">
                {s.n}
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight mb-2">{s.title}</h3>
              <p className="text-[15px] text-ink-soft leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
