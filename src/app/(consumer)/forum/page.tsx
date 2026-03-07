'use client';

import React from 'react';
import { Users, Gift, Award, Eye, Heart, Loader2, AlertCircle } from 'lucide-react';
import CharityPost from '@/components/forum/CharityPost';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import { useImpactStoriesForConsumer } from '@/hooks/useImpactStory';

export default function ForumPage() {
  const { data, isLoading, isError, error } = useImpactStoriesForConsumer({ status: 'PUBLISHED', size: 20 });

  const stories = data?.content ?? [];
  const totalBeneficiaries = stories.reduce((sum, s) => sum + s.beneficiariesCount, 0);
  const totalAmount        = stories.reduce((sum, s) => sum + (s.investedAmount ?? 0), 0);
  const totalStories       = data?.totalElements ?? 0;

  // Derive a rough "views" proxy from totalElements until views field exists
  const statsCards = [
    {
      icon: <Users className="w-8 h-8 text-yellow-300" />,
      value: totalBeneficiaries.toLocaleString('es-CO'),
      label: 'Personas Beneficiadas',
    },
    {
      icon: <Gift className="w-8 h-8 text-yellow-300" />,
      value: totalStories.toString(),
      label: 'Proyectos Completados',
    },
    {
      icon: <Award className="w-8 h-8 text-yellow-300" />,
      value: new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
      }).format(totalAmount),
      label: 'Inversión Total',
    },
    {
      icon: <Eye className="w-8 h-8 text-yellow-300" />,
      value: stories.length.toString(),
      label: 'Historias este mes',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Hero header ── */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Historias de <span className="text-yellow-300">Impacto</span>
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Conoce las historias de nuestros ganadores y descubre cómo cada contribución
              transforma vidas y construye un futuro mejor para nuestra comunidad.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statsCards.map((card) => (
              <div
                key={card.label}
                className="bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-2">
                  {card.icon}
                  <span className="text-2xl font-bold">{card.value}</span>
                </div>
                <p className="text-purple-100">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Info banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Centro de Historias de Impacto</h3>
              <p className="text-gray-600">
                Descubre cómo nuestras iniciativas están transformando vidas en nuestra comunidad.
                Cada proyecto representa el compromiso de crear un mundo mejor.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stories list ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-sm">Cargando historias...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>No se pudieron cargar las historias. {(error as Error)?.message}</span>
          </div>
        )}

        {!isLoading && !isError && stories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No hay historias publicadas aún.</p>
            <p className="text-sm mt-1">¡Vuelve pronto para conocer nuestro impacto!</p>
          </div>
        )}

        {!isLoading && !isError && stories.length > 0 && (
          <div className="space-y-6">
            {stories.map((story) => (
              <CharityPost key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* Footer message */}
        {!isLoading && stories.length > 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ¡Continúa siguiendo nuestro impacto!
            </h3>
            <p className="text-gray-500">
              Estas son nuestras historias más recientes. Mantente conectado para conocer nuevos proyectos.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}