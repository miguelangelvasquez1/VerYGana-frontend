'use client';

import React from 'react';
import PetScenesEditor from '@/components/commercial/pet/PetScenesEditor';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';

export default function PetScenesPage() {
  return (
    <DashboardLayout title="Editor de Escenas">
      <PetScenesEditor />
    </DashboardLayout>
  );
}