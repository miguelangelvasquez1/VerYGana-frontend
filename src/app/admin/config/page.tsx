'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfigPanel from '@/components/admin/config/ConfigPanel';

export default function ConfigPage() {
  return (
    <AdminLayout>
      <ConfigPanel />
    </AdminLayout>
  );
}
