// app/(dashboard)/ads/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/Advertiser/layout/DashboardLayout';
import { AdsList } from '@/components/Advertiser/ads/AdsList';

export default function AdsPage() {
  return (
    <DashboardLayout title="Mis Anuncios">
      <AdsList />
    </DashboardLayout>
  );
}