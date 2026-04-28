import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const fmtDate = (d: Date | string | null | undefined): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const monthsBetween = (a: Date, b: Date): number =>
  Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

export const ageFromDOB = (iso: Date | string | null | undefined): string => {
  if (!iso) return '';
  const m = monthsBetween(new Date(iso), new Date());
  if (m < 24) return `${m} mo`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r === 0 ? `${y} yr` : `${y} yr ${r} mo`;
};

export type LifeStage = 'puppy' | 'adult' | 'senior' | 'unknown';

export const lifeStage = (iso: Date | string | null | undefined): LifeStage => {
  if (!iso) return 'unknown';
  const m = monthsBetween(new Date(iso), new Date());
  if (m < 12) return 'puppy';
  if (m < 84) return 'adult';
  return 'senior';
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const addDays = (date: Date | string, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const daysUntil = (date: Date | string | null | undefined): number => {
  if (!date) return Infinity;
  return Math.round(
    (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
};

export function suggestedPortion(weight: number | null | undefined, dob: Date | string | null | undefined): number {
  if (!weight) return 200;
  const stage = lifeStage(dob);
  const factor = stage === 'puppy' ? 28 : stage === 'senior' ? 18 : 22;
  return Math.round(weight * factor);
}

export function statusFromDueDate(dueDate: Date | string | null | undefined) {
  const days = daysUntil(dueDate);
  if (days < 0) return { label: 'Overdue', tone: 'danger' as const };
  if (days <= 30) return { label: 'Due soon', tone: 'warn' as const };
  return { label: 'Up to date', tone: 'moss' as const };
}
