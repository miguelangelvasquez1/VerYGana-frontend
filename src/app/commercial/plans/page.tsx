'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter} from 'next/navigation';
import {
  Check, X, Zap, Rocket, Star, ArrowRight, Sparkles,
  Shield, Package, Megaphone, Gamepad2,
  PawPrint, ClipboardList, BadgePercent, Loader2,
  AlertCircle
} from 'lucide-react';
import {initiatePayment} from '@/services/planService';
import { PlanCode, PlanPaymentRequestDTO} from '@/types/finance/plans/Plan.types';
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
  { label: 'Venta de productos',         icon: <Package className="w-4 h-4" />,     basic: 'comisión del 15%', standard: 'comisión del 10%', premium: 'comisión del 5%' },
  { label: 'Pago con llaves',            icon: <BadgePercent className="w-4 h-4" />, basic: 'hasta 20%',        standard: 'hasta 35%',        premium: 'hasta 50%' },
  { label: 'Juegos branded',             icon: <Gamepad2 className="w-4 h-4" />,     basic: false,              standard: true,               premium: true },
  { label: 'Publicar anuncios',          icon: <Megaphone className="w-4 h-4" />,    basic: false,              standard: true,               premium: true },
  { label: 'Encuestas personalizadas',   icon: <ClipboardList className="w-4 h-4" />,basic: false,              standard: true,               premium: true },
  { label: 'Sección de mascotas',        icon: <PawPrint className="w-4 h-4" />,     basic: false,              standard: false,              premium: true },
  { label: 'Soporte prioritario',        icon: <Shield className="w-4 h-4" />,       basic: false,              standard: false,              premium: true },
];

