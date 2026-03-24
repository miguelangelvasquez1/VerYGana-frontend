import React from 'react';
import SurveyList from '@/components/consumer/surveys/SurveyList';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Encuestas disponibles',
  description: 'Responde encuestas y gana recompensas',
};

export default function SurveysPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <SurveyList />
      </main>

      <Footer />
    </div>
  );
}