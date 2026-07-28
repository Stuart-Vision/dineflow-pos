import type { Metadata } from 'next';

import { KitchenClient } from './kitchen-client';

export const metadata: Metadata = { title: 'Kitchen Display' };

export default function KitchenPage() {
  return <KitchenClient />;
}
