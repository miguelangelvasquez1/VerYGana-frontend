'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RaffleManagement from '@/components/admin/RaffleManagement';

export default function RafflesPage() {
  return (
    <AdminLayout>
      <RaffleManagement />
    </AdminLayout>
  );
}