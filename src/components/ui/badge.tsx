import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        // Status roles ship with an icon or a label — never colour alone.
        success:
          'border-transparent bg-success/12 text-success dark:bg-success/20',
        warning:
          'border-transparent bg-warning/14 text-warning dark:bg-warning/22',
        destructive:
          'border-transparent bg-destructive/12 text-destructive dark:bg-destructive/22',
        info: 'border-transparent bg-info/12 text-info dark:bg-info/22',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        sm: 'px-1.5 py-0 text-[11px]',
        lg: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  /** Small leading dot, useful for dense status columns. */
  dot?: boolean;
}

function Badge({ className, variant, size, asChild = false, dot, children, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
