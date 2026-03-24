// app/(dashboard)/ads/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';
import { AdsList } from '@/components/commercial/ads/AdsList';

export default function AdsPage() {
  return (
    <DashboardLayout title="Mis Anuncios">
      <AdsList />
    </DashboardLayout>
  );
}