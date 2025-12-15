// app/(dashboard)/analytics/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { AnalyticsDashboard } from '@/components/advertiser/dashboard/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Estadísticas">
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}