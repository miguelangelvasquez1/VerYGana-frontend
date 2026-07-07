'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, X, Zap, Rocket, Star, ArrowRight, Sparkles,
  Shield, Package, Megaphone, Gamepad2,
  PawPrint, ClipboardList, BadgePercent, Loader2,
  AlertCircle, ArrowLeft
} from 'lucide-react';
import { initiatePayment } from '@/services/planService';
import { PlanCode, PlanPaymentRequestDTO } from '@/types/finance/plans/Plan.types';
import { WompiCheckoutResponseDTO } from '@/types/finance/wompi/Wompi.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_RANGES = {
  [PlanCode.STANDARD]: { min: 1_000_000, max: 9_999_999, label: '$1.000.000 – $9.999.999 COP' },
  [PlanCode.PREMIUM]:  { min: 10_000_000, max: null,      label: 'Mínimo $10.000.000 COP' },
};

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const parseCOP = (raw: string) => parseInt(raw.replace(/\D/g, ''), 10) || 0;

const formatInput = (raw: string) => {
  const num = parseCOP(raw);
  if (!num) return '';
  return new Intl.NumberFormat('es-CO').format(num);
};

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
  { label: 'Venta de productos',       icon: <Package className="w-4 h-4" />,      basic: 'comisión 15%',  standard: 'comisión 10%',  premium: 'comisión 5%' },
  { label: 'Pago con llaves',          icon: <BadgePercent className="w-4 h-4" />,  basic: 'hasta 20%',     standard: 'hasta 35%',     premium: 'hasta 50%' },
  { label: 'Juegos branded',           icon: <Gamepad2 className="w-4 h-4" />,      basic: false,           standard: true,            premium: true },
  { label: 'Publicar anuncios',        icon: <Megaphone className="w-4 h-4" />,     basic: false,           standard: true,            premium: true },
  { label: 'Encuestas personalizadas', icon: <ClipboardList className="w-4 h-4" />, basic: false,           standard: true,            premium: true },
  { label: 'Sección de mascotas',      icon: <PawPrint className="w-4 h-4" />,      basic: false,           standard: false,           premium: true },
  { label: 'Soporte prioritario',      icon: <Shield className="w-4 h-4" />,        basic: false,           standard: false,           premium: true },
];

const plans = [
  {
    key: PlanCode.BASIC,
    name: 'Personal',
    price: '200.000',
    unit: 'COP / mes',
    billing: 'cobro mensual',
    description: 'Para empezar a vender sin complicaciones',
    icon: <Star className="w-8 h-8" />,
    cta: 'Comenzar ahora',
    highlight: false,
    featuresLabel: 'Incluye:',
  },
  {
    key: PlanCode.STANDARD,
    name: 'Estándar',
    price: '1.000.000',
    unit: 'COP mín.',
    billing: 'inversión única',
    description: 'Escala tu marca con anuncios y juegos',
    icon: <Zap className="w-8 h-8" />,
    cta: 'Activar plan',
    highlight: true,
    featuresLabel: 'Todo lo de Personal, más:',
  },
  {
    key: PlanCode.PREMIUM,
    name: 'Premium',
    price: '10.000.000',
    unit: 'COP mín.',
    billing: 'inversión única',
    description: 'Máxima visibilidad y alcance total',
    icon: <Rocket className="w-8 h-8" />,
    cta: 'Ir a Premium',
    highlight: false,
    featuresLabel: 'Todo lo de Estándar, más:',
  },
];

// ─── Deposit Modal ────────────────────────────────────────────────────────────

interface DepositModalProps {
  plan: typeof plans[number];
  onConfirm: (amountCents: number) => void;
  onClose: () => void;
  loading: boolean;
}

