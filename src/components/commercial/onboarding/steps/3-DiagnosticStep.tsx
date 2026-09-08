import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  type ClassificationResult,
  type DiagnosticAnswers,
  type DiagnosticAnswerValue,
  type DiagnosticQuestion,
  type DiagnosticQuestionnaire,
  type DiagnosticQuestionOption,
  type SpecialIntegrationRequest,
  type TechIntegrationNeed,
} from "@/services/commercial/OnboardingService";
import { getPlanCatalog } from "@/services/planService";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import type { PlanCatalogOption, PlanCatalogResponseDTO } from "@/types/finance/plans/PlanCatalog.types";
import { FieldErrors, formatCOP, StepButton } from "../onboarding.shared";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Una respuesta cuenta como "respondida" si tiene contenido. `false` (BOOLEAN)
// sí cuenta; string vacío o array vacío no.
function hasAnswer(v: DiagnosticAnswerValue | undefined): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Evalúa `dependsOn`: la pregunta se muestra solo si la respuesta actual a la
// pregunta de la que depende está incluida en `values`.
function dependencyMet(value: DiagnosticAnswerValue | undefined, accepted: string[]): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.some((v) => accepted.includes(v));
  if (typeof value === "boolean") return accepted.includes(String(value));
  return accepted.includes(value);
}

type OpeningActionKind = "start" | "modalities" | "exit";

function classifyOpeningAction(action: string): OpeningActionKind {
  const a = action.toLowerCase();
  if (a.includes("modalidad")) return "modalities";
  if (a.includes("cancel") || a.includes("guardar") || a.includes("despu")) return "exit";
  return "start";
}

function planByCode(
  catalog: PlanCatalogResponseDTO | null,
  code: PlanCode
): PlanCatalogOption | undefined {
  return catalog?.plans.find((p) => p.planCode === code);
}

// Los valores se escriben en pesos; formatCOP recibe centavos.
function copFromPesos(pesos: number): string {
  return formatCOP(Math.round(pesos * 100));
}

function formatKeysPct(pct: number): string {
  return pct === -1 ? "Sin límite" : `${pct}%`;
}

function optionCls(selected: boolean, opts?: { error?: boolean; center?: boolean }): string {
  return `w-full py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition cursor-pointer ${
    opts?.center ? "text-center" : "text-left"
  } ${
    selected
      ? "border-blue-500 bg-blue-50 text-blue-700"
      : opts?.error
      ? "border-red-300 bg-red-50/40 text-gray-500 hover:border-gray-300"
      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
  }`;
}

