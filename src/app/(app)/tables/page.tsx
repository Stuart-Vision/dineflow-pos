import type { Metadata } from 'next';

import { TablesClient } from './tables-client';

export const metadata: Metadata = { title: 'Tables' };

export default function TablesPage() {
  return <TablesClient />;
}
