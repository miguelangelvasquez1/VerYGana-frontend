'use client';

import React from 'react';
import AdminSurveyList from '@/components/admin/surveys/AdminSurveyList';
import AdminLayout from '@/components/admin/AdminLayout';

export default function SystemAdminSurveysPage() {
  return (
    <AdminLayout>
      <AdminSurveyList />
    </AdminLayout>
  )
}