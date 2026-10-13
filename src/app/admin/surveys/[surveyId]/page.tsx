'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AdminSurveyDetail from '@/components/Admin/surveys/AdminSurveyDetail';
import AdminLayout from '@/components/Admin/AdminLayout';

export default function SystemAdminSurveyDetailPage() {
  const params   = useParams<{ surveyId: string }>();
  const surveyId = parseInt(params.surveyId, 10);

  return (
    <AdminLayout>
      <AdminSurveyDetail surveyId={surveyId} />
    </AdminLayout>
  )
}