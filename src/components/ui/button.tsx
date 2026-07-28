import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'font-medium transition-all duration-150 outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'active:scale-[0.985]',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-card hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90',
        success: 'bg-success text-success-foreground shadow-card hover:bg-success/90',
        outline:
          'border border-border bg-card text-foreground shadow-card hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        sidebar:
          'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        default: 'h-9.5 px-4 text-sm',
        lg: 'h-11 rounded-lg px-6 text-sm',
        /** Touch-friendly target for the tablet POS and kitchen screens. */
        touch: 'h-14 rounded-lg px-6 text-base',
        icon: 'size-9.5',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and blocks interaction. */
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    // `asChild` forwards to a single child element, so a spinner cannot be
    // injected alongside it without breaking the contract.
    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
