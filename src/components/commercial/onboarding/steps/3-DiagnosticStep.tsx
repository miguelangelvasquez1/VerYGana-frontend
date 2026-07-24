import React from "react";
import { PhoneCall } from "lucide-react";
import type {
  DiagnosticRequest,
  PrimaryGoal,
  TechIntegrationNeed,
} from "@/services/commercial/OnboardingService";
import { BoolToggle, FieldErrors, FieldWrapper, inputCls, StepButton } from "../onboarding.shared";

export type DiagnosticForm = Partial<DiagnosticRequest>;

interface Props {
  form: DiagnosticForm;
  errors: FieldErrors;
  submitting: boolean;
  onChange: <K extends keyof DiagnosticForm>(field: K, value: DiagnosticForm[K]) => void;
  onNext: () => void;
}

const PRIMARY_GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: "VENDER", label: "Vender productos" },
  { value: "PUBLICIDAD", label: "Hacer publicidad" },
  { value: "AMBAS", label: "Ambas" },
];

const TECH_NEEDS_OPTIONS: { value: TechIntegrationNeed; label: string }[] = [
  { value: "API", label: "Integración por API" },
  { value: "CONCILIACION", label: "Conciliación de pagos" },
  { value: "ACTIVACION_AUTOMATICA", label: "Activación automática" },
];

export function DiagnosticStep({ form, errors, submitting, onChange, onNext }: Props) {
  const toggleTechNeed = (need: TechIntegrationNeed) => {
    const current = form.techIntegrationNeeds || [];
    const next = current.includes(need)
      ? current.filter((n) => n !== need)
      : [...current, need];
    onChange("techIntegrationNeeds", next);
  };

  const hasTechNeeds = (form.techIntegrationNeeds || []).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Diagnóstico comercial</h3>
        <p className="text-sm text-gray-500">
          Estas respuestas nos ayudan a clasificar tu cuenta en la ruta comercial adecuada.
        </p>
      </div>

      <FieldWrapper
        label="¿Necesitas integración técnica especial?"
        error={errors["techIntegrationNeeds"]}
        hint="Opcional — selecciona las que apliquen"
        tooltip="Selecciona esta opción si tu negocio requiere integrarse técnicamente con VerYGana: conectar tu sistema por API, conciliar pagos automáticamente o activar servicios sin intervención manual. Si marcas alguna, te clasificamos directo en la Ruta D y el resto del diagnóstico no aplica — un asesor comercial define las condiciones contigo."
      >
        <div className="flex flex-wrap gap-2">
          {TECH_NEEDS_OPTIONS.map((opt) => {
            const selected = (form.techIntegrationNeeds || []).includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTechNeed(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all
                  ${
                    selected
                      ? "bg-[#03548C] border-[#03548C] text-white shadow-sm shadow-blue-200"
                      : "bg-white border-gray-200 text-gray-600 hover:border-[#03548C]/50 hover:text-[#03548C]"
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FieldWrapper>

      {hasTechNeeds && (
        <>
          <FieldWrapper
            label="Cuéntanos qué necesitas"
            required
            error={errors["integrationDetails"]}
            hint={`${(form.integrationDetails || "").length}/1000`}
            tooltip="Describe con el mayor detalle posible qué integración o funcionalidad técnica necesitas (sistemas a conectar, tipo de conciliación, procesos a automatizar, etc.). Esta información la usará el asesor comercial para preparar la propuesta."
          >
            <textarea
              value={form.integrationDetails || ""}
              onChange={(e) => onChange("integrationDetails", e.target.value.slice(0, 1000))}
              maxLength={1000}
              rows={4}
              className={inputCls(!!errors["integrationDetails"])}
            />
          </FieldWrapper>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <PhoneCall className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Con esta respuesta ya podemos clasificar tu cuenta — el resto de las preguntas de este
              diagnóstico no aplican. Un asesor de VerYGana definirá las condiciones contigo.
            </p>
          </div>
        </>
      )}

      {!hasTechNeeds && (
        <>
          <FieldWrapper
            label="¿Cuál es tu objetivo principal?"
            required
            error={errors["primaryGoal"]}
            tooltip="Indica si usarás VerYGana principalmente para vender tus productos, para hacer publicidad de tu marca, o ambas cosas. Esto influye en la ruta comercial y el plan que te recomendamos."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIMARY_GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange("primaryGoal", opt.value)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition text-left
                    ${
                      form.primaryGoal === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldWrapper>

          <FieldWrapper
            label="¿Buscas una tarifa fija?"
            required
            error={errors["wantsFixedFee"]}
            tooltip="Una tarifa fija es un monto mensual constante que pagas a VerYGana, independiente de tus ventas. Si prefieres pagar solo cuando vendes, responde 'No'."
          >
            <BoolToggle value={form.wantsFixedFee} onChange={(v) => onChange("wantsFixedFee", v)} error={errors["wantsFixedFee"]} />
          </FieldWrapper>

          <FieldWrapper
            label="¿Requieres juegos personalizados?"
            required
            error={errors["requiresCustomGames"]}
            tooltip="Los juegos personalizados son experiencias de gamificación diseñadas específicamente para tu marca, distintas a los juegos genéricos de la plataforma."
          >
            <BoolToggle value={form.requiresCustomGames} onChange={(v) => onChange("requiresCustomGames", v)} error={errors["requiresCustomGames"]} />
          </FieldWrapper>

          <FieldWrapper
            label="¿Perteneces a un sector regulado?"
            required
            error={errors["regulatedSector"]}
            tooltip="Sectores regulados son aquellos con supervisión especial del Estado (por ejemplo, financiero, salud, farmacéutico, seguros). Si tu actividad económica pertenece a uno de estos, responde 'Sí'."
          >
            <BoolToggle value={form.regulatedSector} onChange={(v) => onChange("regulatedSector", v)} error={errors["regulatedSector"]} />
          </FieldWrapper>

          <FieldWrapper
            label="¿Requieres una negociación especial?"
            required
            error={errors["requiresSpecialNegotiation"]}
            tooltip="Marca 'Sí' si tu negocio necesita condiciones comerciales fuera de los planes estándar (tarifas, alcances o compromisos particulares) que deban negociarse directamente con un asesor."
          >
            <BoolToggle
              value={form.requiresSpecialNegotiation}
              onChange={(v) => onChange("requiresSpecialNegotiation", v)}
              error={errors["requiresSpecialNegotiation"]}
            />
          </FieldWrapper>
        </>
      )}

      <StepButton submitting={submitting} onClick={onNext} label={hasTechNeeds ? "Enviar diagnóstico" : "Ver mi clasificación"} />
    </div>
  );
}
