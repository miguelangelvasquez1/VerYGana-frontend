'use client';

import React from 'react';
import AdminLayout from '@/components/AdminComponents/AdminLayout';
import UserManagement from '@/components/AdminComponents/UserManagement';

export default function UsersPage() {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
}