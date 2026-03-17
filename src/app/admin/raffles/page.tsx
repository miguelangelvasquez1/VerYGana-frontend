'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RaffleManagement from '@/components/admin/raffles/RaffleManagement';

export default function RafflesPage() {
  return (
    <AdminLayout>
      <RaffleManagement />
    </AdminLayout>
  );
}