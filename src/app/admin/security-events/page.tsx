'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import SecurityAuditHub from '@/components/Admin/security-events/SecurityAuditHub';

export default function AdminSecurityEventsPage() {
  return (
    <AdminLayout>
      <SecurityAuditHub />
    </AdminLayout>
  );
}
