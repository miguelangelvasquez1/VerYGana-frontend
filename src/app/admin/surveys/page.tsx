'use client';

import React from 'react';
import AdminSurveyList from '@/components/Admin/surveys/AdminSurveyList';
import AdminLayout from '@/components/Admin/AdminLayout';

export default function SystemAdminSurveysPage() {
  return (
    <AdminLayout>
      <AdminSurveyList />
    </AdminLayout>
  )
}