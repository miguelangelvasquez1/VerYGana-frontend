'use client';

import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import UserManagement from '@/components/Admin/UserManagement';

export default function UsersPage() {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
}