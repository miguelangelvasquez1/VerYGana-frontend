'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminBrandingPanel from '@/components/admin/branding/AdminBrandingPanel';

export default function AdminBrandingPage() {
  return (
    <AdminLayout>
      <AdminBrandingPanel />
    </AdminLayout>
  );
}
