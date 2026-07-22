'use client';

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  OnboardingService,
  OnboardingStatus,
  OnboardingStep,
  ClassificationResult,
  LegalIdentificationRequest,
  DiagnosticRequest,
  OnboardingPlanCatalog,
  OnboardingDocumentsResponse,
  OnboardingContract,
  OnboardingSummary,
  ContractStatus,
} from "@/services/commercial/OnboardingService";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import { LegalDocumentsService, LegalDocument } from "@/services/LegalDocumentsService";
import { extractApiError, FieldErrors, getLastSeenRejection, markRejectionSeen } from "./onboarding.shared";
import { TermsStep } from "./steps/1-TermsStep";
import { LegalIdentificationStep, LegalIdentificationForm } from "./steps/2-LegalIdentificationStep";
import { DiagnosticStep, DiagnosticForm } from "./steps/3-DiagnosticStep";
import { ClassificationStep } from "./steps/4-ClassificationStep";
import { PlanStep } from "./steps/5-PlanStep";
import { DocumentsStep } from "./steps/6-DocumentsStep";
import { ContractGenerateStep } from "./steps/7-ContractGenerateStep";
import { ContractReviewStep } from "./steps/8-ContractReviewStep";
import { VeryGanaReviewStep } from "./steps/9-VeryGanaReviewStep";

const STEP_LABELS = ["Términos", "Identificación", "Diagnóstico", "Clasificación", "Plan", "Documentos", "Contrato"];

type WizardStep = Exclude<OnboardingStep, "COMPLETED">;

const STEP_INDEX: Record<WizardStep, number> = {
  TERMS_PENDING: 0,
  LEGAL_IDENTIFICATION_PENDING: 1,
  DIAGNOSTIC_PENDING: 2,
  CLASSIFICATION_PENDING: 3,
  PLAN_PENDING: 4,
  DOCUMENTS_PENDING: 5,
  CONTRACT_PENDING: 6,
  BUSINESS_REVIEW_PENDING: 6,
  VERYGANA_REVIEW_PENDING: 6,
};

