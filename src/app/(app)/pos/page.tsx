import type { Metadata } from 'next';

import { PosClient } from './pos-client';

export const metadata: Metadata = { title: 'Point of Sale' };

export default function PosPage() {
  return <PosClient />;
}
