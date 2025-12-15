'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SystemManagement from '@/components/admin/SystemManagement';

export default function SystemPage() {
  return (
    <AdminLayout>
      <SystemManagement />
    </AdminLayout>
  );
}