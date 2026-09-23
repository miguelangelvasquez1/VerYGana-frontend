import React, { useEffect } from "react";
import { Check, X } from "lucide-react";
import type { PlanCatalogOption } from "@/types/finance/plans/PlanCatalog.types";
import { DUAL_COMMISSION_NOTE, formatCOP, planCommissions } from "./onboarding.shared";

// ── Helpers ──────────────────────────────────────────────────────────────────

// GET /plans/catalog hoy serializa algunos porcentajes (visibilityBoostPct)
// como { source, parsedValue } en vez de número — se aceptan ambas formas.
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "parsedValue" in v) return Number((v as { parsedValue: unknown }).parsedValue) || 0;
  return Number(v) || 0;
}

// -1 = ilimitado según el contrato del backend.
function formatLimit(n: number): string {
  return n === -1 ? "Ilimitado" : n.toLocaleString("es-CO");
}

// Resumen de la cuota o la inversión del plan — lo único económico que
// muestran las cards; el resto vive en el modal.
export function planPriceSummary(plan: PlanCatalogOption): { label: string; value: string } | null {
  if (plan.monthlyFeeCents != null && plan.monthlyFeeCents > 0) {
    return { label: "Cuota mensual", value: formatCOP(plan.monthlyFeeCents) };
  }
  if (plan.minInvestmentCents != null && plan.minInvestmentCents > 0) {
    return {
      label: "Inversión",
      value:
        plan.maxInvestmentCents != null && plan.maxInvestmentCents > 0
          ? `${formatCOP(plan.minInvestmentCents)} – ${formatCOP(plan.maxInvestmentCents)}`
          : `Desde ${formatCOP(plan.minInvestmentCents)}`,
    };
  }
  return null;
}

interface DetailRow {
  label: string;
  value: React.ReactNode;
}

function BoolValue({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-600">
      <Check className="w-4 h-4" /> Incluido
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-gray-400">
      <X className="w-4 h-4" /> No incluido
    </span>
  );
}

// Los valores numéricos en 0 no aplican al plan y se omiten; los booleanos se
// muestran siempre (incluido / no incluido) para que la comparación sea clara.
function buildSections(plan: PlanCatalogOption): { title: string; rows: DetailRow[] }[] {
  const economic: DetailRow[] = [];
  const price = planPriceSummary(plan);
  if (price) economic.push(price);

  const { sale, services, dual } = planCommissions(plan);
  if (sale != null) economic.push({ label: dual ? "Comisión por venta de productos" : "Comisión por venta", value: `${sale}%` });
  if (services != null) economic.push({ label: "Comisión por venta de servicios", value: `${services}%` });

  if (plan.maxKeysPct !== 0) {
    economic.push({
      label: "Máx. % de llaves promocionales",
      value: plan.maxKeysPct === -1 ? "Sin límite" : `${plan.maxKeysPct}%`,
    });
  }

  const features: DetailRow[] = [
    { label: "Publicidad", value: <BoolValue value={plan.canAdvertise} /> },
    { label: "Juegos personalizados", value: <BoolValue value={plan.canUseGames} /> },
    { label: "Encuestas", value: <BoolValue value={plan.canUseSurveys} /> },
    { label: "Sección de mascotas", value: <BoolValue value={plan.canUsePets} /> },
  ];

  const limits: DetailRow[] = (
    [
      ["Productos", plan.maxProducts],
      ["Anuncios", plan.maxAds],
      ["Juegos personalizados", plan.maxBrandedGames],
      ["Encuestas", plan.maxSurveys],
    ] as const
  )
    .filter(([, n]) => n !== 0)
    .map(([label, n]) => ({ label, value: formatLimit(n) }));

  const boost = toNumber(plan.visibilityBoostPct);
  const visibility: DetailRow[] = boost !== 0 ? [{ label: "Aumento de visibilidad", value: `+${boost}%` }] : [];

  return [
    { title: "Condiciones económicas", rows: economic },
    { title: "Funcionalidades", rows: features },
    { title: "Límites", rows: limits },
    { title: "Visibilidad", rows: visibility },
  ].filter((s) => s.rows.length > 0);
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function PlanDetailModal({
  plan,
  modalityLabel,
  onClose,
}: {
  plan: PlanCatalogOption;
  modalityLabel: string;
  onClose: () => void;
}) {
  // Esc para cerrar y sin scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const sections = buildSections(plan);
  const { dual } = planCommissions(plan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl shadow-gray-900/30 ring-1 ring-black/5">
        <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#03548C]">{modalityLabel}</p>
            <h3 className="text-lg font-bold text-gray-900">Plan {plan.planName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {plan.description && <p className="text-sm text-gray-600 leading-relaxed">{plan.description}</p>}

          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{section.title}</p>
              <dl>
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0 text-sm"
                  >
                    <dt className="text-gray-500">{row.label}</dt>
                    <dd className="font-semibold text-gray-900 text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {section.title === "Condiciones económicas" && dual && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5 leading-relaxed">
                  {DUAL_COMMISSION_NOTE}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
