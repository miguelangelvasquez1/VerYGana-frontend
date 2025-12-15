'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import UserManagement from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
}