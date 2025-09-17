// app/(dashboard)/analytics/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/AdvertiserComponents/layout/DashboardLayout';
import { AnalyticsDashboard } from '@/components/AdvertiserComponents/dashboard/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Estadísticas">
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}