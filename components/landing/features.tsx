import { BowlIcon, WalkIcon, ShieldIcon, ChatIcon, SparkleIcon, HeartIcon } from '../icons';

const FEATURES = [
  {
    Icon: BowlIcon,
    title: 'Right portion, every meal',
    body: 'We calculate calories from breed, age, weight and activity - and update as your dog changes.',
  },
  {
    Icon: WalkIcon,
    title: 'Smart walk planning',
    body: 'Daily exercise targets your breed needs. Track minutes, mileage, and signs of fatigue.',
  },
  {
    Icon: ShieldIcon,
    title: 'Vaccines & parasite reminders',
    body: 'Never miss a booster, flea treatment or worming. Push and email - pick what works.',
  },
  {
    Icon: ChatIcon,
    title: 'AI care companion',
    body: 'Ask anything: weight, food swaps, behaviour, health concerns. Knows your dog by name.',
  },
  {
    Icon: SparkleIcon,
    title: 'Daily training nudges',
    body: '5-minute, breed-aware tips. Recall, loose-lead, calm settles - small wins, big change.',
  },
  {
    Icon: HeartIcon,
    title: 'Weekly wellness check',
    body: 'A 30-second pulse: limping, off food, scratching, mood - before issues become problems.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl mb-14">
          <p className="text-[13px] font-medium tracking-wider uppercase text-moss mb-3">What you get</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight font-semibold leading-[1.05]">
            Everything dog parents Google, in one calm place.
          </h2>
          <p className="text-ink-soft mt-4 text-lg">
            Generic advice doesn&rsquo;t fit your dog. Pawly bakes in breed, age, weight and lifestyle so every nudge actually applies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-ink/[0.05] hover:shadow-soft transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-moss-soft text-moss flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight mb-1.5">{title}</h3>
              <p className="text-[15px] text-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
