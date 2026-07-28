import type { ReactNode } from 'react';

import { SessionProvider } from '@/components/providers/session-provider';
import type { SessionUser } from '@/lib/auth/session';

import { SidebarNav } from './sidebar-nav';
import { Topbar } from './topbar';

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <SessionProvider user={user}>
      <div className="grid min-h-dvh lg:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-sidebar-border lg:block">
          <div className="sticky top-0 h-dvh">
            <SidebarNav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
