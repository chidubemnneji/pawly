import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-moss text-cream hover:bg-moss-deep active:scale-[.98] shadow-soft',
  secondary:
    'bg-white text-ink border border-ink/10 hover:border-ink/20 active:scale-[.98]',
  ghost:
    'bg-transparent text-ink hover:bg-ink/5 active:bg-ink/10',
  danger:
    'bg-danger text-white hover:opacity-90 active:scale-[.98]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-full',
  md: 'h-11 px-5 text-[15px] rounded-full',
  lg: 'h-14 px-7 text-base rounded-full',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
