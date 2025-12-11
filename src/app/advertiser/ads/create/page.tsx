// app/(dashboard)/ads/create/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/Advertiser/layout/DashboardLayout';
import { CreateAdForm } from '@/components/Advertiser/ads/CreatedAdForm';

export default function CreateAdPage() {
  return (
    <DashboardLayout title="Crear Anuncio">
      <CreateAdForm />
    </DashboardLayout>
  );
}