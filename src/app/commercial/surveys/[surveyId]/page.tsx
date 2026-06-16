'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import SurveyResponsesPage from '@/components/commercial/surveys/surveyResponses/SurveyResponsesPage';
import { useCommercialSurveyDetail } from '@/hooks/surveys/useCommercialSurvey';

export default function SurveyResponsesRoute() {
  const params   = useParams<{ surveyId: string }>();
  const router   = useRouter();
  const surveyId = parseInt(params.surveyId, 10);

  // Fetch the survey title for the header — uses the existing detail cache
  const { data: survey } = useCommercialSurveyDetail(surveyId);

  return (
      <SurveyResponsesPage
        surveyId={surveyId}
        surveyTitle={survey?.title ?? '…'}
        onBack={() => router.push('/commercial/surveys')}
      />
  );
}