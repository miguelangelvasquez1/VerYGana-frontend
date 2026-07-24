'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRafflesPanel from '@/components/admin/raffles/AdminRafflesPanel';

export default function AdminRafflesPage() {
  return (
    <AdminLayout>
      <AdminRafflesPanel />
    </AdminLayout>
  );
}