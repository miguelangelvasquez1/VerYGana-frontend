'use client';

import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import RecognitionDetail from '@/components/admin/recognitions/RecognitionDetail';

export default function RecognitionDetailPage() {
  const params = useParams();
  const publicId = String(params.publicId ?? '');

  return (
    <AdminLayout>
      <RecognitionDetail publicId={publicId} />
    </AdminLayout>
  );
}