function chipCls(selected: boolean, error?: boolean, disabled?: boolean): string {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
    disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
  } ${
    selected
      ? "bg-[#03548C] border-[#03548C] text-white shadow-sm shadow-blue-200"
      : error
      ? "bg-white border-red-300 text-gray-600"
      : "bg-white border-gray-200 text-gray-600 hover:border-[#03548C]/50 hover:text-[#03548C]"
  }`;
}

const secondaryBtnCls =
  "py-3 px-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#03548C]/40 hover:text-[#03548C] transition cursor-pointer";

// El catálogo general de planes (GET /plans/catalog — el mismo que usa la
// pantalla de cambio de plan) alimenta las cajas contextuales y la comparación
// de modalidades. NO se usa GET /commercials/onboarding/plan aquí; ese endpoint
// queda para el paso de plan recomendado (PLAN_PENDING). Es opcional: si falla,
// los extras simplemente no muestran cifras.
function usePlanCatalog(enabled: boolean): PlanCatalogResponseDTO | null {
  const [catalog, setCatalog] = useState<PlanCatalogResponseDTO | null>(null);
  useEffect(() => {
    if (!enabled || catalog) return;
    let alive = true;
    getPlanCatalog()
      .then((c) => {
        if (alive) setCatalog(c);
      })
      .catch(() => {
        /* no disponible — los extras contextuales quedan sin cifras */
      });
    return () => {
      alive = false;
    };
  }, [enabled, catalog]);
  return catalog;
}

// ── "¿Por qué me preguntan esto?" ────────────────────────────────────────────

function WhyLink({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-[#03548C] hover:text-[#0b1440] underline underline-offset-2 cursor-pointer"
      >
        ¿Por qué me preguntan esto?
      </button>
      {open && (
        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5 leading-relaxed">
          {text}
        </p>
      )}
    </div>
  );
}

// ── Comparación de modalidades ───────────────────────────────────────────────

const MODALITY_CARDS: { route: "A" | "B" | "C"; planCode: PlanCode; label: string; blurb: string }[] = [
  {
    route: "A",
    planCode: PlanCode.BASIC,
    label: "Empresa Tipo A",
    blurb:
      "Operación concentrada. Cuota mensual fija e independiente de las ventas, métricas básicas y un número acotado de ofertas activas.",
  },
  {
    route: "B",
    planCode: PlanCode.STANDARD,
    label: "Empresa Tipo B",
    blurb:
      "Inversión que se consume por comisión al ritmo de las ventas. Pensada para redes comerciales y catálogos más amplios.",
  },
  {
    route: "C",
    planCode: PlanCode.PREMIUM,
    label: "Candidata a Empresa Premium",
    blurb:
      "Perfil de empresa productora o con capacidad de patrocinio. El resultado queda sujeto a documentos, verificación y aprobación.",
  },
];

function ModalitiesComparison({
  catalog,
  highlightRoute,
}: {
  catalog: PlanCatalogResponseDTO | null;
  highlightRoute?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {MODALITY_CARDS.map((m) => {
        const plan = planByCode(catalog, m.planCode);
        const highlighted = highlightRoute === m.route;
        return (
          <div
            key={m.route}
            className={`rounded-xl border p-4 ${
              highlighted ? "border-[#03548C] bg-[#03548C]/5" : "border-gray-200 bg-white"
            }`}
          >
            {highlighted && (
              <span className="inline-block mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#03548C] bg-[#03548C]/10 px-2 py-0.5 rounded-full">
                Tu resultado
              </span>
            )}
            <p className="text-sm font-bold text-gray-900">{m.label}</p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{m.blurb}</p>
            {plan && (
              <dl className="mt-3 space-y-1 text-xs">
                {plan.monthlyFeeCents != null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-400">Cuota mensual</dt>
                    <dd className="font-semibold text-gray-700">{formatCOP(plan.monthlyFeeCents)}</dd>
                  </div>
                )}
                {plan.minInvestmentCents != null && plan.maxInvestmentCents != null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-400">Inversión</dt>
                    <dd className="font-semibold text-gray-700">
                      {formatCOP(plan.minInvestmentCents)} – {formatCOP(plan.maxInvestmentCents)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Comisión por venta</dt>
                  <dd className="font-semibold text-gray-700">{plan.saleCommissionPct}%</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Máx. llaves</dt>
                  <dd className="font-semibold text-gray-700">{formatKeysPct(plan.maxKeysPct)}</dd>
                </div>
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Explicaciones / simuladores contextuales ─────────────────────────────────
// No bloquean el envío. Se muestran cuando el usuario elige una opción que pide
// más información (QUIERE_INFO / QUIERE_EJEMPLO / DEPENDE / NECESITA_EXPLICACION).

const CONTEXTUAL_TRIGGER: Record<string, string> = {
  typeAMonthlyFeeViable: "QUIERE_INFO",
  acceptsTypeACommission: "QUIERE_EJEMPLO",
  acceptsTypeAKeys: "QUIERE_EJEMPLO",
  acceptsTypeBKeys: "QUIERE_EJEMPLO",
  typeBInvestmentCapacity: "DEPENDE",
  understandsProsperityRegime: "NECESITA_EXPLICACION",
  acceptsPremiumBrandFocus: "NECESITA_EXPLICACION",
  acceptsDataProtectionMetrics: "NECESITA_EXPLICACION",
};

// Solo estas cajas contextuales muestran cifras vigentes (cuota, comisión %,
// llaves, rango) y por tanto necesitan GET /plan. Las demás son texto o un
// simulador de solo-input (régimen de Prosperidad = 5× inversión).
const CONTEXTUAL_NEEDS_PLAN = new Set([
  "typeAMonthlyFeeViable",
  "acceptsTypeACommission",
  "acceptsTypeAKeys",
  "acceptsTypeBKeys",
  "typeBInvestmentCapacity",
]);

const EXAMPLE_SALE_PESOS = 100_000;

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <div className="text-xs text-blue-800 leading-relaxed space-y-1.5 w-full">{children}</div>
    </div>
  );
}

function pesosInput(raw: string): number {
  return parseInt(raw.replace(/\D/g, ""), 10) || 0;
}

function ProsperitySimulator() {
  const [raw, setRaw] = useState("");
  const invest = pesosInput(raw);
  return (
    <div>
      <label className="block font-semibold mb-1">Simulador del régimen de Prosperidad</label>
      <div className="relative max-w-[220px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={invest ? invest.toLocaleString("es-CO") : ""}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Monto de inversión"
          className="w-full pl-6 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      {invest > 0 && (
        <p className="mt-1.5">
          Umbral de Prosperidad = <span className="font-bold">{copFromPesos(invest * 5)}</span> (5× tu
          inversión). Es el nivel de ventas acumuladas a partir del cual aplican las condiciones del
          régimen.
        </p>
      )}
    </div>
  );
}

function InvestmentRangeSimulator({ plan }: { plan: PlanCatalogOption }) {
  const [raw, setRaw] = useState("");
  const amount = pesosInput(raw);
  const minP = (plan.minInvestmentCents ?? 0) / 100;
  const maxP = (plan.maxInvestmentCents ?? 0) / 100;
  const state = amount === 0 ? null : amount < minP ? "below" : amount > maxP ? "above" : "ok";
  return (
    <div>
      <label className="block font-semibold mb-1">Simulador de rango de inversión</label>
      <div className="relative max-w-[220px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={amount ? amount.toLocaleString("es-CO") : ""}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Monto a invertir"
          className="w-full pl-6 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      {state === "ok" && <p className="mt-1.5 font-semibold text-emerald-700">Dentro del rango de Empresa Tipo B.</p>}
      {state === "below" && (
        <p className="mt-1.5 text-amber-700">Por debajo del mínimo ({formatCOP(plan.minInvestmentCents)}).</p>
      )}
      {state === "above" && (
        <p className="mt-1.5 text-amber-700">Por encima del máximo ({formatCOP(plan.maxInvestmentCents)}).</p>
      )}
    </div>
  );
}

function ContextualHelp({
  fieldName,
  catalog,
}: {
  fieldName: string;
  catalog: PlanCatalogResponseDTO | null;
}) {
  const basic = planByCode(catalog, PlanCode.BASIC);
  const standard = planByCode(catalog, PlanCode.STANDARD);
  const loadingNote = <p>Estamos cargando los valores vigentes. Puedes continuar y revisarlos más adelante.</p>;

  switch (fieldName) {
    case "typeAMonthlyFeeViable":
      return (
        <InfoBox>
          {basic?.monthlyFeeCents != null ? (
            <p>
              La cuota mensual vigente de <span className="font-semibold">Empresa Tipo A</span> es{" "}
              <span className="font-bold">{formatCOP(basic.monthlyFeeCents)}</span>. Es un valor fijo,
              independiente de tus ventas, que cubre el acceso a la plataforma y las métricas básicas.
            </p>
          ) : (
            loadingNote
          )}
          <p>Cuando lo tengas claro, elige “Sí” o “No”.</p>
        </InfoBox>
      );
    case "acceptsTypeACommission":
      return (
        <InfoBox>
          {basic ? (
            <p>
              La comisión por venta de Empresa Tipo A es{" "}
              <span className="font-bold">{basic.saleCommissionPct}%</span>. Sobre una venta de{" "}
              {copFromPesos(EXAMPLE_SALE_PESOS)} serían{" "}
              <span className="font-bold">
                {copFromPesos((EXAMPLE_SALE_PESOS * basic.saleCommissionPct) / 100)}
              </span>
              .
            </p>
          ) : (
            loadingNote
          )}
        </InfoBox>
      );
    case "acceptsTypeAKeys":
    case "acceptsTypeBKeys": {
      const plan = fieldName === "acceptsTypeAKeys" ? basic : standard;
      return (
        <InfoBox>
          {plan ? (
            plan.maxKeysPct === -1 ? (
              <p>En esta modalidad no hay límite para el porcentaje de una llave promocional.</p>
            ) : (
              <p>
                El porcentaje máximo de una llave promocional es{" "}
                <span className="font-bold">{plan.maxKeysPct}%</span>. Sobre una llave de valor total{" "}
                {copFromPesos(EXAMPLE_SALE_PESOS)}, la porción monetaria máxima sería{" "}
                <span className="font-bold">
                  {copFromPesos((EXAMPLE_SALE_PESOS * plan.maxKeysPct) / 100)}
                </span>
                .
              </p>
            )
          ) : (
            loadingNote
          )}
        </InfoBox>
      );
    }
    case "typeBInvestmentCapacity":
      return (
        <InfoBox>
          {standard?.minInvestmentCents != null && standard?.maxInvestmentCents != null ? (
            <>
              <p>
                La inversión de <span className="font-semibold">Empresa Tipo B</span> va de{" "}
                <span className="font-bold">{formatCOP(standard.minInvestmentCents)}</span> a{" "}
                <span className="font-bold">{formatCOP(standard.maxInvestmentCents)}</span> y se
                consume vía comisión al ritmo de las ventas (sin plazo fijo).
              </p>
              <InvestmentRangeSimulator plan={standard} />
            </>
          ) : (
            loadingNote
          )}
        </InfoBox>
      );
    case "understandsProsperityRegime":
      return (
        <InfoBox>
          <p>
            El régimen de Prosperidad fija un umbral de ventas acumuladas a partir del cual cambian
            las condiciones de tu operación. El umbral es <span className="font-semibold">5 veces</span>{" "}
            el monto que inviertes.
          </p>
          <ProsperitySimulator />
        </InfoBox>
      );
    case "acceptsPremiumBrandFocus":
      return (
        <InfoBox>
          <p>
            El tamaño de la empresa, su fama o el número de locales no bastan por sí solos para la
            modalidad Premium.
          </p>
          <p>
            Empresa Tipo A y Tipo B operan en autoservicio sobre el catálogo. “Candidata a Empresa
            Premium” está orientada a empresas productoras o con capacidad de patrocinio, y su
            resultado queda sujeto a documentos, verificación y aprobación.
          </p>
        </InfoBox>
      );
    case "acceptsDataProtectionMetrics":
      return (
        <InfoBox>
          <p>
            Las métricas que comparte VERYGANA son <span className="font-semibold">agregadas</span>:
            totales, promedios y tendencias que no identifican a ninguna persona.
          </p>
          <p>No se entregan datos personales de los participantes.</p>
        </InfoBox>
      );
    default:
      return null;
  }
}

// ── Controles por tipo de pregunta ───────────────────────────────────────────

function SingleChoiceControl({
  question,
  value,
  error,
  onChange,
}: {
  question: DiagnosticQuestion;
  value: string | undefined;
  error?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {question.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={optionCls(value === opt.value, { error })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BooleanControl({
  question,
  value,
  error,
  onChange,
}: {
  question: DiagnosticQuestion;
  value: boolean | undefined;
  error?: boolean;
  onChange: (value: boolean) => void;
}) {
  const trueLabel = question.options.find((o) => o.value === "true")?.label ?? "Sí";
  const falseLabel = question.options.find((o) => o.value === "false")?.label ?? "No";
  return (
    <div className="grid grid-cols-2 gap-2">
      {([
        { v: true, label: trueLabel },
        { v: false, label: falseLabel },
      ] as const).map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onChange(opt.v)}
          className={optionCls(value === opt.v, { error, center: true })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultiChoiceControl({
  question,
  value,
  error,
  onChange,
}: {
  question: DiagnosticQuestion;
  value: string[];
  error?: boolean;
  onChange: (value: string[]) => void;
}) {
  const max = question.maxSelections;
  const atMax = max != null && value.length >= max;
  const optionByValue = (v: string): DiagnosticQuestionOption | undefined =>
    question.options.find((o) => o.value === v);

  const toggle = (opt: DiagnosticQuestionOption) => {
    if (value.includes(opt.value)) {
      onChange(value.filter((v) => v !== opt.value));
      return;
    }
    if (opt.exclusive) {
      onChange([opt.value]);
      return;
    }
    // Al marcar una opción normal se descarta cualquier exclusiva ("Ninguno").
    const base = value.filter((v) => !optionByValue(v)?.exclusive);
    if (max != null && base.length >= max) return;
    onChange([...base, opt.value]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  if (question.ordered) {
    const available = question.options.filter((o) => !value.includes(o.value));
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-400">
          Selecciona en orden de prioridad{max != null ? ` (hasta ${max})` : ""}. El primero es el más
          importante.
        </p>

        {value.length > 0 && (
          <ol className="space-y-1.5">
            {value.map((v, i) => (
              <li
                key={v}
                className="flex items-center gap-1.5 rounded-xl border-2 border-blue-500 bg-blue-50 pl-3 pr-1.5 py-2"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-blue-700">
                  {optionByValue(v)?.label ?? v}
                </span>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir prioridad"
                  className="p-1 text-blue-400 disabled:opacity-30 hover:text-blue-600 cursor-pointer disabled:cursor-default"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Bajar prioridad"
                  className="p-1 text-blue-400 disabled:opacity-30 hover:text-blue-600 cursor-pointer disabled:cursor-default"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== v))}
                  aria-label="Quitar"
                  className="p-1 text-blue-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ol>
        )}

        {available.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {available.map((opt) => {
              const blocked = atMax && !opt.exclusive;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt)}
                  disabled={blocked}
                  className={chipCls(false, error, blocked)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {max != null && <p className="text-xs text-gray-400">Puedes elegir hasta {max}.</p>}
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const isSelected = value.includes(opt.value);
          const blocked = atMax && !isSelected && !opt.exclusive;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt)}
              disabled={blocked}
              className={chipCls(isSelected, error, blocked)}
            >
              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  error,
  catalog,
  onChange,
}: {
  question: DiagnosticQuestion;
  value: DiagnosticAnswerValue | undefined;
  error?: string;
  catalog: PlanCatalogResponseDTO | null;
  onChange: (value: DiagnosticAnswerValue | undefined) => void;
}) {
  const showContextual =
    typeof value === "string" && CONTEXTUAL_TRIGGER[question.fieldName] === value;

  return (
    <div id={`q-${question.fieldName}`} className="scroll-mt-24">
      <p className="text-sm font-semibold text-gray-700">
        {question.text}
        {question.required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {question.helpText && <WhyLink text={question.helpText} />}

      <div className="mt-2">
        {question.type === "SINGLE_CHOICE" && (
          <SingleChoiceControl
            question={question}
            value={typeof value === "string" ? value : undefined}
            error={!!error}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === "BOOLEAN" && (
          <BooleanControl
            question={question}
            value={typeof value === "boolean" ? value : undefined}
            error={!!error}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === "MULTI_CHOICE" && (
          <MultiChoiceControl
            question={question}
            value={Array.isArray(value) ? value : []}
            error={!!error}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>

      {showContextual && <ContextualHelp fieldName={question.fieldName} catalog={catalog} />}

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Ruta D: integración técnica especial ─────────────────────────────────────
// Escotilla fuera del cuestionario A/B/C. Si la empresa necesita integrarse
// técnicamente con VERYGANA, se envía esta señal a POST /diagnostic y el
// backend deja la cuenta en ADVISOR_CONTACT_PENDING.

const TECH_NEED_OPTIONS: { value: TechIntegrationNeed; label: string }[] = [
  { value: "API", label: "Integración por API" },
  { value: "CONCILIACION", label: "Conciliación de pagos" },
  { value: "ACTIVACION_AUTOMATICA", label: "Activación automática" },
];

function SpecialIntegrationForm({
  submitting,
  onSubmit,
  onBack,
}: {
  submitting: boolean;
  onSubmit: (data: SpecialIntegrationRequest) => void;
  onBack: () => void;
}) {
  const [needs, setNeeds] = useState<TechIntegrationNeed[]>([]);
  const [details, setDetails] = useState("");
  const [touched, setTouched] = useState(false);

  const needsError = touched && needs.length === 0;
  const detailsError = touched && details.trim().length === 0;

  const toggle = (need: TechIntegrationNeed) =>
    setNeeds((cur) => (cur.includes(need) ? cur.filter((n) => n !== need) : [...cur, need]));

  const handleSubmit = () => {
    setTouched(true);
    if (needs.length === 0 || details.trim().length === 0) return;
    onSubmit({ techIntegrationNeeds: needs, integrationDetails: details.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Integración especial</h3>
        <p className="text-sm text-gray-500">
          Si tu empresa necesita integrarse técnicamente con VERYGANA, no hace falta el cuestionario
          de modalidades. Cuéntanos qué necesitas y un asesor definirá las condiciones contigo.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          ¿Qué tipo de integración necesitas?<span className="text-red-500 ml-0.5">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TECH_NEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={chipCls(needs.includes(opt.value), needsError)}
            >
              {needs.includes(opt.value) && <Check className="w-3.5 h-3.5 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
        {needsError && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Selecciona al menos una opción.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Cuéntanos qué necesitas<span className="text-red-500 ml-0.5">*</span>
        </p>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
          maxLength={1000}
          rows={4}
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
            detailsError
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-200 focus:ring-[#03548C]/40 focus:border-[#03548C]"
          }`}
        />
        <p className="text-xs text-gray-400 mt-1">{details.length}/1000</p>
        {detailsError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Describe la integración que necesitas.
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Con esta información clasificamos tu cuenta y un asesor de VERYGANA se pondrá en contacto
          contigo. El cuestionario de modalidades no aplica en este caso.
        </p>
      </div>

      <div className="space-y-2">
        <StepButton submitting={submitting} onClick={handleSubmit} label="Enviar solicitud" />
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

// ── Paso 4: cuestionario de diagnóstico ──────────────────────────────────────

interface DiagnosticStepProps {
  questionnaire: DiagnosticQuestionnaire | null;
  loadError: boolean;
  onReload: () => void;
  answers: DiagnosticAnswers;
  errors: FieldErrors;
  submitting: boolean;
  onAnswersChange: (next: DiagnosticAnswers) => void;
  onSubmit: (payload: DiagnosticAnswers) => void;
  onSubmitSpecialIntegration: (data: SpecialIntegrationRequest) => void;
}

export function DiagnosticStep({
  questionnaire,
  loadError,
  onReload,
  answers,
  errors,
  submitting,
  onAnswersChange,
  onSubmit,
  onSubmitSpecialIntegration,
}: DiagnosticStepProps) {
  // Si ya hay respuestas (p. ej. se volvió desde la pantalla de resultado con
  // "Volver a responder"), se entra directo al formulario en vez de la apertura.
  const [phase, setPhase] = useState<"opening" | "form" | "special">(
    Object.keys(answers).length > 0 ? "form" : "opening"
  );
  const [showModalities, setShowModalities] = useState(false);
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});

  const allQuestions = useMemo(
    () => questionnaire?.sections.flatMap((s) => s.questions) ?? [],
    [questionnaire]
  );
  const fieldByCode = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of allQuestions) map[q.code] = q.fieldName;
    return map;
  }, [allQuestions]);

  // Visibilidad en orden de documento. Las dependencias siempre apuntan a
  // preguntas anteriores, así que un solo recorrido alcanza; las respuestas de
  // preguntas ocultas no cuentan para evaluar dependencias posteriores.
  const visibleCodes = useMemo(() => {
    const visible = new Set<string>();
    const effective: DiagnosticAnswers = {};
    for (const q of allQuestions) {
      let show = true;
      if (q.dependsOn) {
        const depField = fieldByCode[q.dependsOn.questionCode];
        show = dependencyMet(depField ? effective[depField] : undefined, q.dependsOn.values);
      }
      if (!show) continue;
      visible.add(q.code);
      const answer = answers[q.fieldName];
      if (hasAnswer(answer)) effective[q.fieldName] = answer as DiagnosticAnswerValue;
    }
    return visible;
  }, [allQuestions, fieldByCode, answers]);

  // GET /plan se pide SOLO cuando el usuario elige una opción que necesita
  // cifras vigentes (p. ej. "Quiero conocer los beneficios" / "Quiero un
  // ejemplo"). Nunca al dar "Comenzar" ni al abrir "Conocer las modalidades".
  const needsPlanCatalog = useMemo(
    () =>
      allQuestions.some(
        (q) =>
          visibleCodes.has(q.code) &&
          CONTEXTUAL_NEEDS_PLAN.has(q.fieldName) &&
          answers[q.fieldName] === CONTEXTUAL_TRIGGER[q.fieldName]
      ),
    [allQuestions, visibleCodes, answers]
  );
  const catalog = usePlanCatalog(needsPlanCatalog);

  // Limpia respuestas de preguntas que dejaron de estar visibles — se envían
  // omitidas y, si se vuelven a mostrar, aparecen en blanco.
  useEffect(() => {
    if (!questionnaire) return;
    const stale = allQuestions.filter(
      (q) => !visibleCodes.has(q.code) && answers[q.fieldName] !== undefined
    );
    if (stale.length === 0) return;
    const next = { ...answers };
    for (const q of stale) delete next[q.fieldName];
    onAnswersChange(next);
  }, [questionnaire, allQuestions, visibleCodes, answers, onAnswersChange]);

  const mergedErrors = useMemo(() => ({ ...localErrors, ...errors }), [localErrors, errors]);

  const setAnswer = (fieldName: string, value: DiagnosticAnswerValue | undefined) => {
    const next = { ...answers };
    if (value === undefined || (Array.isArray(value) && value.length === 0)) delete next[fieldName];
    else next[fieldName] = value;
    onAnswersChange(next);
    if (localErrors[fieldName]) {
      setLocalErrors((prev) => {
        const p = { ...prev };
        delete p[fieldName];
        return p;
      });
    }
  };

  const handleSubmit = () => {
    const errs: FieldErrors = {};
    for (const q of allQuestions) {
      if (visibleCodes.has(q.code) && q.required && !hasAnswer(answers[q.fieldName])) {
        errs[q.fieldName] = "Selecciona una respuesta para continuar.";
      }
    }
    if (Object.keys(errs).length > 0) {
      setLocalErrors(errs);
      const first = allQuestions.find((q) => errs[q.fieldName]);
      if (first && typeof document !== "undefined") {
        document
          .getElementById(`q-${first.fieldName}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const payload: DiagnosticAnswers = {};
    for (const q of allQuestions) {
      const answer = answers[q.fieldName];
      if (visibleCodes.has(q.code) && hasAnswer(answer)) {
        payload[q.fieldName] = answer as DiagnosticAnswerValue;
      }
    }
    onSubmit(payload);
  };

  if (loadError && !questionnaire) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertTriangle className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-500">No pudimos cargar el cuestionario.</p>
        <button
          type="button"
          onClick={onReload}
          className="px-4 py-2 rounded-xl bg-[#03548C] text-white text-sm font-semibold cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (phase === "special") {
    return (
      <SpecialIntegrationForm
        submitting={submitting}
        onSubmit={onSubmitSpecialIntegration}
        onBack={() => setPhase(Object.keys(answers).length > 0 ? "form" : "opening")}
      />
    );
  }

  if (phase === "opening") {
    // "Guardar y continuar después" / "Cancelar" no se muestran (no hay
    // borrador en el backend); solo quedan las acciones accionables.
    const actions = (
      questionnaire.openingActions.length ? questionnaire.openingActions : ["Comenzar"]
    ).filter((a) => classifyOpeningAction(a) !== "exit");
    if (!actions.some((a) => classifyOpeningAction(a) === "start")) actions.unshift("Comenzar");
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Diagnóstico comercial</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {questionnaire.openingMessage}
          </p>
        </div>

        {showModalities && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Las tres modalidades
            </p>
            {/* Solo descripción — las cifras vigentes se ven al comparar
                modalidades desde la pantalla de resultado. */}
            <ModalitiesComparison catalog={null} />
          </div>
        )}

        <div className="space-y-2">
          {actions.map((action) => {
            const kind = classifyOpeningAction(action);
            if (kind === "modalities") {
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => setShowModalities((o) => !o)}
                  className="w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#03548C]/40 hover:text-[#03548C] transition cursor-pointer"
                >
                  {showModalities ? "Ocultar modalidades" : action}
                </button>
              );
            }
            return (
              <StepButton
                key={action}
                submitting={false}
                onClick={() => setPhase("form")}
                label={action}
              />
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => setPhase("special")}
            className="text-xs font-medium text-[#03548C] hover:text-[#0b1440] underline underline-offset-2 cursor-pointer"
          >
            ¿Necesitas una integración especial?
          </button>
        </div>
      </div>
    );
  }

  const hasVisibleErrors = allQuestions.some(
    (q) => visibleCodes.has(q.code) && mergedErrors[q.fieldName]
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Diagnóstico comercial</h3>
        <p className="text-sm text-gray-500">
          Responde las siguientes preguntas para conocer la modalidad que mejor se ajusta a tu
          empresa.
        </p>
      </div>

      {questionnaire.sections.map((section) => {
        const sectionQuestions = section.questions.filter((q) => visibleCodes.has(q.code));
        if (sectionQuestions.length === 0) return null;
        return (
          <section key={section.code} className="space-y-5">
            <div className="border-l-2 border-[#03548C] pl-3">
              <h4 className="text-sm font-bold text-gray-900">{section.title}</h4>
              {section.subtitle && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{section.subtitle}</p>
              )}
            </div>
            {sectionQuestions.map((q) => (
              <QuestionField
                key={q.code}
                question={q}
                value={answers[q.fieldName]}
                error={mergedErrors[q.fieldName]}
                catalog={catalog}
                onChange={(value) => setAnswer(q.fieldName, value)}
              />
            ))}
          </section>
        );
      })}

      {hasVisibleErrors && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Revisa las preguntas marcadas antes de continuar.
        </p>
      )}

      <div className="space-y-2">
        <StepButton submitting={submitting} onClick={handleSubmit} label="Ver mi resultado" />
        <button
          type="button"
          onClick={() => setPhase("opening")}
          className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          Volver a la introducción
        </button>
      </div>

      <div className="pt-3 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={() => setPhase("special")}
          className="text-xs font-medium text-[#03548C] hover:text-[#0b1440] underline underline-offset-2 cursor-pointer"
        >
          ¿Necesitas una integración especial?
        </button>
      </div>
    </div>
  );
}

// ── Pantalla de resultado de la clasificación ────────────────────────────────

interface ClassificationStepProps {
  classification: ClassificationResult;
  submitting: boolean;
  onConfirm: () => void;
  onRetry: () => void;
}

export function ClassificationStep({
  classification,
  submitting,
  onConfirm,
  onRetry,
}: ClassificationStepProps) {
  const [showModalities, setShowModalities] = useState(false);
  const catalog = usePlanCatalog(showModalities);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Tu resultado</h3>
        <p className="text-sm text-gray-500">
          Con base en tus respuestas, esta es la modalidad que mejor se ajusta a tu empresa.
        </p>
      </div>

      <div className="flex items-start gap-4 p-5 bg-[#03548C]/5 border border-[#03548C]/20 rounded-xl">
        <div className="w-11 h-11 bg-[#03548C]/10 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-[#03548C]" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900 mb-2">{classification.modalityLabel}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{classification.explanation}</p>
        </div>
      </div>

      {classification.preliminary && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-semibold mb-0.5">Recomendación aproximada</p>
            <p>Puedes revisar y ajustar tus respuestas.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 font-bold underline underline-offset-2 cursor-pointer"
            >
              Volver a responder
            </button>
          </div>
        </div>
      )}

      {classification.verificationRequired && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            El resultado está sujeto a documentos, verificación y aprobación.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        La recomendación es preliminar. No constituye contratación, aprobación, cobro ni activación.
      </p>

      {showModalities && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Comparación de modalidades
          </p>
          <ModalitiesComparison catalog={catalog} highlightRoute={classification.route} />
        </div>
      )}

      <div className="space-y-2">
        <StepButton submitting={submitting} onClick={onConfirm} label="Confirmar y continuar" />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setShowModalities((o) => !o)} className={secondaryBtnCls}>
            {showModalities ? "Ocultar comparación" : "Comparar modalidades"}
          </button>
          <button type="button" onClick={onRetry} className={secondaryBtnCls}>
            Volver a responder
          </button>
        </div>
      </div>
    </div>
  );
}
