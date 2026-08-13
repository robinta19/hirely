import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090b] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-lg gap-2 font-medium',
  };

  const variantStyles = {
    primary: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200/20 focus:ring-zinc-400',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 focus:ring-zinc-400',
    outline: 'bg-transparent border border-zinc-800 hover:bg-zinc-800/70 text-zinc-200 focus:ring-zinc-400 hover:border-zinc-700',
    ghost: 'bg-transparent hover:bg-zinc-800/60 text-zinc-300 hover:text-white focus:ring-zinc-400',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
