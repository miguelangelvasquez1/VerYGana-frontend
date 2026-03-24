// app/(dashboard)/ads/create/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';
import { CreateAdForm } from '@/components/commercial/ads/CreateAdForm';

export default function CreateAdPage() {
  return (
    <DashboardLayout title="Crear Anuncio">
      <CreateAdForm />
    </DashboardLayout>
  );
}