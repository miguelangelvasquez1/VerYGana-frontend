'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SurveyManagement from '@/components/admin/surveys/SurveyManagement';

export default function AdminSurveysPage() {
  return (
    <AdminLayout>
      <SurveyManagement />
    </AdminLayout>
  );
}