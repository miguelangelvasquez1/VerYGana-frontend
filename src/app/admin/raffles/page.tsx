'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RaffleManagement from '@/components/admin/raffles/RaffleManagement';

export default function AdminRafflesPage() {
  return (
    <AdminLayout>
      <RaffleManagement />
    </AdminLayout>
  );
}