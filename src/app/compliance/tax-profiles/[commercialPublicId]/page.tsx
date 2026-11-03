import type { Metadata } from 'next';

import { TaxProfileReview } from '@/components/compliance/tax-profiles/TaxProfileReview';

export const metadata: Metadata = { title: 'Revisión de ficha tributaria' };

export default async function TaxProfileReviewPage({
  params,
}: {
  params: Promise<{ commercialPublicId: string }>;
}) {
  const { commercialPublicId } = await params;
  return <TaxProfileReview commercialPublicId={commercialPublicId} />;
}
