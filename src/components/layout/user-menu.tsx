'use client';

import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useSessionUser, usePermission } from '@/components/providers/session-provider';
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PERMISSIONS } from '@/constants/permissions';
import { ROLE_META } from '@/constants/roles';
import { apiPost } from '@/lib/api/client';

export function UserMenu() {
  const user = useSessionUser();
  const router = useRouter();
  const canViewSettings = usePermission(PERMISSIONS.SETTINGS_VIEW);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const roleMeta = ROLE_META[user.role];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiPost('/api/auth/logout');
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-lg p-1 pr-2.5 transition-colors hover:bg-muted">
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left sm:block">
            <span className="block text-sm leading-tight font-medium">{user.name}</span>
            <span className="block text-xs leading-tight text-muted-foreground">{roleMeta.label}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1 normal-case">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          <Badge className={roleMeta.badgeClass} size="sm">
            {roleMeta.label}
          </Badge>
        </DropdownMenuLabel>
        {canViewSettings && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings />
              Settings
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={loggingOut} onClick={handleLogout}>
          <LogOut />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
