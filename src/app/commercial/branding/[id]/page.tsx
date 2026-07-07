'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BrandingRequestDetail } from '@/components/commercial/branding/BrandingRequestDetail';

export default function BrandingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <BrandingRequestDetail
      requestId={Number(id)}
      onBack={() => router.push('/commercial/branding')}
    />
  );
}
