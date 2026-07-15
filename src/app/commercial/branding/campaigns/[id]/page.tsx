'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CampaignDetail } from '@/components/commercial/campaigns/CampaignDetail';

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <CampaignDetail
      campaignId={Number(id)}
      onBack={() => router.push('/commercial/branding')}
    />
  );
}
