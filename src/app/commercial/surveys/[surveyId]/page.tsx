'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import SurveyResponsesPage from '@/components/commercial/surveys/surveyResponses/SurveyResponsesPage';
import { useAdminSurveyDetail } from '@/hooks/surveys/useCommercialSurvey';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';

export default function SurveyResponsesRoute() {
  const params   = useParams<{ surveyId: string }>();
  const router   = useRouter();
  const surveyId = parseInt(params.surveyId, 10);

  // Fetch the survey title for the header — uses the existing detail cache
  const { data: survey } = useAdminSurveyDetail(surveyId);

  return (
    <DashboardLayout title="Mis Encuestas">
      <SurveyResponsesPage
        surveyId={surveyId}
        surveyTitle={survey?.title ?? '…'}
        onBack={() => router.push('/commercial/surveys')}
      />
    </DashboardLayout>
  );
}