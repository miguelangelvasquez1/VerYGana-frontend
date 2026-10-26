import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductsManagement from '@/components/admin/products/ProductsManagement';

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <ProductsManagement />
    </AdminLayout>
  );
}