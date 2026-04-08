import React from 'react';
import SurveyList from '@/components/consumer/surveys/SurveyList';

export const metadata = {
  title: 'Encuestas disponibles',
  description: 'Responde encuestas y gana recompensas',
};

export default function SurveysPage() {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        <SurveyList />
      </main>
      
    </div>
  );
}