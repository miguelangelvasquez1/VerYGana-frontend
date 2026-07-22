import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, PhoneCall, X } from "lucide-react";
import type { OnboardingPlanCatalog, OnboardingPlanOption } from "@/services/commercial/OnboardingService";
import type { PlanCode } from "@/types/finance/plans/Plan.types";
import { formatCOP, StepButton } from "../onboarding.shared";

interface Props {
  catalog: OnboardingPlanCatalog | null;
  selectedPlanCode: PlanCode | null;
  onSelectPlan: (planCode: PlanCode) => void;
  submitting: boolean;
  onAccept: (investmentAmountCents?: number, contractDurationMonths?: number) => void;
}

function formatMoneyOrNA(cents: number | null): string {
  return cents == null ? "No aplica" : formatCOP(cents);
}

// El input de monto de inversión se escribe en pesos (no centavos) y se
// muestra con separador de miles ("1.500.000") para que se lea el monto de
// un vistazo — se guarda ya formateado y se vuelve a parsear al enviar.
function parseCOPInput(raw: string): number {
  return parseInt(raw.replace(/\D/g, ""), 10) || 0;
}

function formatCOPInput(raw: string): string {
  const num = parseCOPInput(raw);
  return num ? new Intl.NumberFormat("es-CO").format(num) : "";
}

// -1 = ilimitado, según el contrato del backend.
function formatLimit(n: number): string {
  return n === -1 ? "Ilimitado" : n.toLocaleString("es-CO");
}

function formatPct(n: number): string {
  return `${Number(n)}%`;
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
  ) : (
    <X className="w-4 h-4 text-gray-300 mx-auto" />
  );
}

interface MetricRow {
  label: string;
  render: (plan: OnboardingPlanOption) => React.ReactNode;
}

interface MetricGroup {
  title: string;
  rows: MetricRow[];
}

const METRIC_GROUPS: MetricGroup[] = [
  {
    title: "Condiciones económicas",
    rows: [
      { label: "Tarifa mensual", render: (p) => formatMoneyOrNA(p.monthlyFeeCents) },
      { label: "Inversión mínima", render: (p) => formatMoneyOrNA(p.minInvestmentCents) },
      { label: "Inversión máxima", render: (p) => formatMoneyOrNA(p.maxInvestmentCents) },
      { label: "Comisión por venta", render: (p) => formatPct(p.saleCommissionPct) },
      { label: "Máximo % de llaves promocionales", render: (p) => formatLimit(p.maxKeysPct) + (p.maxKeysPct !== -1 ? "%" : "") },
    ],
  },
  {
    title: "Funcionalidades",
    rows: [
      { label: "Publicidad", render: (p) => <BoolCell value={p.canAdvertise} /> },
      { label: "Juegos de marca", render: (p) => <BoolCell value={p.canUseGames} /> },
      { label: "Encuestas", render: (p) => <BoolCell value={p.canUseSurveys} /> },
      { label: "Mascotas", render: (p) => <BoolCell value={p.canHavePets} /> },
    ],
  },
  {
    title: "Límites",
    rows: [
      { label: "Productos", render: (p) => formatLimit(p.maxProducts) },
      { label: "Anuncios", render: (p) => formatLimit(p.maxAds) },
      { label: "Juegos de marca", render: (p) => formatLimit(p.maxBrandedGames) },
      { label: "Encuestas", render: (p) => formatLimit(p.maxSurveys) },
    ],
  },
  {
    title: "Visibilidad",
    rows: [
      { label: "Aumento de visibilidad", render: (p) => formatPct(p.visibilityBoostPct) },
    ],
  },
];

