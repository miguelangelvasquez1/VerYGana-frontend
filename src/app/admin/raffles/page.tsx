'use client';

import React from 'react';
import AdminLayout from '@/components/AdminComponents/AdminLayout';
import RaffleManagement from '@/components/AdminComponents/RaffleManagement';

export default function RafflesPage() {
  return (
    <AdminLayout>
      <RaffleManagement />
    </AdminLayout>
  );
}