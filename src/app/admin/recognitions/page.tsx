'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import RecognitionsPanel from '@/components/admin/recognitions/RecognitionsPanel';

export default function RecognitionsPage() {
  return (
    <AdminLayout>
      <RecognitionsPanel />
    </AdminLayout>
  );
}
