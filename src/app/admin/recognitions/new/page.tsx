'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import NewRecognitionWizard from '@/components/admin/recognitions/NewRecognitionWizard';

export default function NewRecognitionPage() {
  return (
    <AdminLayout>
      <NewRecognitionWizard />
    </AdminLayout>
  );
}
