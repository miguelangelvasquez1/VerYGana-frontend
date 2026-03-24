// app/(dashboard)/analytics/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';
import { AnalyticsDashboard } from '@/components/commercial/dashboard/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Estadísticas">
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}