'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdManagement from '@/components/admin/ads/AdMangement';

export default function AdminAdsPage() {
  return (
    <AdminLayout>
      <AdManagement />
    </AdminLayout>
  );
}