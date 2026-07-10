'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Loader2, Trophy,
  Tag, HelpCircle, AlertCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSurveyDetail, useStartSurvey, useSubmitSurvey } from '@/hooks/surveys/useSurvey';
import { formatReward } from '@/hooks/surveys/surveyUtils';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={phase === 'done' ? onClose : undefined}
      />

      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* ── Done ─────────────────────────────────────────────────────── */}
        {phase === 'done' && result && (
          <SurveyCompletionScreen result={result} onClose={onClose} />
        )}

        {/* ── Preview ──────────────────────────────────────────────────── */}
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

        {/* ── Questions ────────────────────────────────────────────────── */}
        {phase === 'questions' && (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 pt-5 pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400">
                    Pregunta {currentStep + 1} de {totalQ}
                  </p>
                  <h2 className="text-base font-bold text-gray-900 truncate">
                    {sessionSurvey?.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="cursor-pointer ml-3 shrink-0 rounded-xl p-2 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#03548C] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {currentQ ? (
                <QuestionRenderer
                  question={currentQ}
                  answer={currentAnswer}
                  onChange={setAnswer}
                  error={validationError}
                />
              ) : null}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4">
              {submitMutation.isError && (
                <p className="mb-3 text-center text-xs text-red-500">
                  Error al enviar la encuesta. Intenta de nuevo.
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="cursor-pointer flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <div className="flex-1" />
                {isLastStep ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="cursor-pointer flex items-center gap-2 rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1440] disabled:opacity-60 active:scale-95 transition-all"
                  >
                    {submitMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trophy className="h-4 w-4" />}
                    {submitMutation.isPending ? 'Enviando…' : 'Enviar y ganar'}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="cursor-pointer flex items-center gap-1 rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1440] active:scale-95 transition-all"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </>
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
  const rewardTotal = survey
    ? formatReward((survey.rewardAmountPerQuestionCents * survey.totalQuestions) / 100)
    : null;

  const errorMessage = startError ? getStartErrorMessage(startError) : null;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="h-5 w-40 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {survey?.title}
            </h2>
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
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#03548C]" />
          </div>
        ) : survey ? (
          <>
            {/* Reward highlight */}
            <div className="rounded-2xl bg-linear-to-br from-[#0b1440] to-[#03548C] p-5 text-white">
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Recompensa total
              </p>
              <p className="mt-1 text-3xl font-black">{rewardTotal}</p>
              <p className="mt-1 text-xs text-white/60">
                {survey.totalQuestions} preguntas
              </p>
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
              />
              {survey.categoryNames.length > 0 && (
                <MetaCard
                  icon={<Tag className="h-4 w-4" />}
                  label="Categorías"
                  value={survey.categoryNames.join(', ')}
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

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
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
