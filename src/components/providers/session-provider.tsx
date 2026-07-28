'use client';

import * as React from 'react';

import type { Permission } from '@/constants/permissions';
import type { SessionUser } from '@/lib/auth/session';

const SessionContext = React.createContext<SessionUser | null>(null);

/** Hydrates the signed-in user from the server layout into client components. */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser(): SessionUser {
  const user = React.useContext(SessionContext);
  if (!user) throw new Error('useSessionUser must be used within <SessionProvider>');
  return user;
}

export function usePermission(permission: Permission): boolean {
  const user = useSessionUser();
  return user.permissions.includes(permission);
}
