import type { Task } from '@prisma/client';

/**
 * Weekly Cared-For metric. North-star tracker:
 *   completed-on-time / total-tasks-this-week
 *
 * "On time" = completed before end of its scheduled day. Snoozed/skipped count
 * as not-on-time. Open tasks scheduled in the future are excluded so we don't
 * dock the score for tasks that haven't reached their due time yet.
 */
export type WeeklyCareStats = {
  weekStart: Date;
  weekEnd: Date;
  completed: number;
  total: number;
  /** 0–100 */
  pct: number;
  /** consecutive prior weeks at ≥70% */
  streak: number;
};

export function startOfWeek(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  // Monday-start week (UK-ish)
  const dow = (out.getDay() + 6) % 7; // 0 = Mon
  out.setDate(out.getDate() - dow);
  return out;
}

export function endOfWeek(d: Date = new Date()): Date {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

/** Compute stats from the set of tasks in a given week. */
export function computeWeekStats(tasks: Task[], now: Date = new Date()): { completed: number; total: number; pct: number } {
  let completed = 0;
  let total = 0;
  for (const t of tasks) {
    const dueEnd = new Date(t.scheduledFor);
    dueEnd.setHours(23, 59, 59, 999);
    // Don't count tasks not yet due
    if (dueEnd > now && t.status === 'OPEN') continue;
    total += 1;
    if (t.status === 'DONE' && t.completedAt && t.completedAt <= dueEnd) {
      completed += 1;
    }
  }
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, pct };
}

/** Walk back over recent weeks counting consecutive weeks ≥70%. */
export function computeStreak(allTasksByWeek: Task[][], threshold = 70): number {
  let streak = 0;
  for (const wk of allTasksByWeek) {
    const { pct, total } = computeWeekStats(wk);
    if (total === 0) break;
    if (pct >= threshold) streak += 1;
    else break;
  }
  return streak;
}
