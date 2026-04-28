'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmtDate, statusFromDueDate } from '@/lib/utils';
import { ShieldIcon, PillIcon } from '@/components/icons';
import type { HealthRecord } from '@prisma/client';

const TONE_CLASS = {
  danger: 'bg-danger/10 text-danger',
  warn: 'bg-warn/15 text-warn',
  moss: 'bg-moss-soft text-moss-deep',
} as const;

export function HealthRecordRow({ record }: { record: HealthRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const status = statusFromDueDate(record.nextDue);
  const Icon = record.type === 'MEDICATION' ? PillIcon : ShieldIcon;

  const markGiven = async (date: Date) => {
    setSubmitting(true);
    try {
      await fetch(`/api/health/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastGiven: date.toISOString() }),
      });
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-ink/[0.06] shadow-soft">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-moss-soft text-moss-deep flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight">{record.name}</p>
          <p className="text-[13px] text-ink-soft mt-0.5 truncate">
            {record.frequency ?? 'No schedule'} · Next due: {fmtDate(record.nextDue)}
          </p>
        </div>
        <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${TONE_CLASS[status.tone]}`}>
          {status.label}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-ink/[0.05] pt-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold">Last given</p>
              <p>{fmtDate(record.lastGiven)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-ink-faint font-semibold">Next due</p>
              <p>{fmtDate(record.nextDue)}</p>
            </div>
          </div>
          <button
            onClick={() => markGiven(new Date())}
            disabled={submitting}
            className="w-full bg-moss text-cream rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Mark given today'}
          </button>
        </div>
      )}
    </div>
  );
}
