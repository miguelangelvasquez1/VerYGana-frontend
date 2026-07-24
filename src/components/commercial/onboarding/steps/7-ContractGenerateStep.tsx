import React from "react";
import { AlertTriangle, CheckCircle2, FileSignature, Loader2, PhoneCall, XCircle } from "lucide-react";
import {
  DOCUMENT_TYPE_LABELS,
  type AnnualIncomeRange,
  type LegalRepDocType,
  type OnboardingSummary,
  type PersonType,
  type PrimaryGoal,
  type TechIntegrationNeed,
} from "@/services/commercial/OnboardingService";
import { formatCOP, StepButton } from "../onboarding.shared";

interface Props {
  summary: OnboardingSummary | null;
  submitting: boolean;
  onGenerate: () => void;
  onRequestChanges: () => void;
  rejectionNotes?: string | null;
}

// ─── Labels (mismo texto que ya se usa en los pasos originales) ────────────

const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  NATURAL: "Persona Natural",
  JURIDICA: "Persona Jurídica",
};

const DOC_TYPE_LABELS: Record<LegalRepDocType, string> = {
  CC: "Cédula de Ciudadanía",
  CE: "Cédula de Extranjería",
  PP: "Pasaporte",
};

const INCOME_RANGE_LABELS: Record<AnnualIncomeRange, string> = {
  LESS_THAN_500_SMMLV: "Menos de 500 SMMLV",
  FROM_500_TO_5000_SMMLV: "500 a 5.000 SMMLV",
  FROM_5000_TO_50000_SMMLV: "5.000 a 50.000 SMMLV",
  MORE_THAN_50000_SMMLV: "Más de 50.000 SMMLV",
};

const PRIMARY_GOAL_LABELS: Record<PrimaryGoal, string> = {
  VENDER: "Vender productos",
  PUBLICIDAD: "Hacer publicidad",
  AMBAS: "Ambas",
};

const TECH_NEED_LABELS: Record<TechIntegrationNeed, string> = {
  API: "Integración por API",
  CONCILIACION: "Conciliación de pagos",
  ACTIVACION_AUTOMATICA: "Activación automática",
};

// ─── Helpers de presentación ────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function boolLabel(value: boolean): string {
  return value ? "Sí" : "No";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

