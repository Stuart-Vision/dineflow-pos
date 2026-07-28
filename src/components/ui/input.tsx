import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders an icon inside the field's leading edge. */
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, invalid, ...props }, ref) => {
    const field = (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-9.5 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs',
          'transition-[color,box-shadow,border-color] outline-none',
          'placeholder:text-muted-foreground',
          'file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30',
          startIcon && 'pl-9',
          endIcon && 'pr-9',
          className,
        )}
        {...props}
      />
    );

    if (!startIcon && !endIcon) return field;

    return (
      <div className="relative w-full">
        {startIcon && (
          <span
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground [&_svg]:size-4"
            aria-hidden="true"
          >
            {startIcon}
          </span>
        )}
        {field}
        {endIcon && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {endIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs',
      'transition-[color,box-shadow,border-color] outline-none',
      'placeholder:text-muted-foreground',
      'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
      'disabled:cursor-not-allowed disabled:opacity-60',
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Input, Textarea };
