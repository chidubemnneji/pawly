import type { Dog, HealthRecord } from '@prisma/client';
import { addDays, daysUntil, lifeStage, suggestedPortion } from './utils';
import { findBreed } from './breeds';

export type GeneratedTask = {
  type: 'FEEDING' | 'EXERCISE' | 'HEALTH' | 'WELLNESS' | 'TRAINING' | 'MEDICATION';
  title: string;
  subtitle: string | null;
  iconKey: string;
  scheduledFor: Date;
  timeOfDay: string | null;
  urgent: boolean;
  // Synthetic ID — for de-duping when re-running the generator on the same day
  synthId: string;
};

/**
 * buildTasksForDog — pure function. Given a dog and its health records, produce
 * the list of tasks for *today*. Run once per day per dog (e.g., a server cron
 * or on-demand when the user opens the Today feed).
 */
export function buildTasksForDog(
  dog: Dog,
  healthRecords: HealthRecord[],
  forDate: Date = new Date()
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const dayKey = forDate.toISOString().slice(0, 10);
  const breed = findBreed(dog.breed);
  const stage = lifeStage(dog.dob);

  // Feeding — rationale: portion size derived from weight + life stage
  const feedingTimes = dog.feedingTimes.length ? dog.feedingTimes : ['08:00', '18:00'];
  const portion = suggestedPortion(dog.weight, dog.dob);
  feedingTimes.forEach((time, i) => {
    const stageNote = stage === 'puppy'
      ? `${dog.name} is a puppy — higher kcal/kg`
      : stage === 'senior'
        ? `${dog.name} is a senior — lower kcal/kg`
        : `tailored to ${dog.name}'s weight`;
    tasks.push({
      type: 'FEEDING',
      title: i === 0 ? 'Breakfast' : i === 1 ? 'Dinner' : `Meal ${i + 1}`,
      subtitle: dog.weight
        ? `~${portion}g of ${dog.food ?? 'food'} · ${stageNote}`
        : `${dog.food ?? 'Current food'} · check pack guide`,
      iconKey: 'bowl',
      scheduledFor: forDate,
      timeOfDay: time,
      urgent: false,
      synthId: `feed-${dayKey}-${i}`,
    });
  });

  // Walk — rationale: target from owner-set minutes + breed exercise need
  const walkTarget = Math.min(dog.exerciseMins, 90);
  const walkStyleLabel =
    dog.walkStyle === 'OFF_LEAD' ? 'off-lead OK'
    : dog.walkStyle === 'ON_LEAD' ? 'on-lead'
    : 'mixed';
  const breedHint = breed
    ? `${breed.name}s typically need ${breed.exercise.toLowerCase()}`
    : `${walkStyleLabel} walk`;
  tasks.push({
    type: 'EXERCISE',
    title: `${walkTarget}-min walk`,
    subtitle: `${walkStyleLabel} · ${breedHint}`,
    iconKey: 'walk',
    scheduledFor: forDate,
    timeOfDay: '12:30',
    urgent: false,
    synthId: `walk-${dayKey}`,
  });

  // Health record reminders (vaccines + parasite + medications)
  for (const r of healthRecords) {
    if (!r.nextDue) continue;
    const days = daysUntil(r.nextDue);
    const isOverdue = days < 0;
    const isDueSoon = days <= (r.type === 'PARASITE' ? 7 : 30);
    if (!isOverdue && !isDueSoon) continue;
    tasks.push({
      type: r.type === 'PARASITE' ? 'HEALTH' : r.type === 'MEDICATION' ? 'MEDICATION' : 'HEALTH',
      title: isOverdue
        ? `${r.name} — overdue`
        : `${r.name} — due ${days === 0 ? 'today' : `in ${days}d`}`,
      subtitle: isOverdue
        ? `Was due ${r.nextDue.toLocaleDateString('en-GB')} — book vet to keep ${dog.name} protected`
        : `Next due ${r.nextDue.toLocaleDateString('en-GB')} · ${r.frequency ?? 'recurring'}`,
      iconKey: r.type === 'MEDICATION' ? 'pill' : 'shield',
      scheduledFor: forDate,
      timeOfDay: null,
      urgent: isOverdue,
      synthId: `hr-${r.id}-${dayKey}`,
    });
  }

  // Wellness check (Tuesdays)
  if (forDate.getDay() === 2) {
    const watchFor = breed?.watchFor ? ` ${dog.name}'s breed is prone to ${breed.watchFor.split(',')[0].trim()}.` : '';
    tasks.push({
      type: 'WELLNESS',
      title: 'Quick wellness check',
      subtitle: `Any limping, off food, scratching, or off-mood?${watchFor}`,
      iconKey: 'heart',
      scheduledFor: forDate,
      timeOfDay: null,
      urgent: false,
      synthId: `wellness-${dayKey}`,
    });
  }

  // Training nudge (one daily)
  const tip = pickTrainingTip(stage);
  const stageHint = stage === 'puppy'
    ? 'Short sessions stick best with puppies'
    : stage === 'senior'
      ? 'Gentle, low-impact reps suit senior dogs'
      : 'Daily reps build a calm, engaged adult';
  tasks.push({
    type: 'TRAINING',
    title: '5-min training',
    subtitle: `${tip} · ${stageHint}`,
    iconKey: 'sparkle',
    scheduledFor: forDate,
    timeOfDay: null,
    urgent: false,
    synthId: `train-${dayKey}`,
  });

  // Sort: urgent first, then by time
  return tasks.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return (a.timeOfDay ?? 'zz').localeCompare(b.timeOfDay ?? 'zz');
  });
}

function pickTrainingTip(stage: ReturnType<typeof lifeStage>): string {
  const puppyTips = [
    'Loose-lead practice — reward when slack appears',
    'Recall — short distance, big rewards',
    'Sit & stay, building duration',
    'Settle on a mat — calm reward',
  ];
  const adultTips = [
    'Practice "leave it" with a low-value treat',
    'Reinforce recall in a quiet area',
    '2-minute calm settle on mat',
    'Loose-lead at park entrance',
  ];
  const seniorTips = [
    'Gentle scent game with kibble',
    'Slow-reward mat work',
    'Practise "find it" with a soft toy',
  ];
  const list = stage === 'puppy' ? puppyTips : stage === 'senior' ? seniorTips : adultTips;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Default health records to seed for a new dog. Real dates start blank;
 * the user confirms or fills them in via the Health tab.
 */
export function defaultHealthRecords() {
  return [
    { type: 'VACCINE' as const, name: 'DHPP (Distemper combo)', frequency: 'Annual', intervalDays: 365 },
    { type: 'VACCINE' as const, name: 'Leptospirosis', frequency: 'Annual', intervalDays: 365 },
    { type: 'VACCINE' as const, name: 'Rabies', frequency: 'Every 3 years', intervalDays: 1095 },
    { type: 'VACCINE' as const, name: 'Bordetella (Kennel cough)', frequency: 'Annual', intervalDays: 365 },
    { type: 'PARASITE' as const, name: 'Flea & Tick', frequency: 'Quarterly', intervalDays: 90 },
    { type: 'PARASITE' as const, name: 'Worming', frequency: 'Quarterly', intervalDays: 90 },
  ];
}
