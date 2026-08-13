import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  variant?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({ variant = 'neutral', children, className, icon }: BadgeProps) {
  const styles = {
    neutral: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60',
    indigo: 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50',
    emerald: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50',
    amber: 'bg-amber-950/50 text-amber-300 border-amber-800/50',
    rose: 'bg-rose-950/50 text-rose-300 border-rose-800/50',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border',
          styles[variant],
          className
        )
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
