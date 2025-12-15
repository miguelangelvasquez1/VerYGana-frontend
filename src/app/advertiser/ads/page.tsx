// app/(dashboard)/ads/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { AdsList } from '@/components/advertiser/ads/AdsList';

export default function AdsPage() {
  return (
    <DashboardLayout title="Mis Anuncios">
      <AdsList />
    </DashboardLayout>
  );
}