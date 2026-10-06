'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import AdminBrandingPanel from '@/components/Admin/branding/AdminBrandingPanel';

export default function AdminBrandingPage() {
  return (
    <AdminLayout>
      <AdminBrandingPanel />
    </AdminLayout>
  );
}
