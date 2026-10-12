'use client';

import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import KeyPromotionDetail from '@/components/admin/key-promotions/KeyPromotionDetail';

export default function KeyPromotionDetailPage() {
  const params = useParams();
  const promotionId = Number(params.id);

  return (
    <AdminLayout>
      <KeyPromotionDetail promotionId={promotionId} />
    </AdminLayout>
  );
}
