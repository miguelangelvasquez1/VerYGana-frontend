import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileSignature,
  FileText,
  Loader2,
  Mail,
  Phone,
  PhoneCall,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  DOCUMENT_TYPE_LABELS,
  type AnnualIncomeRange,
  type LegalRepDocType,
  type OnboardingContract,
  type OnboardingSummary,
  type PersonType,
} from "@/services/commercial/OnboardingService";
import { formatCOP, StepButton } from "../onboarding.shared";

// ─── Paso 9: revisar resumen y generar el contrato ─────────────────────────

interface ContractGenerateProps {
  summary: OnboardingSummary | null;
  submitting: boolean;
  onGenerate: () => void;
  onRequestChanges: () => void;
  rejectionNotes?: string | null;
  // true mientras compliance tiene una negociación pendiente (rutas D/E) —
  // bloquea "Generar contrato" hasta que se resuelva.
  requiresSpecialNegotiation?: boolean;
  onRefreshStatus?: () => Promise<void>;
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

export function ContractGenerateStep({
  summary,
  submitting,
  onGenerate,
  onRequestChanges,
  rejectionNotes,
  requiresSpecialNegotiation,
  onRefreshStatus,
}: ContractGenerateProps) {
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [highlightBanner, setHighlightBanner] = useState(false);

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  const { legalIdentification, plan, documents } = summary;

  // Cuando la negociación ya se resolvió (plan existe y quedó "congelado"),
  // acceptPlan responde 4xx si se intenta cambiar de plan — no queda más que
  // continuar a generar el contrato.
  const resolvedAt = plan?.specialNegotiationResolvedAt ?? null;
  const showResolvedMessage = !requiresSpecialNegotiation && resolvedAt != null;

  const handleCheckStatus = async () => {
    if (!onRefreshStatus) return;
    setCheckingStatus(true);
    try {
      await onRefreshStatus();
    } finally {
      setCheckingStatus(false);
    }
  };

  // El botón sigue "clickeable" (no disabled a nivel de DOM) cuando falta el
  // asesor — así el click puede llevar al empresario de vuelta al aviso en
  // vez de perderse en silencio, en lugar de generar el contrato. Sube toda
  // la página (no solo el aviso hasta el borde superior) para que quede
  // bien visible y no pegado al límite de la pantalla.
  const handleGenerateClick = () => {
    if (requiresSpecialNegotiation) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setHighlightBanner(true);
      setTimeout(() => setHighlightBanner(false), 1500);
      return;
    }
    onGenerate();
  };

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

