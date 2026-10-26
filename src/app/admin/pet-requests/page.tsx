'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPetRequestsPanel from '@/components/admin/pet-requests/AdminPetRequestsPanel';

export default function AdminPetRequestsPage() {
  return (
    <AdminLayout>
      <AdminPetRequestsPanel />
    </AdminLayout>
  );
}
