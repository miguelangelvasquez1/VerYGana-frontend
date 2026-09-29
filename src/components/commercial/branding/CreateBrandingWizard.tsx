'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createBrandingRequest,
  getUploadUrl,
  uploadFileToR2,
  confirmUpload,
  configureBranding,
  submitBrandingRequest,
  getBriefRequirements,
  saveBrief,
  type GameBriefRequirements,
  type BrandingGame,
  type BrandingConfigDto,
  type BrandingRequest,
} from '@/services/BrandingRequestService';
import type { FileEntry, Step1Form, Step3Form } from './branding.types';
import { usePlanState } from '../layout/DashboardLayout';
import { GameCatalog } from './GameCatalog';
import { Step1BrandInfo } from './steps/Step1BrandInfo';
import { Step2Resources } from './steps/Step2Resources';
import { Step3Config } from './steps/Step3Config';
import { Step4Submit } from './steps/Step4Submit';
import { StepGameContent } from './steps/StepGameContent';

/**
 * El paso de contenido solo existe para los juegos que piden algo que únicamente la
 * marca puede dar —las preguntas de la trivia, las palabras de la sopa de letras,
 * las cartas del memoria—. El backend lo dice devolviendo un esquema recortado; si
 * viene en null, el juego no pide nada y el paso no se muestra.
 */
type StepKey = 'brand' | 'resources' | 'content' | 'config' | 'submit';

const STEP_LABELS: Record<StepKey, string> = {
  brand: 'Marca',
  resources: 'Recursos',
  content: 'Contenido',
  config: 'Configuración',
  submit: 'Enviar',
};

interface Props {
  onBack: () => void;
  onComplete: () => void;
}

