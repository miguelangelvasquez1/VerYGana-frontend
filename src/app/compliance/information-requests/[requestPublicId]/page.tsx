import type { Metadata } from 'next';

import { RequestDetail } from '@/components/compliance/requests/RequestDetail';

export const metadata: Metadata = { title: 'Requerimiento de información' };

export default async function InformationRequestDetailPage({
  params,
}: {
  params: Promise<{ requestPublicId: string }>;
}) {
  const { requestPublicId } = await params;
  return <RequestDetail requestPublicId={requestPublicId} />;
}
