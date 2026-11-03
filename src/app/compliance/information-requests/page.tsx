import type { Metadata } from 'next';

import { RequestQueue } from '@/components/compliance/requests/RequestQueue';
import { parseRequestQueueParams } from '@/lib/compliance/routes';

export const metadata: Metadata = { title: 'Requerimientos de información' };

export default async function InformationRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { status, page } = parseRequestQueueParams(await searchParams);
  return <RequestQueue status={status} page={page} />;
}
