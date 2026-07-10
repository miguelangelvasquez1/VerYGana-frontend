'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  X, ChevronLeft, ChevronRight, Loader2, Trophy,
  Tag, HelpCircle, AlertCircle, Building2, Users, Clock,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSurveyDetail, useStartSurvey, useSubmitSurvey } from '@/hooks/surveys/useSurvey';
import { formatKeys, formatDate, getSpotsRemaining } from '@/hooks/surveys/surveyUtils';
import { levelService } from '@/services/LevelService';
import QuestionRenderer from './QuestionRenderer';
import SurveyCompletionScreen from './SurveyCompletionScreen';
import type { XpRewardData } from '@/components/levels/XpRewardToast';

import type {
  AnswerRequest,
  SubmissionResult,
  SurveyDetailDTO,
  SurveySessionDTO,
} from '@/types/survey.types';

interface Props {
  surveyId: number;
  onClose: () => void;
  showReward?: (data: XpRewardData) => void;
}

type Phase = 'preview' | 'questions' | 'done';

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function SurveyPlayerModal({ surveyId, onClose, showReward }: Props) {
  const { data: session } = useSession()
  const [phase, setPhase]             = useState<Phase>('preview');
  const [sessionId, setSessionId]     = useState<number | null>(null);
  const [sessionSurvey, setSessionSurvey] = useState<SurveySessionDTO | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers]         = useState<Map<number, AnswerRequest>>(new Map());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult]           = useState<SubmissionResult | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const detailQuery    = useSurveyDetail(surveyId, phase !== 'preview');
  const startMutation  = useStartSurvey();
  const submitMutation = useSubmitSurvey(surveyId);

  const questions = sessionSurvey?.questions ?? [];
  const totalQ    = questions.length;
  const currentQ  = questions[currentStep];

  // ── Answers ──────────────────────────────────────────────────────────────

  const setAnswer = useCallback((questionId: number, answer: Partial<AnswerRequest>) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, { questionId, ...answer });
      return next;
    });
    setValidationError(null);
  }, []);

  const currentAnswer = currentQ ? answers.get(currentQ.id) : undefined;

  // ── Validation ───────────────────────────────────────────────────────────

  function validateStep(): boolean {
    if (!currentQ || !currentQ.required) return true;
    const ans = answers.get(currentQ.id);
    if (!ans) { setValidationError('Esta pregunta es obligatoria'); return false; }

    switch (currentQ.type) {
      case 'TEXT':
        if (!ans.textAnswer?.trim()) { setValidationError('Por favor escribe tu respuesta'); return false; }
        break;
      case 'RATING':
        if (!ans.textAnswer) { setValidationError('Por favor selecciona una calificación'); return false; }
        break;
      case 'SINGLE_CHOICE':
        if (!ans.selectedOptionId) { setValidationError('Por favor selecciona una opción'); return false; }
        break;
      case 'YES_NO':
        if (!ans.textAnswer) { setValidationError('Por favor selecciona una opción'); return false; }
        break;
      case 'MULTIPLE_CHOICE':
        if (!ans.selectedOptionIds?.length) { setValidationError('Por favor selecciona al menos una opción'); return false; }
        break;
    }
    return true;
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => { if (validateStep() && currentStep < totalQ - 1) setCurrentStep((s) => s + 1); };
  const goPrev = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleStart() {
    startMutation.mutate(surveyId, {
      onSuccess: (data: { sessionId: number; survey: SurveySessionDTO }) => {
        setSessionId(data.sessionId);
        setSessionSurvey(data.survey);
        setPhase('questions');
      },
    });
  }

  async function handleSubmit() {
    if (!validateStep() || !sessionId) return;
    try {
      const res = await submitMutation.mutateAsync({
        sessionId,
        answers: Array.from(answers.values()),
      });
      setResult(res);
      setPhase('done');

      const token = session?.accessToken as string | undefined;
      if (token && showReward) {
        Promise.all([
          levelService.getProfile(token),
          levelService.getHistory(token, 0, 1),
        ]).then(([profile, history]) => {
          const latest = history.content[0];
          if (!latest) return;
          showReward({
            activityType: 'SURVEY_COMPLETED',
            xpEarned:     latest.xpEarned,
            multiplier:   latest.multiplierApplied,
            currentLevel: profile.currentLevel,
            xpTotal:      profile.xpTotal,
            xpToNextLevel: profile.xpToNextLevel,
          });
        }).catch(() => {/* non-critical */});
      }
    } catch { /* handled by mutation.isError */ }
  }

  const isLastStep = currentStep === totalQ - 1;
  const progress   = totalQ > 0 ? ((currentStep + 1) / totalQ) * 100 : 0;

  if (phase === 'questions') {
    /* ── Questions: true full-screen takeover on mobile (covers the app
       header/bottom nav — screen real estate is too tight to spare them),
       confined below the header on desktop where there's room to spare.
       `fixed` (not `absolute`) so the panel is always exactly one viewport
       tall regardless of how long the underlying page content is — an
       `absolute` panel inside `<main>` would inherit main's full scrollable
       height whenever the page content is taller than the screen, pushing
       the footer buttons below the fold while background scroll is locked. */
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white animate-screenIn lg:top-[76px] lg:z-40">

        {/* Header */}
        <div className="shrink-0 border-b border-gray-100 px-6 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-10 md:pt-4 lg:pt-4">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#03548C]/60">
                Pregunta {currentStep + 1} de {totalQ}
              </p>
              <h2 className="truncate text-sm font-bold text-gray-900 md:text-base">
                {sessionSurvey?.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer shrink-0 rounded-xl p-2 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-2 shrink-0 w-full overflow-hidden bg-gray-100">
          <div
            className="h-full rounded-r-full bg-[#03548C] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-6 py-10 md:px-10 md:py-16">
          <div className="mx-auto flex w-full max-w-2xl">
            {currentQ ? (
              <div key={currentQ.id} className="w-full animate-questionIn">
                <QuestionRenderer
                  question={currentQ}
                  answer={currentAnswer}
                  onChange={setAnswer}
                  error={validationError}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-10 md:pb-4">
          {submitMutation.isError && (
            <p className="mb-3 text-center text-xs text-red-500">
              Error al enviar la encuesta. Intenta de nuevo.
            </p>
          )}
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <div className="flex-1" />
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="cursor-pointer flex items-center gap-2 rounded-xl bg-[#03548C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0b1440] disabled:opacity-60 active:scale-95 transition-all"
              >
                {submitMutation.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trophy className="h-4 w-4" />}
                {submitMutation.isPending ? 'Enviando…' : 'Enviar y ganar'}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="cursor-pointer flex items-center gap-1 rounded-xl bg-[#03548C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0b1440] active:scale-95 transition-all"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    /* ── Preview / Done: compact centered dialog over a dimmed backdrop ──── */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={phase === 'done' ? onClose : undefined}
      />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-[#0b1440] to-[#03548C]" />

        {phase === 'done' && result && (
          <SurveyCompletionScreen result={result} onClose={onClose} />
        )}

        {phase === 'preview' && (
          <PreviewScreen
            survey={detailQuery.data ?? null}
            isLoading={detailQuery.isLoading}
            isStarting={startMutation.isPending}
            startError={startMutation.isError ? startMutation.error : null}
            onStart={handleStart}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ─── Preview screen ───────────────────────────────────────────────────────────

function PreviewScreen({
  survey,
  isLoading,
  isStarting,
  startError,
  onStart,
  onClose,
}: {
  survey: SurveyDetailDTO | null;
  isLoading: boolean;
  isStarting: boolean;
  startError: Error | null;
  onStart: () => void;
  onClose: () => void;
}) {
  const errorMessage = startError ? getStartErrorMessage(startError) : null;
  const spotsRemaining = survey ? getSpotsRemaining(survey.maxResponses, survey.responseCount) : null;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pb-5 pt-6">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="h-5 w-40 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <>
              <h2 className="text-xl font-black leading-snug text-gray-900">
                {survey?.title}
              </h2>
              {survey?.companyName && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
                  <Building2 className="h-3.5 w-3.5" />
                  Patrocinado por {survey.companyName}
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer ml-3 shrink-0 rounded-xl p-2 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 pb-5 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#03548C]" />
          </div>
        ) : survey ? (
          <>
            {/* Reward highlight */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0b1440] via-[#03548C] to-[#0b1440] p-5 text-white shadow-lg shadow-[#03548C]/20">
              <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                    Recompensa total
                  </p>
                  <p className="mt-1 text-3xl font-black">{formatKeys(survey.totalRewardKeys)} llaves</p>
                  <p className="mt-1 text-xs text-white/60">
                    {survey.totalQuestions} preguntas
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Image src="/logos/llave.png" alt="Llaves" width={28} height={28} className="object-contain" />
                </div>
              </div>
            </div>

            {/* Description */}
            {survey.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {survey.description}
              </p>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetaCard
                icon={<HelpCircle className="h-4 w-4" />}
                label="Preguntas"
                value={String(survey.totalQuestions)}
                tone="blue"
              />
              {survey.categoryNames.length > 0 && (
                <MetaCard
                  icon={<Tag className="h-4 w-4" />}
                  label="Categorías"
                  value={survey.categoryNames.join(', ')}
                  tone="purple"
                />
              )}
              {spotsRemaining !== null && (
                <MetaCard
                  icon={<Users className="h-4 w-4" />}
                  label="Cupos disponibles"
                  value={String(spotsRemaining)}
                  tone="orange"
                />
              )}
              {survey.endsAt && (
                <MetaCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Disponible hasta"
                  value={formatDate(survey.endsAt)}
                  tone="red"
                />
              )}
            </div>

            {/* Start error */}
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Footer */}
      {!isLoading && survey && (
        <div className="shrink-0 flex items-center gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onStart}
            disabled={isStarting}
            className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1440] disabled:opacity-60 active:scale-95 transition-all"
          >
            {isStarting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando…</>
              : <><Trophy className="h-4 w-4" /> Iniciar encuesta</>}
          </button>
        </div>
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const META_TONE_CLASSES = {
  blue:   'bg-[#03548C]/10 text-[#03548C]',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red:    'bg-red-50 text-red-600',
} as const;

function MetaCard({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: keyof typeof META_TONE_CLASSES;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg ${META_TONE_CLASSES[tone]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}

function getStartErrorMessage(error: Error): string {
  const status = (error as unknown as { status?: number }).status;
  if (status === 409) return 'Ya completaste esta encuesta anteriormente.';
  if (status === 400) return 'Esta encuesta no está disponible en este momento.';
  return 'No se pudo iniciar la encuesta. Intenta de nuevo.';
}
