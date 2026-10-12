'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import AdminRafflesPanel from '@/components/Admin/raffles/AdminRafflesPanel';

export default function AdminRafflesPage() {
  return (
    <AdminLayout>
      <AdminRafflesPanel />
    </AdminLayout>
  );
}