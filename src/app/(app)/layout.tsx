import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { getSession } from '@/lib/api/handler';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  // Belt-and-braces: middleware already enforces this, but a server
  // component must never assume a header set upstream was honoured.
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
