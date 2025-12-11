// app/(dashboard)/analytics/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/Advertiser/layout/DashboardLayout';
import { AnalyticsDashboard } from '@/components/Advertiser/dashboard/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Estadísticas">
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}