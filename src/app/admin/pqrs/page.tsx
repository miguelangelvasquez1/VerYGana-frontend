'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPqrsPanel from '@/components/admin/pqrs/AdminPqrsPanel';

export default function AdminPqrsPage() {
  return (
    <AdminLayout>
      <AdminPqrsPanel />
    </AdminLayout>
  );
}
