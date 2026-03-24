'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import SurveyResponsesPage from '@/components/Admin/surveys/surveyResponses/SurveyResponsesPage';
import { useAdminSurveyDetail } from '@/hooks/surveys/useAdminSurvey';

export default function SurveyResponsesRoute() {
  const params   = useParams<{ surveyId: string }>();
  const router   = useRouter();
  const surveyId = parseInt(params.surveyId, 10);

  // Fetch the survey title for the header — uses the existing detail cache
  const { data: survey } = useAdminSurveyDetail(surveyId);

  return (
    <AdminLayout>
      <SurveyResponsesPage
        surveyId={surveyId}
        surveyTitle={survey?.title ?? '…'}
        onBack={() => router.push('/admin/surveys')}
      />
    </AdminLayout>
  );
}