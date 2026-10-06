'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import ConfigPanel from '@/components/Admin/config/ConfigPanel';

export default function ConfigPage() {
  return (
    <AdminLayout>
      <ConfigPanel />
    </AdminLayout>
  );
}
