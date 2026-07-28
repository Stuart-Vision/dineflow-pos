'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { NotificationBell } from '@/components/layout/notification-bell';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { pageTitleForPath } from '@/lib/nav';

export function Topbar() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-sm sm:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
      </Sheet>

      <h1 className="min-w-0 flex-1 truncate font-display text-base font-semibold tracking-tight">
        {pageTitleForPath(pathname)}
      </h1>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  );
}
