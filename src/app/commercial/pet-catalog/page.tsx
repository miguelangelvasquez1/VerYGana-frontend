'use client';

import React from 'react';
import PetCatalogEditor from '@/components/commercial/pet/PetCatalogEditor';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';

export default function PetCatalogPage() {
  return (
    <DashboardLayout title="Editor de Catálogo">
      <PetCatalogEditor />
    </DashboardLayout>
  );
}