'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: 'pill' | 'underline' }
>(({ className, variant = 'pill', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1',
      variant === 'pill'
        ? 'h-9.5 rounded-lg bg-muted p-1 text-muted-foreground'
        : 'h-10 w-full justify-start gap-4 overflow-x-auto border-b border-border scrollbar-slim',
      className,
    )}
    data-variant={variant}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all',
      'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
      'focus-visible:ring-2 focus-visible:ring-ring',
      // Pill list
      'group-data-[variant=pill]:rounded-md',
      'data-[state=active]:text-foreground',
      // Both variants read from the parent list's data-variant.
      '[[data-variant=pill]_&]:rounded-md [[data-variant=pill]_&]:px-3 [[data-variant=pill]_&]:py-1.5',
      '[[data-variant=pill]_&][data-state=active]:bg-card [[data-variant=pill]_&][data-state=active]:shadow-card',
      '[[data-variant=underline]_&]:h-10 [[data-variant=underline]_&]:border-b-2 [[data-variant=underline]_&]:border-transparent [[data-variant=underline]_&]:px-1 [[data-variant=underline]_&]:pb-2 [[data-variant=underline]_&]:text-muted-foreground',
      '[[data-variant=underline]_&][data-state=active]:border-primary [[data-variant=underline]_&][data-state=active]:text-foreground',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
