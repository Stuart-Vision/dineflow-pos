import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative flex w-full gap-3 rounded-lg border p-4 text-sm [&_svg]:size-4.5 [&_svg]:shrink-0 [&_svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-foreground [&_svg]:text-muted-foreground',
        info: 'border-info/25 bg-info/8 text-foreground [&_svg]:text-info',
        success: 'border-success/25 bg-success/8 text-foreground [&_svg]:text-success',
        warning: 'border-warning/30 bg-warning/10 text-foreground [&_svg]:text-warning',
        destructive: 'border-destructive/25 bg-destructive/8 text-foreground [&_svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

/** Status is never carried by colour alone — each variant ships an icon. */
const variantIcon = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Pass `null` to suppress the icon entirely. */
  icon?: React.ReactNode | null;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', icon, children, ...props }, ref) => {
    const Icon = variantIcon[variant ?? 'default'];
    return (
      <div
        ref={ref}
        role={variant === 'destructive' || variant === 'warning' ? 'alert' : 'status'}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {icon === null ? null : (icon ?? <Icon aria-hidden="true" />)}
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    );
  },
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('leading-none font-semibold tracking-tight', className)} {...props} />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground [&_p]:leading-relaxed', className)} {...props} />
  ),
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
