// app/(dashboard)/ads/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/AdvertiserComponents/layout/DashboardLayout';
import { AdsList } from '@/components/AdvertiserComponents/ads/AdsList';

export default function AdsPage() {
  return (
    <DashboardLayout title="Mis Anuncios">
      <AdsList />
    </DashboardLayout>
  );
}