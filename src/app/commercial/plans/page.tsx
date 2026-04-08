'use client';

import React, { useEffect, useState } from 'react';
import {
  Check, X, Zap, Rocket, Star, ArrowRight, Sparkles,
  TrendingUp, Shield, Package, Megaphone, Gamepad2,
  PawPrint, ClipboardList, BadgePercent
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanFeatureRow {
  label: string;
  icon: React.ReactNode;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const features: PlanFeatureRow[] = [
  {
    label: 'Venta de productos',
    icon: <Package className="w-4 h-4" />,
    basic: true,
    standard: true,
    premium: true,
  },
  {
    label: 'Pago con llaves por usuarios',
    icon: <BadgePercent className="w-4 h-4" />,
    basic: '20%',
    standard: '40%',
    premium: '50%',
  },
  {
    label: 'Juegos branded con tu marca',
    icon: <Gamepad2 className="w-4 h-4" />,
    basic: false,
    standard: true,
    premium: true,
  },
  {
    label: 'Publicar anuncios',
    icon: <Megaphone className="w-4 h-4" />,
    basic: false,
    standard: true,
    premium: true,
  },
  {
    label: 'Encuestas personalizadas',
    icon: <ClipboardList className="w-4 h-4" />,
    basic: false,
    standard: true,
    premium: true,
  },
  {
    label: 'Comisión tras recuperar 6x inversión',
    icon: <TrendingUp className="w-4 h-4" />,
    basic: false,
    standard: '10% por venta',
    premium: '10% por venta',
  },
  {
    label: 'Sección de mascotas',
    icon: <PawPrint className="w-4 h-4" />,
    basic: false,
    standard: false,
    premium: true,
  },
  {
    label: 'Soporte prioritario',
    icon: <Shield className="w-4 h-4" />,
    basic: false,
    standard: false,
    premium: true,
  },
];

const plans = [
  {
    key: 'basic',
    name: 'Personal',
    price: '200.000',
    unit: 'COP / MES',
    description: 'Para empezar a vender sin complicaciones',
    color: 'basic',
    icon: <Star className="w-8 h-8" />,
    stars: 2,
    cta: 'Comenzar ahora',
    highlight: false,
  },
  {
    key: 'standard',
    name: 'Estándar',
    price: '1.000.000',
    unit: 'INVERSIÓN MÍNIMA',
    description: 'Escala tu marca con anuncios y juegos',
    color: 'standard',
    icon: <Zap className="w-8 h-8" />,
    stars: 3,
    cta: 'Activar plan',
    highlight: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '10.000.000',
    unit: 'INVERSIÓN MÍNIMA',
    description: 'Máxima visibilidad y alcance total',
    color: 'premium',
    icon: <Rocket className="w-8 h-8" />,
    stars: 5,
    cta: 'Ir a premium',
    highlight: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" strokeWidth={2.5} />;
  if (value === false) return <X className="w-5 h-5 text-red-400 mx-auto" strokeWidth={2.5} />;
  return <span className="text-sm font-semibold text-slate-700">{value}</span>;
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-1 justify-center mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-4 h-4"
          fill={i < count ? '#f59e0b' : 'none'}
          stroke={i < count ? '#f59e0b' : '#cbd5e1'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue-700/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-emerald-600/8 blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20">

        {/* ── Header ── */}
        <div className="text-center mb-14" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-slate-400 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Escoge el plan que impulse tu negocio
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-4">
            <span className="text-white">Planes y </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Precios
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mt-3">
            Desde tu primera venta hasta escalar con anuncios y experiencias gamificadas.
          </p>
        </div>

        {/* ── Tab toggle ── */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 backdrop-blur-sm">
            {(['cards', 'table'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'cards' ? 'Vista tarjetas' : 'Comparar planes'}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* ── CARDS VIEW ── */}
        {/* ══════════════════════════════════════════ */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => {
              const isHighlighted = plan.highlight;
              const isSelected = selected === plan.key;

              return (
                <div
                  key={plan.key}
                  onClick={() => setSelected(plan.key)}
                  className={`
                    relative rounded-2xl p-6 lg:p-8 cursor-pointer border transition-all duration-300
                    ${isHighlighted
                      ? 'bg-gradient-to-b from-blue-600/20 to-purple-600/10 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                    }
                    ${isSelected ? 'scale-[1.02] ring-2 ring-blue-500/60' : ''}
                  `}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? (isSelected ? 'scale(1.02)' : 'scale(1)') : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.3s ease`,
                  }}
                >
                  {/* Popular badge */}
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      MÁS POPULAR
                    </div>
                  )}

                  {/* Plan icon */}
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center mb-5
                    ${isHighlighted ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'}
                  `}>
                    {plan.icon}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-5">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl lg:text-4xl font-black ${
                        isHighlighted ? 'text-blue-400' : 'text-white'
                      }`}>
                        ${plan.price}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium tracking-widest mt-0.5">
                      {plan.unit}
                    </p>
                  </div>

                  {/* Stars */}
                  <StarRow count={plan.stars} />

                  {/* Feature list */}
                  <ul className="mt-6 space-y-3 mb-8">
                    {features.map((f) => {
                      const val = f[plan.key as keyof typeof f] as string | boolean;
                      if (val === false) return null;
                      return (
                        <li key={f.label} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <span className="mt-0.5 text-emerald-400 shrink-0">
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          </span>
                          <span>
                            {f.label}
                            {typeof val === 'string' && val !== 'true' && (
                              <span className="ml-1 text-slate-400">({val})</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <button className={`
                    w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                    transition-all duration-200 active:scale-95
                    ${isHighlighted
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                    }
                  `}>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* ── TABLE VIEW ── */}
        {/* ══════════════════════════════════════════ */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-sm" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-5 text-slate-400 font-medium w-[40%]">Funcionalidad</th>
                  {plans.map(p => (
                    <th key={p.key} className={`p-5 text-center ${p.highlight ? 'bg-blue-600/10' : ''}`}>
                      <div className="font-bold text-white text-base">{p.name}</div>
                      <div className={`text-xs font-black mt-0.5 ${p.highlight ? 'text-blue-400' : 'text-slate-400'}`}>
                        ${p.price}
                      </div>
                      <div className="text-[10px] text-slate-500 tracking-widest">{p.unit}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] ${
                      i % 2 === 0 ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-500">{row.icon}</span>
                        {row.label}
                      </div>
                    </td>
                    <td className="p-4 text-center"><FeatureValue value={row.basic} /></td>
                    <td className="p-4 text-center bg-blue-600/5"><FeatureValue value={row.standard} /></td>
                    <td className="p-4 text-center"><FeatureValue value={row.premium} /></td>
                  </tr>
                ))}
                {/* CTA row */}
                <tr>
                  <td className="p-5" />
                  {plans.map(p => (
                    <td key={p.key} className={`p-5 text-center ${p.highlight ? 'bg-blue-600/5' : ''}`}>
                      <button className={`
                        w-full py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95
                        ${p.highlight
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                        }
                      `}>
                        {p.cta}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer note ── */}
        <p className="text-center text-slate-500 text-xs mt-10">
          Los planes Estándar y Premium se activan por inversión, no son suscripciones recurrentes.
          La comisión del 10% aplica solo tras recuperar 6× tu inversión.
        </p>
      </div>
    </div>
  );
}