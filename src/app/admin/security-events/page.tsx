'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SecurityAuditHub from '@/components/admin/security-events/SecurityAuditHub';

export default function AdminSecurityEventsPage() {
  return (
    <AdminLayout>
      <SecurityAuditHub />
    </AdminLayout>
  );
}