      {requiresSpecialNegotiation && (
        <div
          className={`flex items-start gap-3 p-4 bg-amber-50 border rounded-xl transition-all ${
            highlightBanner ? "border-amber-500 ring-4 ring-amber-200" : "border-amber-200"
          }`}
        >
          <PhoneCall className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              Un asesor de VERyGANA se pondrá en contacto para confirmar las condiciones de tu
              cuenta antes de continuar. Podrás generar el contrato apenas quede resuelto.
            </p>
            {onRefreshStatus && (
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-800 hover:underline disabled:opacity-50 cursor-pointer"
              >
                {checkingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Verificar estado
              </button>
            )}
          </div>
        </div>
      )}

      {showResolvedMessage && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">
            Tu negociación fue resuelta el {formatDate(resolvedAt)} — ya puedes continuar y generar tu contrato.
          </p>
        </div>
      )}

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
              {plan.requiresSpecialNegotiation && plan.specialNegotiationDetails && (
                <Row label="Condiciones a la medida" value={plan.specialNegotiationDetails} />
              )}
              {plan.requiresSpecialNegotiation && (
                <div className="flex items-start gap-2 py-2.5">
                  <PhoneCall className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Un asesor de VERyGANA confirmará las condiciones finales de este plan contigo.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 py-2.5">
              <PhoneCall className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Tu plan será definido directamente por un asesor comercial de VERyGANA.
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
        {requiresSpecialNegotiation ? (
          <button
            type="button"
            onClick={handleGenerateClick}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide bg-gray-200 text-gray-400 cursor-not-allowed"
          >
            Confirmar y generar contrato
          </button>
        ) : (
          <StepButton
            submitting={submitting}
            disabled={!documents.allRequiredUploaded}
            onClick={onGenerate}
            label="Confirmar y generar contrato"
          />
        )}
        {!requiresSpecialNegotiation && !showResolvedMessage && (
          <button
            type="button"
            onClick={onRequestChanges}
            disabled={submitting}
            className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline transition disabled:opacity-50 cursor-pointer"
          >
            {plan ? "Cambiar de plan" : "Solicitar cambios"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Paso 10: el empresario revisa y aprueba el PDF generado ──────────────

interface ContractReviewProps {
  contract: OnboardingContract;
  submitting: boolean;
  onOpenContract: () => Promise<void>;
  onApprove: () => void;
}

export function ContractReviewStep({ contract, submitting, onOpenContract, onApprove }: ContractReviewProps) {
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      await onOpenContract();
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Revisa tu contrato</h3>
        <p className="text-sm text-gray-500">
          Versión {contract.version} — generado el{" "}
          {new Date(contract.generatedAt).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Este documento es una plantilla base, pendiente de validación jurídica por el equipo
          legal de VERyGANA. Revisa las condiciones antes de aprobarlo.
        </p>
      </div>

      <button
        type="button"
        onClick={handleOpen}
        disabled={opening}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[#03548C]/30 text-[#03548C] font-semibold text-sm hover:bg-[#03548C]/5 transition disabled:opacity-50 cursor-pointer"
      >
        {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Ver contrato
      </button>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Phone className="w-5 h-5 text-[#03548C] shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Si tienes alguna objeción con el contrato, comunícate con nuestro servicio al cliente
          para resolverla antes de aprobarlo.
        </p>
      </div>

      <StepButton submitting={submitting} onClick={onApprove} label="Aprobar contrato" />
    </div>
  );
}

// ─── Paso 11:  revisando el contrato aprobado por el empresario ───

interface VeryGanaReviewProps {
  contract: OnboardingContract | null;
  onRefresh: () => Promise<void>;
  // Rechazo NO documental (documentsCompleted=true): no hay autoservicio,
  // el siguiente movimiento lo hace VerYGana manualmente.
  rejected?: boolean;
  rejectionReason?: string | null;
}

export function VeryGanaReviewStep({ contract, onRefresh, rejected, rejectionReason }: VeryGanaReviewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (rejected) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tu contrato fue rechazado</h3>
          <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
            {rejectionReason || "Nuestro equipo de VERyGANA revisó tu caso y lo rechazó."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Verificar estado
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <Clock3 className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato en revisión</h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          Aprobaste tu contrato — ahora el equipo de VERyGANA lo está revisando. Te
          notificaremos por correo cuando quede activo.
        </p>
        {contract && (
          <p className="text-xs text-gray-400 mt-3">
            Versión {contract.version} · enviado el{" "}
            {contract.businessApprovedAt
              ? new Date(contract.businessApprovedAt).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
      >
        {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Verificar estado
      </button>
    </div>
  );
}

// ─── Paso 11b: contrato aprobado por VERyGANA, enviado a firma electrónica ─

interface SignatureProps {
  contract: OnboardingContract | null;
  onRefresh: () => Promise<void>;
}

export function SignatureStep({ contract, onRefresh }: SignatureProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-[#03548C]" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato enviado a firma</h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          Te enviamos un correo con el enlace para firmar electrónicamente tu Contrato Marco.
          Revisa tu bandeja de entrada (y la carpeta de spam) y completa la firma para continuar.
        </p>
        {contract && (
          <p className="text-xs text-gray-400 mt-3">Versión {contract.version}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
      >
        {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Ya firmé, verificar estado
      </button>
    </div>
  );
}
