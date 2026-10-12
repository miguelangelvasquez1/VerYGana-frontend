'use client';

import AdminLayout from '@/components/Admin/AdminLayout';
import FinancePanel from '@/components/Admin/finance/FinancePanel';

export default function FinancePage() {
  return (
    <AdminLayout>
      <FinancePanel />
    </AdminLayout>
  );
}
