import { ChefHat } from 'lucide-react';

import { publicEnv } from '@/lib/env';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, var(--sidebar-accent) 0%, transparent 45%), radial-gradient(circle at 85% 80%, var(--sidebar-primary) 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ChefHat className="size-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">{publicEnv.appName}</span>
        </div>

        <div className="relative space-y-6">
          <blockquote className="max-w-md text-2xl leading-snug font-medium text-balance">
            &ldquo;From the counter to the kitchen to the close-out report — one system that
            actually keeps up with a dinner rush.&rdquo;
          </blockquote>
          <div className="flex flex-wrap gap-2 text-xs text-sidebar-muted-foreground">
            {['Point of Sale', 'Kitchen Display', 'Inventory', 'Reservations', 'Multi-branch Reports'].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3 py-1"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <p className="relative text-xs text-sidebar-muted-foreground">
          &copy; {new Date().getFullYear()} {publicEnv.appName}. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
