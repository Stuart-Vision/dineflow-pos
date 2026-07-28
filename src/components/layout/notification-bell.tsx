'use client';

import { Bell, BellRing, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiGet, apiPost } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const SEVERITY_DOT: Record<NotificationItem['severity'], string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-destructive',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await apiGet<{ items: NotificationItem[]; unreadCount: number }>('/api/notifications');
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleSelect(item: NotificationItem) {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await apiPost(`/api/notifications/${item.id}/read`).catch(() => undefined);
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await apiPost('/api/notifications/read-all').catch(() => undefined);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          {unreadCount > 0 ? <BellRing className="size-4.5" /> : <Bell className="size-4.5" />}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Check className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {!loaded ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">New kitchen, stock and reservation alerts land here.</p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted',
                      !item.isRead && 'bg-accent/40',
                    )}
                  >
                    <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', SEVERITY_DOT[item.severity])} />
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="line-clamp-2 block text-xs text-muted-foreground">{item.message}</span>
                      <span className="block text-[11px] text-muted-foreground/70">{timeAgo(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <div className="border-t border-border p-2 text-center">
            <Badge variant="muted" className="w-full justify-center">
              Showing latest {items.length}
            </Badge>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