function DepositModal({ plan, onConfirm, onClose, loading }: DepositModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const range = PLAN_RANGES[plan.key as keyof typeof PLAN_RANGES];
  const amount = parseCOP(inputValue);

  const validate = () => {
    if (!amount) return 'Ingresa un monto';
    if (amount < range.min) return `El monto mínimo es ${formatCOP(range.min)}`;
    if (range.max && amount > range.max) return `El monto máximo es ${formatCOP(range.max)}`;
    return '';
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onConfirm(amount * 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(formatInput(e.target.value));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#13151f] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            plan.key === PlanCode.PREMIUM ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Plan {plan.name}</h3>
            <p className="text-slate-400 text-sm">{range.label}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">¿Cuánto quieres invertir?</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder={`Ej: ${plan.key === PlanCode.STANDARD ? '2.500.000' : '15.000.000'}`}
              className={`w-full bg-white/5 border rounded-xl py-3 pl-8 pr-16 text-white text-lg font-bold
                placeholder:text-slate-600 outline-none transition-all
                ${error ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-blue-500/60'}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">COP</span>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-red-400 text-sm mt-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
          {amount > 0 && !error && (
            <p className="text-slate-400 text-sm mt-2">
              Depositas: <span className="text-white font-semibold">{formatCOP(amount)}</span>
            </p>
          )}
        </div>

        <div className="bg-white/3 border border-white/6 rounded-xl p-3 mb-4">
          <p className="text-slate-400 text-sm leading-relaxed">
            Este monto se acreditará en tu presupuesto publicitario. La comisión por venta es del{' '}
            <strong className="text-white">{plan.key === PlanCode.STANDARD ? '10%' : '5%'}</strong>.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
            ${plan.key === PlanCode.PREMIUM
              ? 'bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white'
              : 'bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white'
            }`}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando checkout...</>
            : <>Ir a pagar <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Main Plans Page ──────────────────────────────────────────────────────────

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');
  const [modalPlan, setModalPlan] = useState<typeof plans[number] | null>(null);
  const [loading, setLoading] = useState<PlanCode | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handlePlanClick = useCallback(async (plan: typeof plans[number]) => {
    if (plan.key !== PlanCode.BASIC) {
      setModalPlan(plan);
      return;
    }
    setLoading(PlanCode.BASIC);
    try {
      const request: PlanPaymentRequestDTO = { planCode: PlanCode.BASIC, amountCents: 20_000_000 };
      const checkout: WompiCheckoutResponseDTO = await initiatePayment(request);
      sessionStorage.setItem('vg_payment_reference', checkout.reference);
      sessionStorage.setItem('vg_payment_plan', PlanCode.BASIC);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      console.error('Error iniciando pago:', err);
      setLoading(null);
    }
  }, []);

  const handleDepositConfirm = useCallback(async (amountCents: number) => {
    if (!modalPlan) return;
    const planKey = modalPlan.key;
    setLoading(planKey);
    try {
      const request: PlanPaymentRequestDTO = { planCode: planKey, amountCents };
      const checkout: WompiCheckoutResponseDTO = await initiatePayment(request);
      sessionStorage.setItem('vg_payment_reference', checkout.reference);
      sessionStorage.setItem('vg_payment_plan', planKey);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      console.error('Error iniciando pago:', err);
      setLoading(null);
      setModalPlan(null);
    }
  }, [modalPlan]);

  return (
    <div className="h-screen overflow-hidden bg-[#111318] text-white font-sans flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[15%] w-125 h-125 rounded-full bg-blue-700/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-100 h-100 rounded-full bg-purple-700/8 blur-[120px]" />
      </div>

      {/* Back button — fixed top left */}
      <div className="relative px-6 pt-5 pb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      <div
        className="relative flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto px-6"
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-400 mb-2 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Escoge el plan que impulse tu negocio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
            <span className="text-white">Planes y </span>
            <span className="bg-linear-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Precios</span>
          </h1>
          <p className="text-slate-400 text-xs max-w-md mx-auto mt-1.5">
            Desde tu primera venta hasta escalar con anuncios y experiencias gamificadas.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1">
            {(['cards', 'table'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}>
                {tab === 'cards' ? 'Vista tarjetas' : 'Comparar planes'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards view ── */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            {plans.map((plan, i) => {
              const planFeatures = features.filter(f => {
                const val = f[plan.key.toLowerCase() as keyof typeof f];
                return val !== false;
              });

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border overflow-hidden transition-all duration-300
                    ${plan.highlight
                      ? 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.10)]'
                      : 'border-white/10 hover:border-white/20'
                    }`}
                  style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 via-purple-500 to-blue-500" />
                  )}

                  {/* Top section */}
                  <div className={`p-4 ${plan.highlight ? 'bg-[#161a2e]' : 'bg-[#16181f]'}`}>
                    {plan.highlight && (
                      <div className="inline-flex items-center bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2">
                        MÁS POPULAR
                      </div>
                    )}

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      plan.highlight ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-slate-300'
                    }`}>
                      {plan.icon}
                    </div>

                    <h2 className="text-sm font-bold text-white leading-tight">{plan.name}</h2>
                    <p className="text-slate-400 text-xs mb-3">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-2xl font-black text-white">${plan.price}</span>
                      <span className="text-slate-400 text-xs font-medium ml-1.5">{plan.unit}</span>
                      <span className="text-slate-600 text-xs ml-1">· {plan.billing}</span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handlePlanClick(plan)}
                      disabled={loading === plan.key}
                      className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2
                        transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                        ${plan.highlight
                          ? 'bg-white text-slate-900 hover:bg-slate-100'
                          : 'bg-white/8 hover:bg-white/14 text-white border border-white/15'
                        }`}
                    >
                      {loading === plan.key
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                        : <>{plan.cta} <ArrowRight className="w-3.5 h-3.5" /></>
                      }
                    </button>
                  </div>

                  {/* Features section */}
                  <div className="px-4 py-3 bg-[#13151b] border-t border-white/6">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-2">
                      {plan.featuresLabel}
                    </p>
                    <ul className="space-y-1.5">
                      {planFeatures.map(f => {
                        const val = f[plan.key.toLowerCase() as keyof typeof f] as string | boolean;
                        return (
                          <li key={f.label} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                            <span>
                              {f.label}
                              {typeof val === 'string' && (
                                <span className="text-slate-500 ml-1">({val})</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table view ── */}
        {activeTab === 'table' && (
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/2">
                  <th className="text-left px-5 py-4 text-slate-400 font-medium text-sm w-[38%]">Funcionalidad</th>
                  {plans.map(p => (
                    <th key={p.key} className={`px-5 py-4 text-center ${p.highlight ? 'bg-blue-600/8' : ''}`}>
                      <div className="font-bold text-white text-base">{p.name}</div>
                      <div className={`text-sm font-black mt-0.5 ${p.highlight ? 'text-blue-400' : 'text-slate-400'}`}>
                        ${p.price}
                      </div>
                      <div className="text-xs text-slate-500">{p.unit}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <tr key={row.label}
                    className={`border-b border-white/6 transition-colors hover:bg-white/2 ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                    <td className="px-5 py-3 text-slate-300">
                      <div className="flex items-center gap-2.5 text-sm">
                        <span className="text-slate-500">{row.icon}</span>
                        {row.label}
                      </div>
                    </td>
                    {(['basic', 'standard', 'premium'] as const).map((key, ci) => {
                      const val = row[key];
                      return (
                        <td key={key} className={`px-5 py-3 text-center ${ci === 1 ? 'bg-blue-600/5' : ''}`}>
                          {val === true
                            ? <Check className="w-4 h-4 text-emerald-500 mx-auto" strokeWidth={2.5} />
                            : val === false
                              ? <X className="w-4 h-4 text-slate-600 mx-auto" strokeWidth={2} />
                              : <span className="text-sm text-slate-300 font-medium">{val as string}</span>
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-white/2">
                  <td className="px-5 py-4" />
                  {plans.map((p, ci) => (
                    <td key={p.key} className={`px-5 py-4 text-center ${ci === 1 ? 'bg-blue-600/5' : ''}`}>
                      <button
                        onClick={() => handlePlanClick(p)}
                        disabled={loading === p.key}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95
                          cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                          ${p.highlight
                            ? 'bg-white text-slate-900 hover:bg-slate-100'
                            : 'bg-white/8 hover:bg-white/15 text-white border border-white/15'
                          }`}
                      >
                        {loading === p.key ? 'Procesando...' : p.cta}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-3">
          Los planes Estándar y Premium se activan por inversión, no son suscripciones recurrentes.
        </p>
      </div>

      {/* Deposit Modal */}
      {modalPlan && (
        <DepositModal
          plan={modalPlan}
          onConfirm={handleDepositConfirm}
          onClose={() => { setModalPlan(null); setLoading(null); }}
          loading={loading === modalPlan.key}
        />
      )}
    </div>
  );
}
