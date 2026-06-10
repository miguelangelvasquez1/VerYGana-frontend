'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import FinancePanel from '@/components/admin/finance/FinancePanel';

export default function FinancePage() {
  return (
    <AdminLayout>
      <FinancePanel />
    </AdminLayout>
  );
}