// Modal bloqueante — se muestra una sola vez por cada rechazo nuevo
// (comparando rejectedAt contra localStorage), sin importar si el rechazo
// fue documental o no.
function RejectionModal({ reason, onClose }: { reason: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tu contrato fue rechazado</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{reason}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm bg-[#0b1440] text-white hover:brightness-110 transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// Banner persistente — se queda visible mientras contractStatus siga siendo
// REJECTED, para que el usuario recuerde por qué está ahí aunque vuelva en
// otra sesión sin necesidad de reabrir el modal.
function RejectionBanner({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-800 mb-0.5">Contrato rechazado</p>
        <p className="text-sm text-red-700 leading-relaxed">{reason}</p>
      </div>
    </div>
  );
}

// Barra fija de contacto — visible en todos los pasos del onboarding
// (incluida la pantalla de "cuenta en revisión"). Los datos salen de env
// para poder cambiarlos sin tocar código.
function ContactBar() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "soporte@VerYGana.com";
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+57 (300) 123-4567";
  const year = process.env.NEXT_PUBLIC_CONTACT_COPYRIGHT_YEAR || "2026";
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 px-4 py-2 text-center">
      <p className="text-xs text-gray-500">
        Email: {email} · Tel: {phone}
      </p>
      <p className="text-[11px] text-gray-400">© {year} VerYGana. Todos los derechos reservados.</p>
    </div>
  );
}

interface Props {
  initialStatus: OnboardingStatus;
  onCompleted: () => void;
}

export function OnboardingWizard({ initialStatus, onCompleted }: Props) {
  const [step, setStep] = useState<WizardStep>(
    initialStatus.currentStep === "COMPLETED" ? "CLASSIFICATION_PENDING" : initialStatus.currentStep
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDocument, setTermsDocument] = useState<LegalDocument | null>(null);
  const [termsLoadError, setTermsLoadError] = useState(false);
  const [legalForm, setLegalForm] = useState<LegalIdentificationForm>({});
  const [diagnosticForm, setDiagnosticForm] = useState<DiagnosticForm>({});
  const [classification, setClassification] = useState<ClassificationResult | null>(
    initialStatus.classification
  );
  const [planCatalog, setPlanCatalog] = useState<OnboardingPlanCatalog | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode | null>(null);
  const [documents, setDocuments] = useState<OnboardingDocumentsResponse | null>(null);
  const [contract, setContract] = useState<OnboardingContract | null>(null);
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string | null>(null);
  const [underReview, setUnderReview] = useState(false);

  // Rechazo de VerYGana a nivel de status (distinto del rechazo a nivel de
  // contrato de arriba) — documentsCompleted decide si hay autoservicio
  // (corregir documentos) o no (currentStep se queda en VERYGANA_REVIEW_PENDING).
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(initialStatus.contractStatus);
  const [documentsCompleted, setDocumentsCompleted] = useState(initialStatus.documentsCompleted);
  const [rejectionReason, setRejectionReason] = useState<string | null>(initialStatus.rejectionReason);
  const [rejectedAt, setRejectedAt] = useState<string | null>(initialStatus.rejectedAt);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Evitan el doble llamado que provoca React Strict Mode en dev (monta ->
  // limpia -> vuelve a montar cada efecto): como el fetch es async, en la
  // segunda pasada el estado ("!termsDocument", "!plan", etc.) todavía no
  // se actualizó, así que ese chequeo solo no alcanza para bloquearla.
  const hasLoadedTermsRef = useRef(false);
  const hasLoadedClassificationRef = useRef(false);
  const hasLoadedPlanRef = useRef(false);
  const hasLoadedDocumentsRef = useRef(false);
  const hasLoadedContractRef = useRef(false);
  const hasLoadedContractRecoveryRef = useRef(false);
  const hasLoadedSummaryRef = useRef(false);

  const handleApiError = (err: unknown) => {
    const { message, details } = extractApiError(err);
    setErrors(details);
    toast.error(message);
  };

  // Sincroniza el estado de rechazo cada vez que llega un OnboardingStatus
  // fresco (montaje inicial, o cualquier getStatus() posterior) y decide si
  // hay que abrir el modal bloqueante (rechazo nuevo o nunca visto).
  const syncRejectionState = (status: OnboardingStatus) => {
    setContractStatus(status.contractStatus);
    setDocumentsCompleted(status.documentsCompleted);
    setRejectionReason(status.rejectionReason);
    setRejectedAt(status.rejectedAt);
    if (status.contractStatus === "REJECTED" && status.rejectedAt) {
      if (getLastSeenRejection() !== status.rejectedAt) {
        setShowRejectionModal(true);
      }
    }
  };

  useEffect(() => {
    syncRejectionState(initialStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al avanzar de paso (formularios largos como identificación legal dejan
  // el scroll abajo) volvemos siempre al inicio de la página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleCloseRejectionModal = () => {
    if (rejectedAt) markRejectionSeen(rejectedAt);
    setShowRejectionModal(false);
  };

  // Bloquea el scroll de la página de fondo mientras el modal de rechazo
  // está abierto (es bloqueante, no debería poder desplazarse detrás de él).
  useEffect(() => {
    if (!showRejectionModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showRejectionModal]);

  const loadTermsDocument = () => {
    setTermsLoadError(false);
    LegalDocumentsService.getByType("BUSINESS_OWNER_TERMS_AND_CONDITIONS")
      .then(setTermsDocument)
      .catch(() => setTermsLoadError(true));
  };

  useEffect(() => {
    if (step === "TERMS_PENDING" && !termsDocument && !termsLoadError) {
      if (hasLoadedTermsRef.current) return;
      hasLoadedTermsRef.current = true;
      loadTermsDocument();
    }
  }, [step, termsDocument, termsLoadError]);

  // Recuperación ante recarga: si llegamos a CLASSIFICATION_PENDING sin
  // clasificación en memoria (ej. status inicial vino sin classification),
  // la pedimos explícitamente en vez de bloquear al usuario.
  useEffect(() => {
    if (step === "CLASSIFICATION_PENDING" && !classification) {
      if (hasLoadedClassificationRef.current) return;
      hasLoadedClassificationRef.current = true;
      OnboardingService.getClassification()
        .then(setClassification)
        .catch((err) => handleApiError(err));
    }
  }, [step, classification]);

  useEffect(() => {
    if (step === "PLAN_PENDING" && !planCatalog) {
      if (hasLoadedPlanRef.current) return;
      hasLoadedPlanRef.current = true;
      OnboardingService.getPlan()
        .then((catalog) => {
          setPlanCatalog(catalog);
          setSelectedPlanCode(catalog.recommendedPlanCode);
        })
        .catch((err) => handleApiError(err));
    }
  }, [step, planCatalog]);

  useEffect(() => {
    if (step === "DOCUMENTS_PENDING" && !documents) {
      if (hasLoadedDocumentsRef.current) return;
      hasLoadedDocumentsRef.current = true;
      OnboardingService.getDocuments()
        .then(setDocuments)
        .catch((err) => handleApiError(err));
    }
  }, [step, documents]);

  useEffect(() => {
    if ((step === "BUSINESS_REVIEW_PENDING" || step === "VERYGANA_REVIEW_PENDING") && !contract) {
      if (hasLoadedContractRef.current) return;
      hasLoadedContractRef.current = true;
      OnboardingService.getContract()
        .then(setContract)
        .catch((err) => handleApiError(err));
    }
  }, [step, contract]);

  // Si recargamos justo en CONTRACT_PENDING, puede ser porque VerYGana
  // rechazó una versión anterior — traemos el contrato previo en silencio
  // para mostrar el motivo, sin molestar a quien nunca generó uno.
  useEffect(() => {
    if (step === "CONTRACT_PENDING" && rejectionNotes === null && !contract) {
      if (hasLoadedContractRecoveryRef.current) return;
      hasLoadedContractRecoveryRef.current = true;
      OnboardingService.getContract()
        .then((c) => {
          setContract(c);
          if (c.status === "REJECTED") setRejectionNotes(c.veryganaDecisionNotes ?? null);
        })
        .catch(() => { /* aún no se ha generado un contrato — nada que mostrar */ });
    }
  }, [step, rejectionNotes, contract]);

  // Resumen de solo lectura para la pantalla de revisión previa a generar
  // el contrato real.
  useEffect(() => {
    if (step === "CONTRACT_PENDING" && !summary) {
      if (hasLoadedSummaryRef.current) return;
      hasLoadedSummaryRef.current = true;
      OnboardingService.getSummary()
        .then(setSummary)
        .catch((err) => handleApiError(err));
    }
  }, [step, summary]);

  const handleAcceptTerms = async () => {
    if (!termsAccepted || !termsDocument || submitting) return;
    setSubmitting(true);
    setErrors({});
    try {
      await OnboardingService.acceptTerms({
        termsVersion: termsDocument.version,
        accepted: true,
      });
      setStep("LEGAL_IDENTIFICATION_PENDING");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLegalIdentification = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    try {
      // companyName/nit ya no se fuerzan a undefined para NATURAL — son
      // opcionales para ese tipo (el backend autocompleta companyName con el
      // nombre del representante legal si no se envía), pero si el usuario
      // los indicó igual se respetan.
      const result = await OnboardingService.submitLegalIdentification(legalForm as LegalIdentificationRequest);
      // Declarar PEP (o un hit de screening) manda la cuenta a revisión manual
      // de cumplimiento en este punto, en vez de avanzar al diagnóstico.
      if (result?.underReview === true || result?.status === "PENDING_REVIEW") {
        setUnderReview(true);
        return;
      }
      setStep("DIAGNOSTIC_PENDING");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDiagnostic = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    try {
      // Si el usuario marcó alguna necesidad de integración técnica, solo esa
      // pregunta + su detalle aplican — el resto del diagnóstico se ignora y
      // el backend calcula Ruta D directo, saltando clasificación y plan.
      const hasTechNeeds = (diagnosticForm.techIntegrationNeeds || []).length > 0;
      const payload: DiagnosticRequest = hasTechNeeds
        ? {
            techIntegrationNeeds: diagnosticForm.techIntegrationNeeds!,
            integrationDetails: diagnosticForm.integrationDetails,
          }
        : { ...diagnosticForm, integrationDetails: undefined } as DiagnosticRequest;
      const result = await OnboardingService.submitDiagnostic(payload);
      setClassification(result);
      // No asumimos el próximo paso: para Ruta D el backend salta directo a
      // DOCUMENTS_PENDING (sin pantallas de clasificación ni de plan).
      const status = await OnboardingService.getStatus();
      syncRejectionState(status);
      setStep(status.currentStep as WizardStep);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmClassification = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await OnboardingService.confirmClassification();
      setStep("PLAN_PENDING");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptPlan = async (investmentAmountCents?: number, contractDurationMonths?: number) => {
    if (submitting || !selectedPlanCode) return;
    setSubmitting(true);
    try {
      await OnboardingService.acceptPlan({ planCode: selectedPlanCode, investmentAmountCents, contractDurationMonths });
      setStep("DOCUMENTS_PENDING");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentsNext = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Subir/confirmar el último documento requerido ya no avanza el paso
      // por sí solo (eso quedaba atascado al volver a este tab después de un
      // request-changes sin necesitar tocar documentos) — hay que confirmar
      // explícitamente que se quiere continuar.
      await OnboardingService.continueDocuments();
      const status = await OnboardingService.getStatus();
      syncRejectionState(status);
      if (status.completed) {
        onCompleted();
        return;
      }
      setStep(status.currentStep as WizardStep);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateContract = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await OnboardingService.generateContract();
      setContract(result);
      setRejectionNotes(null);
      // El banner de rechazo del status desaparece apenas se regenera el
      // contrato — no hace falta esperar otro getStatus() para eso.
      setContractStatus(result.status);
      setStep("BUSINESS_REVIEW_PENDING");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenContract = async () => {
    try {
      const fresh = await OnboardingService.getContract();
      setContract(fresh);
      window.open(fresh.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleApproveContract = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await OnboardingService.approveContract();
      setContract(result);
      setStep("VERYGANA_REVIEW_PENDING");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestContractChanges = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const nextStep = await OnboardingService.requestContractChanges();
      if (nextStep === "COMPLETED") {
        onCompleted();
        return;
      }
      setStep(nextStep as WizardStep);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshVeryGanaStatus = async () => {
    try {
      const status = await OnboardingService.getStatus();
      syncRejectionState(status);
      if (status.completed) {
        toast.success("¡Tu contrato fue aprobado! Tu cuenta ya está activa.");
        onCompleted();
        return;
      }
      if (status.currentStep === "VERYGANA_REVIEW_PENDING") {
        // Si lo que cambió fue un rechazo no documental, el banner/pantalla
        // fija ya lo comunican — no hace falta el toast genérico de "sigue
        // en revisión".
        if (status.contractStatus !== "REJECTED") {
          toast("Tu contrato sigue en revisión.");
        }
        return;
      }
      if (status.currentStep === "CONTRACT_PENDING") {
        try {
          const freshContract = await OnboardingService.getContract();
          setContract(freshContract);
          setRejectionNotes(freshContract.veryganaDecisionNotes ?? null);
        } catch {
          /* sin contrato aún — nada que mostrar */
        }
      }
      setStep(status.currentStep as WizardStep);
    } catch (err) {
      handleApiError(err);
    }
  };

  if (underReview) {
    return (
      <div className="max-w-2xl mx-auto pb-14">
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta en revisión</h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                Hemos recibido tu información. Nuestro equipo de cumplimiento la revisará y te
                notificaremos cuando tu cuenta esté activa.
              </p>
              <p className="text-gray-400 text-xs mt-3">Este proceso puede tardar algunos días hábiles.</p>
            </div>
          </div>
        </div>
        <ContactBar />
      </div>
    );
  }

  const currentIndex = STEP_INDEX[step];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-14">
      {showRejectionModal && rejectionReason && (
        <RejectionModal reason={rejectionReason} onClose={handleCloseRejectionModal} />
      )}

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Completa tu registro comercial</h2>
        <p className="text-sm text-gray-500">
          Antes de acceder a tu panel, necesitamos algunos datos adicionales.
        </p>
      </div>

      {contractStatus === "REJECTED" && rejectionReason && (
        <RejectionBanner reason={rejectionReason} />
      )}

      {/* Stepper */}
      <div className="bg-white rounded-lg shadow-md px-3 sm:px-6 py-4 overflow-x-auto sm:overflow-visible">
        <div className="flex items-center min-w-fit sm:min-w-0">
          {STEP_LABELS.map((label, i) => {
            const done = currentIndex > i;
            const active = currentIndex === i;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      done
                        ? "bg-blue-600 text-white shadow-sm"
                        : active
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={3} className="sm:w-4 sm:h-4" /> : <span className="text-xs sm:text-sm">{i + 1}</span>}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:block ${
                      active ? "text-blue-600" : done ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-4 sm:flex-1 h-0.5 mx-1 sm:mx-3 mb-5 transition-all duration-500 ${
                      done ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        {step === "TERMS_PENDING" && (
          <TermsStep
            document={termsDocument}
            loadError={termsLoadError}
            onRetry={loadTermsDocument}
            accepted={termsAccepted}
            onAcceptedChange={setTermsAccepted}
            submitting={submitting}
            error={errors["accepted"]}
            onNext={handleAcceptTerms}
          />
        )}

        {step === "LEGAL_IDENTIFICATION_PENDING" && (
          <LegalIdentificationStep
            form={legalForm}
            errors={errors}
            submitting={submitting}
            onChange={(field, value) => setLegalForm((prev) => ({ ...prev, [field]: value }))}
            onNext={handleSubmitLegalIdentification}
          />
        )}

        {step === "DIAGNOSTIC_PENDING" && (
          <DiagnosticStep
            form={diagnosticForm}
            errors={errors}
            submitting={submitting}
            onChange={(field, value) => setDiagnosticForm((prev) => ({ ...prev, [field]: value }))}
            onNext={handleSubmitDiagnostic}
          />
        )}

        {step === "CLASSIFICATION_PENDING" && classification && (
          <ClassificationStep
            classification={classification}
            submitting={submitting}
            onConfirm={handleConfirmClassification}
          />
        )}

        {step === "PLAN_PENDING" && (
          <PlanStep
            catalog={planCatalog}
            selectedPlanCode={selectedPlanCode}
            onSelectPlan={setSelectedPlanCode}
            submitting={submitting}
            onAccept={handleAcceptPlan}
          />
        )}

        {step === "DOCUMENTS_PENDING" && documents && (
          <DocumentsStep
            data={documents}
            submitting={submitting}
            onDataChange={setDocuments}
            onNext={handleDocumentsNext}
          />
        )}
        {step === "DOCUMENTS_PENDING" && !documents && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        )}

        {step === "CONTRACT_PENDING" && (
          <ContractGenerateStep
            summary={summary}
            submitting={submitting}
            onGenerate={handleGenerateContract}
            onRequestChanges={handleRequestContractChanges}
            rejectionNotes={rejectionNotes}
          />
        )}

        {step === "BUSINESS_REVIEW_PENDING" && contract && (
          <ContractReviewStep
            contract={contract}
            submitting={submitting}
            onOpenContract={handleOpenContract}
            onApprove={handleApproveContract}
          />
        )}
        {step === "BUSINESS_REVIEW_PENDING" && !contract && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        )}

        {step === "VERYGANA_REVIEW_PENDING" && (
          <VeryGanaReviewStep
            contract={contract}
            onRefresh={handleRefreshVeryGanaStatus}
            rejected={contractStatus === "REJECTED" && documentsCompleted}
            rejectionReason={rejectionReason}
          />
        )}
      </div>

      <ContactBar />
    </div>
  );
}