export function PlanStep({ catalog, selectedPlanCode, onSelectPlan, submitting, onAccept }: Props) {
  const [investmentInput, setInvestmentInput] = useState("");
  const [durationInput, setDurationInput] = useState("");

  // El monto de inversión y la duración dependen del plan elegido — si cambia
  // el plan, los valores anteriores ya no aplican.
  useEffect(() => {
    setInvestmentInput("");
    setDurationInput("");
  }, [selectedPlanCode]);

  if (!catalog) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  const selectedPlan = catalog.plans.find((p) => p.planCode === selectedPlanCode);
  const isBasic = selectedPlan?.planCode === "BASIC";
  const requiresInvestment = !!selectedPlan && !isBasic;

  const minCOP = selectedPlan?.minInvestmentCents != null ? selectedPlan.minInvestmentCents / 100 : null;
  const maxCOP = selectedPlan?.maxInvestmentCents != null ? selectedPlan.maxInvestmentCents / 100 : null;
  const investmentCOPValue = investmentInput ? parseCOPInput(investmentInput) : null;
  const investmentInRange =
    investmentCOPValue != null &&
    (minCOP == null || investmentCOPValue >= minCOP) &&
    (maxCOP == null || investmentCOPValue <= maxCOP);

  const durationMonths = durationInput ? parseInt(durationInput, 10) : null;
  const durationValid = durationMonths != null && durationMonths > 0;

  const canAccept =
    !!selectedPlan && (!requiresInvestment || investmentInRange) && (!isBasic || durationValid);

  const handleAcceptClick = () => {
    if (!selectedPlan) return;
    const investmentAmountCents = requiresInvestment && investmentCOPValue != null
      ? Math.round(investmentCOPValue * 100)
      : undefined;
    const contractDurationMonths = isBasic && durationMonths != null ? durationMonths : undefined;
    onAccept(investmentAmountCents, contractDurationMonths);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Elige tu plan</h3>
        <p className="text-sm text-gray-500">
          Con base en tu ruta comercial te recomendamos un plan, pero puedes elegir cualquiera de los tres.
        </p>
      </div>

      {catalog.requiresAdvisorContact && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <PhoneCall className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Por tu ruta comercial, un asesor de VerYGana se pondrá en contacto contigo para
            confirmar las condiciones finales, sin importar el plan que elijas. Puedes continuar
            de todas formas.
          </p>
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-separate border-spacing-0 text-sm min-w-[560px]">
          <thead>
            <tr>
              <th className="w-1/4" />
              {catalog.plans.map((plan) => {
                const isSelected = plan.planCode === selectedPlanCode;
                return (
                  <th key={plan.planCode} className="pb-3 px-2 align-bottom">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(plan.planCode)}
                      className={`w-full flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition ${
                        isSelected
                          ? "border-[#03548C] bg-[#03548C]/5"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {plan.recommended && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#03548C] bg-[#03548C]/10 px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-900">{plan.planName}</span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#03548C]" : "border-gray-300"
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#03548C]" />}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {METRIC_GROUPS.map((group) => (
              <React.Fragment key={group.title}>
                <tr>
                  <td colSpan={catalog.plans.length + 1} className="pt-4 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      {group.title}
                    </span>
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2 pr-3 text-sm text-gray-600 border-t border-gray-100">{row.label}</td>
                    {catalog.plans.map((plan) => {
                      const isSelected = plan.planCode === selectedPlanCode;
                      return (
                        <td
                          key={plan.planCode}
                          className={`py-2 px-2 text-center text-sm font-semibold text-gray-900 border-t border-gray-100 ${
                            isSelected ? "bg-[#03548C]/5" : ""
                          }`}
                        >
                          {row.render(plan)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {requiresInvestment && selectedPlan && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monto de inversión <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={investmentInput}
              onChange={(e) => setInvestmentInput(formatCOPInput(e.target.value))}
              placeholder="0"
              className={`w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
                investmentInput && !investmentInRange
                  ? "border-red-400 focus:ring-red-300"
                  : "border-gray-200 focus:ring-[#03548C]/40 focus:border-[#03548C]"
              }`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Debe estar entre {formatCOP(selectedPlan.minInvestmentCents)} y {formatCOP(selectedPlan.maxInvestmentCents)}.
          </p>
          {investmentInput && !investmentInRange && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              El monto está fuera del rango permitido para este plan.
            </p>
          )}
        </div>
      )}

      {isBasic && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Duración del contrato (meses) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            placeholder="Ej. 12"
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
              durationInput && !durationValid
                ? "border-red-400 focus:ring-red-300"
                : "border-gray-200 focus:ring-[#03548C]/40 focus:border-[#03548C]"
            }`}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Cuántos meses durará el Contrato Marco con el plan Básico.
          </p>
          {durationInput && !durationValid && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Ingresa una duración válida, mayor a 0 meses.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Nota tributaria</p>
          <p className="text-sm text-gray-600 leading-relaxed">{catalog.taxNote}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            Condiciones de liquidación
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{catalog.liquidationConditions}</p>
        </div>
      </div>

      <StepButton
        submitting={submitting}
        disabled={!canAccept}
        onClick={handleAcceptClick}
        label={selectedPlan ? `Aceptar plan ${selectedPlan.planName}` : "Aceptar condiciones"}
      />
    </div>
  );
}
