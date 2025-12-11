'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import SystemManagement from '@/components/Admin/SystemManagement';

export default function SystemPage() {
  return (
    <AdminLayout>
      <SystemManagement />
    </AdminLayout>
  );
}