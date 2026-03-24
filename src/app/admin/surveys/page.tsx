'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SurveyManagement from '@/components/Admin/surveys/SurveyManagement';

export default function AdminSurveysPage() {
  return (
    <AdminLayout>
      <SurveyManagement />
    </AdminLayout>
  );
}