export function ContractGenerateStep({ summary, submitting, onGenerate, onRequestChanges, rejectionNotes }: Props) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  const { legalIdentification, diagnostic, classification, plan, documents } = summary;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Revisa tu solicitud</h3>
        <p className="text-sm text-gray-500">
          Este es un resumen de todo lo que registraste. Revísalo antes de generar el Contrato
          Marco — si algo no está correcto, puedes cambiar de plan o actualizar la información
          contactando servicio al cliente.
        </p>
      </div>

      <div className="space-y-3">
        {summary.termsVersion && (
          <Section title="Términos y Condiciones">
            <Row label="Versión aceptada" value={`v${summary.termsVersion}`} />
            <Row label="Aceptados el" value={formatDate(summary.termsAcceptedAt)} />
          </Section>
        )}

        {legalIdentification && (
          <Section title="Identificación legal">
            <Row label="Tipo de persona" value={PERSON_TYPE_LABELS[legalIdentification.personType]} />
            {legalIdentification.companyName && (
              <Row label="Razón social" value={legalIdentification.companyName} />
            )}
            <Row label="NIT" value={legalIdentification.nit} />
            {legalIdentification.mercantileRegistration && (
              <Row label="Matrícula mercantil" value={legalIdentification.mercantileRegistration} />
            )}
            <Row
              label="Representante legal"
              value={`${legalIdentification.legalRepFirstName} ${legalIdentification.legalRepLastName}`}
            />
            <Row
              label="Documento"
              value={`${DOC_TYPE_LABELS[legalIdentification.legalRepDocType]} ${legalIdentification.legalRepDocNumber}`}
            />
            <Row label="¿Representante es PEP?" value={boolLabel(legalIdentification.legalRepPepDeclaration)} />
            {legalIdentification.annualIncomeRange && (
              <Row
                label="Ingresos anuales"
                value={INCOME_RANGE_LABELS[legalIdentification.annualIncomeRange]}
              />
            )}
            <Row label="Actividad económica" value={legalIdentification.economicActivityDescription} />
            {legalIdentification.ciiuCode && (
              <Row label="Código CIIU" value={legalIdentification.ciiuCode} />
            )}
            <Row label="Dirección" value={legalIdentification.address} />
            {(legalIdentification.municipalityName || legalIdentification.departmentName) && (
              <Row
                label="Ubicación"
                value={[legalIdentification.municipalityName, legalIdentification.departmentName]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
          </Section>
        )}

        {diagnostic && (
          <Section title="Diagnóstico comercial">
            <Row
              label="Necesidades técnicas"
              value={
                diagnostic.techIntegrationNeeds.length > 0
                  ? diagnostic.techIntegrationNeeds.map((n) => TECH_NEED_LABELS[n]).join(", ")
                  : "Ninguna"
              }
            />
            {diagnostic.integrationDetails && (
              <Row label="Detalle de integración" value={diagnostic.integrationDetails} />
            )}
            {diagnostic.primaryGoal && (
              <Row label="Objetivo principal" value={PRIMARY_GOAL_LABELS[diagnostic.primaryGoal]} />
            )}
            {diagnostic.wantsFixedFee != null && (
              <Row label="¿Tarifa fija?" value={boolLabel(diagnostic.wantsFixedFee)} />
            )}
            {diagnostic.requiresCustomGames != null && (
              <Row label="¿Juegos personalizados?" value={boolLabel(diagnostic.requiresCustomGames)} />
            )}
            {diagnostic.regulatedSector != null && (
              <Row label="¿Sector regulado?" value={boolLabel(diagnostic.regulatedSector)} />
            )}
            {diagnostic.requiresSpecialNegotiation != null && (
              <Row label="¿Negociación especial?" value={boolLabel(diagnostic.requiresSpecialNegotiation)} />
            )}
          </Section>
        )}

        {classification && (
          <Section title="Clasificación">
            <Row label="Ruta comercial" value={`Ruta ${classification.route}`} />
            <div className="py-2.5">
              <p className="text-sm text-gray-600 leading-relaxed">{classification.explanation}</p>
            </div>
          </Section>
        )}

        <Section title="Plan">
          {plan ? (
            <>
              <Row label="Plan elegido" value={plan.planName} />
              {plan.investmentAmountCents != null && (
                <Row label="Monto de inversión" value={formatCOP(plan.investmentAmountCents)} />
              )}
              {plan.monthlyFeeCents != null && (
                <Row label="Tarifa mensual" value={formatCOP(plan.monthlyFeeCents)} />
              )}
              {plan.contractDurationMonths != null && (
                <Row label="Duración del contrato" value={`${plan.contractDurationMonths} meses`} />
              )}
              <Row label="Comisión por venta" value={`${plan.saleCommissionPct}%`} />
              <Row label="Máx. % llaves promocionales" value={`${plan.maxKeysPct}%`} />
              {plan.requiresAdvisorContact && (
                <div className="flex items-start gap-2 py-2.5">
                  <PhoneCall className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Un asesor de VerYGana confirmará las condiciones finales de este plan contigo.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 py-2.5">
              <PhoneCall className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Tu plan será definido directamente por un asesor comercial de VerYGana.
              </p>
            </div>
          )}
        </Section>

        <Section title="Documentos">
          {documents.checklist.map((item) => (
            <Row
              key={item.documentType}
              label={DOCUMENT_TYPE_LABELS[item.documentType]}
              value={
                item.uploaded ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cargado
                  </span>
                ) : item.required ? (
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <XCircle className="w-3.5 h-3.5" /> Falta
                  </span>
                ) : (
                  <span className="text-gray-400">Opcional, sin cargar</span>
                )
              }
            />
          ))}
        </Section>
      </div>

      <div className="flex items-start gap-4 p-5 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="w-11 h-11 bg-[#03548C]/10 rounded-lg flex items-center justify-center shrink-0">
          <FileSignature className="w-5 h-5 text-[#03548C]" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Si todo está correcto, al confirmar generamos el Contrato Marco en PDF (con el anexo de
          tu ruta, el resumen económico y el listado de documentos aceptados) para tu revisión final.
        </p>
      </div>

      <div className="space-y-3">
        <StepButton
          submitting={submitting}
          disabled={!documents.allRequiredUploaded}
          onClick={onGenerate}
          label="Confirmar y generar contrato"
        />
        <button
          type="button"
          onClick={onRequestChanges}
          disabled={submitting}
          className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline transition disabled:opacity-50 cursor-pointer"
        >
          {plan ? "Cambiar de plan" : "Solicitar cambios"}
        </button>
      </div>
    </div>
  );
}
