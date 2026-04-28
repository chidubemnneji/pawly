type Props = {
  pct: number;
  completed: number;
  total: number;
  streak: number;
  dogName: string;
};

export function StreakCard({ pct, completed, total, streak, dogName }: Props) {
  if (total === 0) {
    return (
      <div className="bg-white border border-ink/[0.06] rounded-2xl p-4 shadow-soft">
        <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">This week</p>
        <p className="font-display text-lg font-semibold mt-1">Just getting started 🌱</p>
        <p className="text-sm text-ink-soft mt-1">Complete a task to start your streak.</p>
      </div>
    );
  }

  const tone =
    pct >= 80 ? 'good'
    : pct >= 50 ? 'okay'
    : 'low';

  const ring = tone === 'good' ? '#3F6B4E' : tone === 'okay' ? '#D69540' : '#C9694B';
  const label = tone === 'good' ? 'On track' : tone === 'okay' ? 'Steady' : 'Catching up';

  // SVG ring
  const R = 28;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);

  return (
    <div className="bg-white border border-ink/[0.06] rounded-2xl p-4 shadow-soft flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
        <circle cx="40" cy="40" r={R} stroke="#E9E2D2" strokeWidth="6" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={R}
          stroke={ring}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
        <text x="40" y="45" textAnchor="middle" fontSize="18" fontWeight="600" fill="#1F2A24">{pct}%</text>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">This week · {label}</p>
        <p className="font-display text-lg font-semibold leading-tight mt-0.5">
          {completed} of {total} on-time for {dogName}
        </p>
        {streak > 0 && (
          <p className="text-[13px] text-moss-deep mt-1">
            🔥 {streak} {streak === 1 ? 'week' : 'weeks'} on a streak
          </p>
        )}
      </div>
    </div>
  );
}
