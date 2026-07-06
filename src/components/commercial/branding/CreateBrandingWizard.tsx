'use client';

import React, { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createBrandingRequest,
  getUploadUrl,
  uploadFileToR2,
  confirmUpload,
  configureBranding,
  submitBrandingRequest,
  type BrandingGame,
  type BrandingConfigDto,
  type BrandingRequest,
} from '@/services/BrandingRequestService';
import type { FileEntry, Step1Form, Step3Form } from './branding.types';
import { GameCatalog } from './GameCatalog';
import { Step1BrandInfo } from './steps/Step1BrandInfo';
import { Step2Resources } from './steps/Step2Resources';
import { Step3Config } from './steps/Step3Config';
import { Step4Submit } from './steps/Step4Submit';

const STEPS = ['Marca', 'Recursos', 'Configuración', 'Enviar'];
type FormStep = 1 | 2 | 3 | 4;

interface Props {
  onBack: () => void;
  onComplete: () => void;
}

export const CreateBrandingWizard: React.FC<Props> = ({ onBack, onComplete }) => {
  const [showCatalog, setShowCatalog] = useState(true);
  const [selectedGame, setSelectedGame] = useState<BrandingGame | null>(null);
  const [step, setStep] = useState<FormStep>(1);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [createdRequest, setCreatedRequest] = useState<BrandingRequest | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [step1, setStep1] = useState<Step1Form>({
    brandName: '',
    brandDescription: '',
    targetUrl: '',
    budgetPesos: '',
  });
  const [step1Errors, setStep1Errors] = useState<Partial<Step1Form>>({});

  const [step3, setStep3] = useState<Step3Form>({
    targetGender: 'ALL',
    minAge: '',
    maxAge: '',
    maxSessionsPerUserPerDay: '',
    startDate: '',
    campaignGoal: '',
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
    setStep1Errors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Next = async () => {
    if (!selectedGame || !validateStep1()) return;
    // Request already created — skip POST and just advance
    if (requestId !== null) {
      setStep(2);
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
      });
      setRequestId(req.id);
      setCreatedRequest(req);
      setStep(2);
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
      if (step3.campaignGoal) dto.campaignGoal = step3.campaignGoal;
      if (step3.categoryIds.length > 0) dto.categoryIds = step3.categoryIds;
      if (step3.municipalityCodes.length > 0) dto.municipalityCodes = step3.municipalityCodes;
      if (Object.keys(dto).length > 0) await configureBranding(requestId, dto);
      setStep(4);
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
          {STEPS.map((label, i) => {
            const n = (i + 1) as FormStep;
            const done = step > n;
            const active = step === n;
            return (
              <React.Fragment key={n}>
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
                    {done ? <Check size={16} strokeWidth={3} /> : <span className="text-sm">{n}</span>}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:block ${
                      active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
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
      {step === 1 && (
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

      {step === 2 && (
        <Step2Resources
          files={files}
          onUpload={uploadFile}
          onRemoveFile={localId => setFiles(prev => prev.filter(f => f.localId !== localId))}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Step3Config
          form={step3}
          submitting={submitting}
          onChange={(field, value) =>
            setStep3(prev => ({ ...prev, [field]: value }))
          }
          onChangeCategoryIds={ids => setStep3(prev => ({ ...prev, categoryIds: ids }))}
          onChangeMunicipalityCodes={codes => setStep3(prev => ({ ...prev, municipalityCodes: codes }))}
          onBack={() => setStep(2)}
          onSkip={() => setStep(4)}
          onNext={handleStep3Next}
        />
      )}

      {step === 4 && (
        <Step4Submit
          selectedGame={selectedGame}
          step1Form={step1}
          confirmedCount={confirmedCount}
          submitting={submitting}
          estimatedSessions={createdRequest?.estimatedSessions ?? null}
          averageRewardPerSessionCents={createdRequest?.averageRewardPerSessionCents ?? null}
          scoreRewardFactor={createdRequest?.scoreRewardFactor ?? null}
          onBack={() => setStep(3)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
