'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconKey, CheckIcon } from '@/components/icons';
import type { Task } from '@prisma/client';

export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(task.status === 'DONE');
  const [, startTransition] = useTransition();

  const isUrgent = task.urgent && !optimistic;

  const onToggle = async () => {
    setOptimistic(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      startTransition(() => router.refresh());
    } catch {
      setOptimistic(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={optimistic}
      className={`w-full text-left flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
        optimistic
          ? 'bg-moss-soft border-moss/20 opacity-60'
          : isUrgent
            ? 'bg-white border-danger/30 hover:border-danger/60 shadow-soft'
            : 'bg-white border-ink/[0.06] hover:border-ink/15 shadow-soft'
      }`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
        isUrgent ? 'bg-danger/10 text-danger' : 'bg-biscuit-soft text-moss-deep'
      }`}>
        <Icon name={(task.iconKey as IconKey) || 'paw'} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-tight ${optimistic ? 'line-through' : ''}`}>{task.title}</p>
        {task.subtitle && <p className="text-[13px] text-ink-soft mt-0.5 truncate">{task.subtitle}</p>}
      </div>
      <div className="text-right shrink-0">
        {task.timeOfDay && !optimistic && <span className="text-[12px] text-ink-faint font-medium block">{task.timeOfDay}</span>}
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mt-1 transition-all ${
          optimistic ? 'bg-moss text-cream' : 'bg-ink/[0.05]'
        }`}>
          {optimistic && <CheckIcon size={16} />}
        </span>
      </div>
    </button>
  );
}
