'use client';

import React from 'react';
import SurveyManagement from '@/components/commercial/surveys/SurveyManagement';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';

export default function AdminSurveysPage() {
  return (
    <DashboardLayout title="Mis Encuestas">
      <SurveyManagement />
    </DashboardLayout>
  );
}