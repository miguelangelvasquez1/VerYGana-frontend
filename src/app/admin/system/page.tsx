'use client';

import React from 'react';
import AdminLayout from '@/components/AdminComponents/AdminLayout';
import SystemManagement from '@/components/AdminComponents/SystemManagement';

export default function SystemPage() {
  return (
    <AdminLayout>
      <SystemManagement />
    </AdminLayout>
  );
}