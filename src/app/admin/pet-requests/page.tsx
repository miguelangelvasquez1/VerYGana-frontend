'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import AdminPetRequestsPanel from '@/components/Admin/pet-requests/AdminPetRequestsPanel';

export default function AdminPetRequestsPage() {
  return (
    <AdminLayout>
      <AdminPetRequestsPanel />
    </AdminLayout>
  );
}
