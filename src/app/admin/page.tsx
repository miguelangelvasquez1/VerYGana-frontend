'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import Dashboard from '@/components/Admin/Dashboard';

export default function AdminPage() {
  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
}