// app/(dashboard)/ads/create/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/AdvertiserComponents/layout/DashboardLayout';
import { CreateAdForm } from '@/components/AdvertiserComponents/ads/CreatedAdForm';

export default function CreateAdPage() {
  return (
    <DashboardLayout title="Crear Anuncio">
      <CreateAdForm />
    </DashboardLayout>
  );
}