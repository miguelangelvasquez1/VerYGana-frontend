'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Gift,
  ClipboardList,
  MessageSquare,
  Package,
  Smartphone,
  Heart,
  Gamepad2,
  ChevronRight,
  Star,
  TrendingUp,
  Users,
  Zap,
  Award,
  ArrowRight,
  Coins,
  ShieldCheck,
  Globe,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  gradient: string;
  badge?: string;
}

interface StatProps {
  value: string;
  label: string;
  icon: React.ReactNode;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES: FeatureCardProps[] = [
  {
    icon: <Megaphone className="w-7 h-7" />,
    title: 'Anuncios',
    description: 'Ve anuncios de marcas locales y gana recompensas reales por tu atención.',
    href: '/ads',
    gradient: 'from-blue-500 to-cyan-500',
    badge: 'Gana ahora',
  },
  {
    icon: <Gift className="w-7 h-7" />,
    title: 'Rifas',
    description: 'Participa en rifas increíbles con premios en efectivo y productos exclusivos.',
    href: '/raffles',
    gradient: 'from-amber-400 to-orange-500',
    badge: 'En vivo',
  },
  {
    icon: <Gamepad2 className="w-7 h-7" />,
    title: 'Juegos',
    description: 'Juega, compite y acumula puntos canjeables por premios reales.',
    href: '/games',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: <Package className="w-7 h-7" />,
    title: 'Productos',
    description: 'Descubre productos locales y paga con tu saldo ganado en la plataforma.',
    href: '/products',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: 'Recargas',
    description: 'Recarga tu celular usando el saldo que has ganado. Rápido y seguro.',
    href: '/plans/mobile-plans',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: <Heart className="w-7 h-7" />,
    title: 'Favoritos',
    description: 'Guarda tus productos, rifas y anuncios favoritos en un solo lugar.',
    href: '/explore/favorites',
    gradient: 'from-red-400 to-rose-500',
  },
];

const STATS: StatProps[] = [
  { value: '50K+', label: 'Usuarios activos', icon: <Users className="w-5 h-5" /> },
  { value: '$2.3M', label: 'Recompensas pagadas', icon: <Coins className="w-5 h-5" /> },
  { value: '1,200+', label: 'Rifas completadas', icon: <Gift className="w-5 h-5" /> },
  { value: '4.9★', label: 'Calificación', icon: <Star className="w-5 h-5" /> },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Regístrate gratis',
    desc: 'Crea tu cuenta en minutos y obtén un bono de bienvenida.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    step: '02',
    title: 'Participa y gana',
    desc: 'Ve anuncios, responde encuestas, juega y acumula saldo real.',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    step: '03',
    title: 'Canjea tus ganancias',
    desc: 'Usa tu saldo en recargas, productos, rifas o retíralo.',
    color: 'text-amber-600 bg-amber-50',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [animateHero, setAnimateHero] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateHero(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-24 lg:pb-0">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#003d80] via-[#0060b8] to-[#0089d6]">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-cyan-400/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left copy */}
            <div
              className={`flex-1 text-white transition-all duration-700 ${
                animateHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                La plataforma que te paga por tu tiempo
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-5">
                Gana dinero real<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                  haciendo lo que ya haces
                </span>
              </h1>

              <p className="text-blue-100 text-base lg:text-lg leading-relaxed max-w-xl mb-8">
                Ve anuncios, responde encuestas, juega y participa en rifas.
                Acumula saldo real y canjéalo cuando quieras.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/ads">
                  <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-all">
                    Empezar a ganar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/explore/profile">
                  <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-full transition-all">
                    Ver mi perfil
                  </button>
                </Link>
              </div>
            </div>

            {/* Right stats cards */}
            <div
              className={`flex-shrink-0 w-full lg:w-80 transition-all duration-700 delay-200 ${
                animateHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="grid grid-cols-2 gap-3">
                {STATS.map(({ value, label, icon }) => (
                  <div
                    key={label}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
                  >
                    <div className="flex items-center gap-2 text-blue-200 mb-2">
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                    <div className="text-2xl font-extrabold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE GRID
        ══════════════════════════════════════════════════════════════════ */}
        <section className="pt-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">¿Qué puedes hacer?</h2>
              <p className="text-sm text-gray-500 mt-1">Todo en un solo lugar, todo te da recompensas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            ENCUESTAS — highlight banner
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-6 lg:p-10">
            {/* bg decoration */}
            <div className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10">
              <div className="flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>

              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <Award className="w-3 h-3" /> Recompensas garantizadas
                </div>
                <h2 className="text-xl lg:text-3xl font-extrabold mb-2">
                  Responde encuestas y <span className="text-yellow-300">gana saldo real</span>
                </h2>
                <p className="text-indigo-100 text-sm lg:text-base max-w-xl">
                  Comparte tu opinión sobre productos y servicios. Cada encuesta completada
                  acredita puntos directamente en tu billetera. Sin condiciones, sin esperas.
                </p>
              </div>

              <Link href="/surveys" className="shrink-0">
                <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-all whitespace-nowrap cursor-pointer">
                  Ver encuestas
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-6">
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">¿Cómo funciona?</h2>
            <p className="text-sm text-gray-500 mt-1">Tres pasos para empezar a ganar</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map(({ step, title, desc, color }) => (
              <div
                key={step}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start"
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${color}`}>
                  {step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FORO — highlight banner
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 to-emerald-600 p-6 lg:p-10">
            <div className="pointer-events-none absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-white/10" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10">
              <div className="flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>

              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <Globe className="w-3 h-3" /> Comunidad activa
                </div>
                <h2 className="text-xl lg:text-3xl font-extrabold mb-2">
                  Únete a la <span className="text-yellow-300">conversación</span>
                </h2>
                <p className="text-teal-50 text-sm lg:text-base max-w-xl">
                  Comparte experiencias, haz preguntas, descubre trucos para ganar más
                  y conecta con miles de usuarios como tú en nuestro foro comunitario.
                </p>
              </div>

              <Link href="/forum" className="shrink-0">
                <button className="flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 font-bold px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-all whitespace-nowrap cursor-pointer">
                  Ir al foro
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            TRUST BADGES
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-6 pb-10">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
            <h2 className="text-center text-xl font-extrabold text-gray-900 mb-6">
              ¿Por qué elegir nuestra plataforma?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
                  title: '100% seguro',
                  desc: 'Tus datos y ganancias están protegidos con los más altos estándares de seguridad.',
                  bg: 'bg-blue-50',
                },
                {
                  icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
                  title: 'Pagos garantizados',
                  desc: 'Las recompensas se acreditan automáticamente. Sin demoras, sin excusas.',
                  bg: 'bg-emerald-50',
                },
                {
                  icon: <Users className="w-6 h-6 text-violet-600" />,
                  title: 'Comunidad real',
                  desc: 'Más de 50,000 colombianos ya ganan dinero extra con nosotros cada mes.',
                  bg: 'bg-violet-50',
                },
              ].map(({ icon, title, desc, bg }) => (
                <div key={title} className={`${bg} rounded-2xl p-5 text-center`}>
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                    {icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

// ─── FeatureCard ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, href, gradient, badge }: FeatureCardProps) {
  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {badge && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {badge}
          </span>
        )}

        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>

        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed flex-1 hidden sm:block">{description}</p>

        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Ir <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}