const plans = [
  { key: PlanCode.BASIC,    name: 'Personal',  price: '200.000',    unit: 'COP / MES',       description: 'Para empezar a vender sin complicaciones', icon: <Star className="w-7 h-7" />,   stars: 2, cta: 'Comenzar ahora', highlight: false, color: 'slate' },
  { key: PlanCode.STANDARD, name: 'Estándar',  price: '1.000.000',  unit: 'INVERSIÓN MÍN.',  description: 'Escala tu marca con anuncios y juegos',    icon: <Zap className="w-7 h-7" />,    stars: 3, cta: 'Activar plan',   highlight: true,  color: 'blue' },
  { key: PlanCode.PREMIUM,  name: 'Premium',   price: '10.000.000', unit: 'INVERSIÓN MÍN.',  description: 'Máxima visibilidad y alcance total',       icon: <Rocket className="w-7 h-7" />, stars: 5, cta: 'Ir a premium',   highlight: false, color: 'purple' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true)  return <Check className="w-5 h-5 text-emerald-500 mx-auto" strokeWidth={2.5} />;
  if (value === false) return <X    className="w-5 h-5 text-red-400/60 mx-auto"  strokeWidth={2.5} />;
  return <span className="text-sm font-semibold text-slate-300">{value}</span>;
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-1 justify-center mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5"
          fill={i < count ? '#f59e0b' : 'none'}
          stroke={i < count ? '#f59e0b' : '#475569'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

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
    // Convertir a centavos (×100)
    onConfirm(amount * 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(formatInput(e.target.value));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#13151f] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            plan.key === PlanCode.PREMIUM ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Plan {plan.name}</h3>
            <p className="text-slate-400 text-sm">{range.label}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">
            ¿Cuánto quieres invertir?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder={`Ej: ${plan.key === PlanCode.STANDARD ? '2.500.000' : '15.000.000'}`}
              className={`w-full bg-white/5 border rounded-xl py-3.5 pl-8 pr-16 text-white text-lg font-bold
                placeholder:text-slate-600 outline-none transition-all
                ${error ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-blue-500/60'}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">COP</span>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          {amount > 0 && !error && (
            <p className="text-slate-400 text-xs mt-2">
              Depositas: <span className="text-white font-semibold">{formatCOP(amount)}</span>
            </p>
          )}
        </div>

        {/* Info box */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-5">
          <p className="text-slate-400 text-xs leading-relaxed">
            Este monto se acreditará en tu presupuesto publicitario. Puedes recargar en cualquier momento.
            La comisión por venta es del <strong className="text-white">
              {plan.key === PlanCode.STANDARD ? '10%' : '5%'}
            </strong> sobre cada producto vendido.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
            ${plan.key === PlanCode.PREMIUM
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/20'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20'
            }`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando checkout...</>
          ) : (
            <>Ir a pagar <ArrowRight className="w-4 h-4" /></>
          )}
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
    // STANDARD y PREMIUM requieren monto → abrir modal
    if (plan.key !== PlanCode.BASIC) {
      setModalPlan(plan);
      return;
    }

    // BASIC → checkout directo, precio fijo ($200.000 = 20.000.000 centavos)
    setLoading(PlanCode.BASIC);
    try {
      const request: PlanPaymentRequestDTO = {
        planCode: PlanCode.BASIC,
        amountCents: 20_000_000,
      };
      const checkout: WompiCheckoutResponseDTO = await initiatePayment(request);
      // Guardar referencia para consultar estado después
      sessionStorage.setItem('vg_payment_reference', checkout.reference);
      sessionStorage.setItem('vg_payment_plan', PlanCode.BASIC);
      // Redirigir a Wompi
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
      const request: PlanPaymentRequestDTO = {
        planCode: planKey,       
        amountCents,
      };
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
    <div className="min-h-screen bg-[#0f1117] text-white font-sans">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue-700/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        {/* Header */}
        <div className="text-center mb-14" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-slate-400 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Escoge el plan que impulse tu negocio
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-4">
            <span className="text-white">Planes y </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Precios</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mt-3">
            Desde tu primera venta hasta escalar con anuncios y experiencias gamificadas.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 backdrop-blur-sm">
            {(['cards', 'table'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}>
                {tab === 'cards' ? 'Vista tarjetas' : 'Comparar planes'}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <div key={plan.key}
                className={`relative rounded-2xl p-6 lg:p-8 border transition-all duration-300
                  ${plan.highlight
                    ? 'bg-gradient-to-b from-blue-600/20 to-purple-600/10 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                  }`}
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    MÁS POPULAR
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  plan.highlight ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'
                }`}>{plan.icon}</div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-5">{plan.description}</p>

                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl lg:text-4xl font-black ${plan.highlight ? 'text-blue-400' : 'text-white'}`}>
                      ${plan.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium tracking-widest mt-0.5">{plan.unit}</p>
                </div>

                <StarRow count={plan.stars} />

                <ul className="mt-6 space-y-3 mb-8">
                  {features.map(f => {
                    const val = f[plan.key.toLowerCase() as keyof typeof f] as string | boolean;
                    if (val === false) return null;
                    return (
                      <li key={f.label} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span>{f.label}{typeof val === 'string' && <span className="ml-1 text-slate-400">({val})</span>}</span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={loading === plan.key}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                    transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                    ${plan.highlight
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                    }`}
                >
                  {loading === plan.key
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                    : <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-sm" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-5 text-slate-400 font-medium w-[40%]">Funcionalidad</th>
                  {plans.map(p => (
                    <th key={p.key} className={`p-5 text-center ${p.highlight ? 'bg-blue-600/10' : ''}`}>
                      <div className="font-bold text-white text-base">{p.name}</div>
                      <div className={`text-xs font-black mt-0.5 ${p.highlight ? 'text-blue-400' : 'text-slate-400'}`}>${p.price}</div>
                      <div className="text-[10px] text-slate-500 tracking-widest">{p.unit}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <tr key={row.label} className={`border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-500">{row.icon}</span>{row.label}
                      </div>
                    </td>
                    <td className="p-4 text-center"><FeatureValue value={row.basic} /></td>
                    <td className="p-4 text-center bg-blue-600/5"><FeatureValue value={row.standard} /></td>
                    <td className="p-4 text-center"><FeatureValue value={row.premium} /></td>
                  </tr>
                ))}
                <tr>
                  <td className="p-5" />
                  {plans.map(p => (
                    <td key={p.key} className={`p-5 text-center ${p.highlight ? 'bg-blue-600/5' : ''}`}>
                      <button
                        onClick={() => handlePlanClick(p)}
                        disabled={loading === p.key}
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95
                          disabled:opacity-60 disabled:cursor-not-allowed
                          ${p.highlight
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
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

        <p className="text-center text-slate-500 text-xs mt-10">
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