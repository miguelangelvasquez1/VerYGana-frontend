import type { Metadata } from 'next';

import { AlertsList } from '@/components/compliance/alerts/AlertsList';
import { parseAlertsParams } from '@/lib/compliance/routes';

export const metadata: Metadata = { title: 'Alertas' };

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pendingOnly, page } = parseAlertsParams(await searchParams);
  return <AlertsList pendingOnly={pendingOnly} page={page} />;
}
