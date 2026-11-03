import type { Metadata } from 'next';

import { TaxCatalog } from '@/components/compliance/tax-catalog/TaxCatalog';
import { parseCatalogTab } from '@/lib/compliance/routes';

export const metadata: Metadata = { title: 'Catálogo tributario' };

export default async function TaxCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab } = await searchParams;
  return <TaxCatalog tab={parseCatalogTab(tab)} />;
}
