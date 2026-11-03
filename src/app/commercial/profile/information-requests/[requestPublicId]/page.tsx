import type { Metadata } from 'next';
import { InformationRequestDetail } from '@/components/commercial/information-requests/InformationRequestDetail';
import { INFORMATION_REQUESTS_PATH } from '@/lib/notifications/informationRequestNotifications';

export const metadata: Metadata = { title: 'Solicitud de información' };

interface PageProps {
  params: Promise<{ requestPublicId: string }>;
}

export default async function InformationRequestDetailPage({ params }: PageProps) {
  const { requestPublicId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900">Solicitud de información</h1>
      <InformationRequestDetail
        requestPublicId={requestPublicId}
        canUploadDocuments
        back={{ href: INFORMATION_REQUESTS_PATH }}
      />
    </div>
  );
}