export const CreateBrandingWizard: React.FC<Props> = ({ onBack, onComplete }) => {
  const { refreshPlanState } = usePlanState();
  const [showCatalog, setShowCatalog] = useState(true);
  const [selectedGame, setSelectedGame] = useState<BrandingGame | null>(null);
  const [step, setStep] = useState<StepKey>('brand');
  const [briefReqs, setBriefReqs] = useState<GameBriefRequirements | null>(null);
  const [briefContent, setBriefContent] = useState<Record<string, unknown>>({});
  const [requestId, setRequestId] = useState<number | null>(null);
  const [createdRequest, setCreatedRequest] = useState<BrandingRequest | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [step1, setStep1] = useState<Step1Form>({
    brandName: '',
    brandDescription: '',
    targetUrl: '',
    budgetPesos: '',
    campaignGoal: '',
  });
  const [step1Errors, setStep1Errors] = useState<Partial<Step1Form>>({});

  // Se consulta al elegir el juego, no al llegar al paso: el stepper tiene que saber
  // de entrada cuántos pasos hay, o cambiaría de largo a mitad del recorrido.
  useEffect(() => {
    if (!selectedGame) return;
    const controller = new AbortController();
    getBriefRequirements(selectedGame.id, controller.signal)
      .then(setBriefReqs)
      .catch(() => {
        // Un fallo acá no puede bloquear la solicitud: se sigue sin el paso y el
        // envío avisará si al juego le falta contenido.
        setBriefReqs(null);
      });
    return () => controller.abort();
  }, [selectedGame]);

  const [step3, setStep3] = useState<Step3Form>({
    targetGender: 'ALL',
    minAge: '',
    maxAge: '',
    maxSessionsPerUserPerDay: '',
    startDate: '',
    categoryIds: [],
    municipalityCodes: [],
  });

  // ── Step 1 ────────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: Partial<Step1Form> = {};
    if (!step1.brandName.trim()) e.brandName = 'El nombre de marca es requerido';
    else if (step1.brandName.length > 200) e.brandName = 'Máximo 200 caracteres';
    if (!step1.brandDescription.trim()) e.brandDescription = 'La descripción es requerida';
    else if (step1.brandDescription.length > 1000) e.brandDescription = 'Máximo 1000 caracteres';
    if (step1.targetUrl) {
      if (step1.targetUrl.length > 500) {
        e.targetUrl = 'Máximo 500 caracteres';
      } else {
        try {
          const parsed = new URL(step1.targetUrl.trim());
          if (!['http:', 'https:'].includes(parsed.protocol))
            e.targetUrl = 'La URL debe comenzar con http:// o https://';
        } catch {
          e.targetUrl = 'Ingresa una URL válida (ej: https://www.tumarca.com)';
        }
      }
    }
    if (!step1.budgetPesos || isNaN(Number(step1.budgetPesos)) || Number(step1.budgetPesos) <= 0)
      e.budgetPesos = 'Ingresa un presupuesto mayor a 0';
    if (!step1.campaignGoal) e.campaignGoal = 'El objetivo de campaña es requerido';
    setStep1Errors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Next = async () => {
    if (!selectedGame || !validateStep1()) return;
    // Request already created — skip POST and just advance
    if (requestId !== null) {
      goTo('resources');
      return;
    }
    setSubmitting(true);
    try {
      const req = await createBrandingRequest({
        gameId: selectedGame.id,
        brandName: step1.brandName.trim(),
        brandDescription: step1.brandDescription.trim(),
        targetUrl: step1.targetUrl.trim() || undefined,
        budgetCents: Math.round(Number(step1.budgetPesos) * 100),
        campaignGoal: step1.campaignGoal || undefined,
      });
      setRequestId(req.id);
      setCreatedRequest(req);
      await refreshPlanState();
      goTo('resources');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2 ────────────────────────────────────────────────────────────────

  const uploadFile = async (file: File) => {
    if (!requestId) return;
    const localId = crypto.randomUUID();
    setFiles(prev => [...prev, { localId, file, status: 'uploading' }]);
    try {
      const urlRes = await getUploadUrl(requestId, {
        originalFileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      await uploadFileToR2(urlRes.permission.uploadUrl, file);
      await confirmUpload(requestId, urlRes.resourceId);
      setFiles(prev =>
        prev.map(f =>
          f.localId === localId ? { ...f, status: 'confirmed', resourceId: urlRes.resourceId } : f
        )
      );
      toast.success(`${file.name} subido correctamente`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al subir el archivo';
      setFiles(prev =>
        prev.map(f => (f.localId === localId ? { ...f, status: 'error', error: msg } : f))
      );
    }
  };

  // ── Step 3 ────────────────────────────────────────────────────────────────

  const handleStep3Next = async () => {
    if (!requestId) return;
    setSubmitting(true);
    try {
      const dto: BrandingConfigDto = {};
      if (step3.targetGender) dto.targetGender = step3.targetGender;
      if (step3.minAge) dto.minAge = Number(step3.minAge);
      if (step3.maxAge) dto.maxAge = Number(step3.maxAge);
      if (step3.maxSessionsPerUserPerDay)
        dto.maxSessionsPerUserPerDay = Number(step3.maxSessionsPerUserPerDay);
      if (step3.startDate) dto.startDate = new Date(step3.startDate).toISOString();
      if (step3.categoryIds.length > 0) dto.categoryIds = step3.categoryIds;
      if (step3.municipalityCodes.length > 0) dto.municipalityCodes = step3.municipalityCodes;
      if (Object.keys(dto).length > 0) await configureBranding(requestId, dto);
      goTo('submit');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 4 ────────────────────────────────────────────────────────────────

  const handleSubmit = async (designerNote: string) => {
    if (!requestId) return;
    setSubmitting(true);
    try {
      await submitBrandingRequest(requestId, designerNote.trim() || undefined);
      toast.success('¡Solicitud enviada!');
      onComplete();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const steps: StepKey[] = [
    'brand',
    'resources',
    ...(briefReqs?.jsonSchema ? (['content'] as StepKey[]) : []),
    'config',
    'submit',
  ];
  const stepIndex = steps.indexOf(step);
  const goTo = (key: StepKey) => setStep(key);
  const goNext = () => setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  const goBack = () => setStep(steps[Math.max(stepIndex - 1, 0)]);

  const handleContentNext = async () => {
    if (!requestId) return;
    setSubmitting(true);
    try {
      await saveBrief(requestId, briefContent);
      goNext();
    } catch (err: any) {
      // El mensaje del backend nombra la cantidad que falta ("al menos 10 preguntas"),
      // que es lo único accionable para el anunciante.
      toast.error(err?.response?.data?.message || 'Revisa el contenido del juego');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmedCount = files.filter(f => f.status === 'confirmed').length;

  // ── Catalog view ──────────────────────────────────────────────────────────

  if (showCatalog) {
    return (
      <GameCatalog
        onBack={onBack}
        onSelect={game => {
          setSelectedGame(game);
          setShowCatalog(false);
        }}
      />
    );
  }

  if (!selectedGame) return null;

  // ── Form view ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Nueva Solicitud de Branding</h2>
          <p className="text-sm text-gray-500">Integra tu marca en un videojuego de la plataforma</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-lg shadow-md px-6 py-4">
        <div className="flex items-center">
          {steps.map((key, i) => {
            const done = stepIndex > i;
            const active = stepIndex === i;
            return (
              <React.Fragment key={key}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      done
                        ? 'bg-blue-600 text-white shadow-sm'
                        : active
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : <span className="text-sm">{i + 1}</span>}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:block ${
                      active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {STEP_LABELS[key]}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 mb-5 transition-all duration-500 ${
                      done ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      {step === 'brand' && (
        <Step1BrandInfo
          selectedGame={selectedGame}
          form={step1}
          errors={step1Errors}
          submitting={submitting}
          requestId={requestId}
          onChange={(field, value) => {
            setStep1(p => ({ ...p, [field]: value }));
            if (step1Errors[field]) setStep1Errors(p => ({ ...p, [field]: undefined }));
          }}
          onNext={handleStep1Next}
          onChangeGame={() => setShowCatalog(true)}
        />
      )}

      {step === 'resources' && (
        <Step2Resources
          requiredCount={briefReqs?.requiredResourceCount ?? 0}
          requiredLabel={briefReqs?.requiredResourceLabel ?? null}
          files={files}
          onUpload={uploadFile}
          onRemoveFile={localId => setFiles(prev => prev.filter(f => f.localId !== localId))}
          onBack={() => goTo('brand')}
          onNext={goNext}
        />
      )}

      {step === 'content' && briefReqs?.jsonSchema && selectedGame && (
        <StepGameContent
          requirements={briefReqs}
          gameName={selectedGame.title}
          requestId={requestId}
          content={briefContent}
          submitting={submitting}
          onChange={setBriefContent}
          onBack={goBack}
          onNext={handleContentNext}
        />
      )}

      {step === 'config' && (
        <Step3Config
          form={step3}
          submitting={submitting}
          onChange={(field, value) =>
            setStep3(prev => ({ ...prev, [field]: value }))
          }
          onChangeCategoryIds={ids => setStep3(prev => ({ ...prev, categoryIds: ids }))}
          onChangeMunicipalityCodes={codes => setStep3(prev => ({ ...prev, municipalityCodes: codes }))}
          onBack={goBack}
          onSkip={() => goTo('submit')}
          onNext={handleStep3Next}
        />
      )}

      {step === 'submit' && (
        <Step4Submit
          selectedGame={selectedGame}
          step1Form={step1}
          confirmedCount={confirmedCount}
          submitting={submitting}
          estimatedSessions={createdRequest?.estimatedSessions ?? null}
          averageRewardPerSessionCents={createdRequest?.averageRewardPerSessionCents ?? null}
          scoreRewardFactor={createdRequest?.scoreRewardFactor ?? null}
          onBack={goBack}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
