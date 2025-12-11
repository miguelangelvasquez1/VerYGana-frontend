'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import RaffleManagement from '@/components/Admin/RaffleManagement';

export default function RafflesPage() {
  return (
    <AdminLayout>
      <RaffleManagement />
    </AdminLayout>
  );
}