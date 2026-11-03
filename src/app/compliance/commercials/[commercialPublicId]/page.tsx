import type { Metadata } from 'next';

import { CommercialCase } from '@/components/compliance/case/CommercialCase';
import { parseCaseTab } from '@/lib/compliance/routes';

export const metadata: Metadata = { title: 'Caso del empresario' };

export default async function CommercialCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ commercialPublicId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { commercialPublicId } = await params;
  const { tab } = await searchParams;
  return <CommercialCase commercialPublicId={commercialPublicId} initialTab={parseCaseTab(tab)} />;
}
