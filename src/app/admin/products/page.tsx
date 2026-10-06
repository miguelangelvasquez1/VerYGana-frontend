import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import ProductsManagement from '@/components/Admin/products/ProductsManagement';

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <ProductsManagement />
    </AdminLayout>
  );
}