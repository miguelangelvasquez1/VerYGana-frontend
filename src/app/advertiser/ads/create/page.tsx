// app/(dashboard)/ads/create/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { CreateAdForm } from '@/components/advertiser/ads/CreateAdForm';

export default function CreateAdPage() {
  return (
    <DashboardLayout title="Crear Anuncio">
      <CreateAdForm />
    </DashboardLayout>
  );
}