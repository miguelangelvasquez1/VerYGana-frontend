'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPqrsPanel from '@/components/admin/pqrs/AdminPqrsPanel';
import AdminRefundsPanel from '@/components/admin/pqrs/AdminRefundsPanel';

type Tab = 'pqrs' | 'refunds';

export default function AdminPqrsPage() {
  const [tab, setTab] = useState<Tab>('pqrs');

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex gap-1 border-b border-gray-200">
          {([
            { value: 'pqrs', label: 'PQRS' },
            { value: 'refunds', label: 'Reembolsos' },
          ] as { value: Tab; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px cursor-pointer ${
                tab === value
                  ? 'border-admin-blue text-admin-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'pqrs' ? <AdminPqrsPanel /> : <AdminRefundsPanel />}
      </div>
    </AdminLayout>
  );
}
