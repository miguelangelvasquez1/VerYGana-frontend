import type { Metadata } from 'next';

import { TaxProfileQueue } from '@/components/compliance/tax-profiles/TaxProfileQueue';
import { parseQueueParams } from '@/lib/compliance/routes';

export const metadata: Metadata = { title: 'Fichas tributarias' };

export default async function TaxProfilesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { status, page } = parseQueueParams(await searchParams);
  return <TaxProfileQueue status={status} page={page} />;
}
