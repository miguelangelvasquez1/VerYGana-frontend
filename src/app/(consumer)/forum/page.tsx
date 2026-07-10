'use client';

import React from 'react';
import { Users, Gift, Award, Eye, Heart, Loader2, AlertCircle } from 'lucide-react';
import CharityPost from '@/components/consumer/forum/CharityPost';
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
      icon: <Users className="w-7 h-7 text-yellow-300" />,
      value: totalBeneficiaries.toLocaleString('es-CO'),
      label: 'Personas Beneficiadas',
    },
    {
      icon: <Gift className="w-7 h-7 text-yellow-300" />,
      value: totalStories.toString(),
      label: 'Proyectos Completados',
    },
    {
      icon: <Award className="w-7 h-7 text-yellow-300" />,
      value: new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
      }).format(totalAmount),
      label: 'Inversión Total',
    },
    {
      icon: <Eye className="w-7 h-7 text-yellow-300" />,
      value: stories.length.toString(),
      label: 'Historias este mes',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb]">

      {/* ── Hero header ── */}
      <section className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #0b1440 0%, #03548C 50%, #0b1440 100%)' }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              ❤️ Comunidad VerYGana
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              Historias de <span className="text-yellow-300">Impacto</span>
            </h1>
            <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto">
              Conoce las historias de nuestros ganadores y descubre cómo cada contribución
              transforma vidas y construye un futuro mejor para nuestra comunidad.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-5"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  {card.icon}
                  <span className="text-xl sm:text-2xl font-bold">{card.value}</span>
                </div>
                <p className="text-white/60 text-xs sm:text-sm">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Info banner */}
        <div className="bg-[#03548C]/5 border border-[#03548C]/15 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-linear-to-r from-[#0b1440] to-[#03548C] rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#0b1440] text-lg">Centro de Historias de Impacto</h3>
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
            <Loader2 className="w-8 h-8 animate-spin text-[#03548C]" />
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
            <div className="w-16 h-16 bg-linear-to-r from-[#0b1440] to-[#03548C] rounded-full flex items-center justify-center mx-auto mb-4">
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
    </div>
  );
}
