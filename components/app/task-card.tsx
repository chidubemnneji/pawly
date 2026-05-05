'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconKey, CheckIcon } from '@/components/icons';
import type { Task, TaskStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

type Action =
  | { kind: 'DONE' }
  | { kind: 'SNOOZE'; minutes: number }
  | { kind: 'SKIP' }
  | { kind: 'REOPEN' };

/**
 * Untruncated subtitle so the rationale (the "why this matters" line) is
 * actually readable. Uses 2-line clamp via line-clamp utilities.
 */
export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<TaskStatus>(task.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const isUrgent = task.urgent && optimistic === 'OPEN';
  const isDone = optimistic === 'DONE';
  const isSnoozed = optimistic === 'SNOOZED';
  const isSkipped = optimistic === 'SKIPPED';

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const send = async (action: Action) => {
    const body =
      action.kind === 'SNOOZE'
        ? { status: 'SNOOZED', snoozeMinutes: action.minutes }
        : action.kind === 'REOPEN'
          ? { status: 'OPEN' }
          : { status: action.kind };

    // Optimistic state
    setOptimistic(
      action.kind === 'DONE'
        ? 'DONE'
        : action.kind === 'SNOOZE'
          ? 'SNOOZED'
          : action.kind === 'SKIP'
            ? 'SKIPPED'
            : 'OPEN',
    );
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('failed');
      startTransition(() => router.refresh());
    } catch {
      // Revert
      setOptimistic(task.status);
    }
  };

  const muted = isDone || isSnoozed || isSkipped;
  const stateLabel = isDone ? 'Done' : isSnoozed ? 'Snoozed' : isSkipped ? 'Skipped today' : null;

  return (
    <div
      className={cn(
        'relative w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all',
        muted
          ? 'bg-ink/[0.04] opacity-65'
          : isUrgent
            ? 'glass-strong ring-1 ring-danger/30'
            : 'glass-strong',
      )}
    >
      {/* Tap target - full row toggles complete (mark done / reopen) */}
      <button
        type="button"
        onClick={() => send(isDone ? { kind: 'REOPEN' } : { kind: 'DONE' })}
        className="flex flex-1 items-center gap-3 min-w-0 text-left"
        aria-label={isDone ? 'Reopen task' : 'Mark complete'}
      >
        <div
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
            isUrgent ? 'bg-danger/10 text-danger' : 'bg-biscuit-soft text-moss-deep',
            muted && 'bg-ink/[0.05] text-ink-soft',
          )}
        >
          <Icon name={(task.iconKey as IconKey) || 'paw'} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium leading-tight', isDone && 'line-through')}>
            {task.title}
          </p>
          {task.subtitle && (
            <p className="text-[13px] text-ink-soft mt-0.5 line-clamp-2">{task.subtitle}</p>
          )}
          {stateLabel && (
            <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-faint mt-1">
              {stateLabel}
            </p>
          )}
        </div>
      </button>

      {/* Status / time + overflow menu */}
      <div className="flex items-center gap-1.5 shrink-0">
        {task.timeOfDay && optimistic === 'OPEN' && (
          <span className="text-[12px] text-ink-faint font-medium hidden sm:block">{task.timeOfDay}</span>
        )}
        <span
          className={cn(
            'inline-flex items-center justify-center w-7 h-7 rounded-full transition-all',
            isDone ? 'bg-moss text-cream' : 'bg-ink/[0.05]',
          )}
        >
          {isDone && <CheckIcon size={16} />}
        </span>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-ink/5 text-ink-soft"
            aria-label="More options"
          >
            <span className="text-lg leading-none">⋯</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 bg-white border border-ink/10 rounded-xl shadow-lift py-1 w-44 animate-fade-in">
              {!isDone && (
                <MenuItem onClick={() => send({ kind: 'DONE' })}>Mark done</MenuItem>
              )}
              {isDone && (
                <MenuItem onClick={() => send({ kind: 'REOPEN' })}>Reopen</MenuItem>
              )}
              {!isDone && (
                <>
                  <MenuItem onClick={() => send({ kind: 'SNOOZE', minutes: 60 })}>Snooze 1 hr</MenuItem>
                  <MenuItem onClick={() => send({ kind: 'SNOOZE', minutes: 60 * 4 })}>Snooze 4 hrs</MenuItem>
                  <MenuItem onClick={() => send({ kind: 'SKIP' })}>Skip today</MenuItem>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-[14px] hover:bg-ink/[0.04] transition-colors"
    >
      {children}
    </button>
  );
}
