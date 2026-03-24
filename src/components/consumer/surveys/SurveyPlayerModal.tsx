'use client';

import React, { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Trophy } from 'lucide-react';
import { useSurveyDetail, useSubmitSurvey } from '@/hooks/surveys/useSurvey';
import QuestionRenderer from './QuestionRenderer';
import SurveyCompletionScreen from './SurveyCompletionScreen';
import type { AnswerRequest, SubmissionResult } from '@/types/survey.types';

interface Props {
  surveyId: number;
  onClose: () => void;
}

export default function SurveyPlayerModal({ surveyId, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Map<number, AnswerRequest>>(new Map());
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Disable the detail query as soon as the survey is submitted so
  // TanStack Query doesn't refetch /surveys/:id while the completion
  // screen is still mounted.
  const { data: survey, isLoading } = useSurveyDetail(surveyId, result !== null);
  const submitMutation = useSubmitSurvey();

  const totalQuestions = survey?.questions.length ?? 0;
  const currentQuestion = survey?.questions[currentStep];

  // ── Answer management ────────────────────────────────────────────────────

  const setAnswer = useCallback(
    (questionId: number, answer: Partial<AnswerRequest>) => {
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(questionId, { questionId, ...answer });
        return next;
      });
      setValidationError(null);
    },
    [],
  );

  const currentAnswer = currentQuestion
    ? answers.get(currentQuestion.id)
    : undefined;

  // ── Navigation ────────────────────────────────────────────────────────────

  const validateCurrentStep = (): boolean => {
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;

    const ans = answers.get(currentQuestion.id);
    if (!ans) {
      setValidationError('Esta pregunta es obligatoria');
      return false;
    }

    switch (currentQuestion.type) {
      case 'TEXT':
        if (!ans.textAnswer?.trim()) {
          setValidationError('Por favor escribe tu respuesta');
          return false;
        }
        break;
      case 'RATING':
        if (!ans.textAnswer) {
          setValidationError('Por favor selecciona una calificación');
          return false;
        }
        break;
      case 'SINGLE_CHOICE':
        if (!ans.selectedOptionId) {
          setValidationError('Por favor selecciona una opción');
          return false;
        }
        break;
      case 'YES_NO':
        if (!ans.textAnswer) {
          setValidationError('Por favor selecciona una opción');
          return false;
        }
        break;
      case 'MULTIPLE_CHOICE':
        if (!ans.selectedOptionIds?.length) {
          setValidationError('Por favor selecciona al menos una opción');
          return false;
        }
        break;
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < totalQuestions - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // ── Submission ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      const res = await submitMutation.mutateAsync({
        surveyId,
        answers: Array.from(answers.values()),
      });
      setResult(res);
    } catch {
      /* handled by mutation.isError */
    }
  };

  const isLastStep = currentStep === totalQuestions - 1;
  const progress = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={result ? onClose : undefined}
      />

      <div className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Completion screen */}
        {result ? (
          <SurveyCompletionScreen result={result} onClose={onClose} />
        ) : (
          <>
            {/* Progress header */}
            <div className="shrink-0 px-6 pt-6 pb-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-400">
                    Pregunta {currentStep + 1} de {totalQuestions}
                  </p>
                  {survey && (
                    <h2 className="text-base font-bold text-gray-900 line-clamp-1">
                      {survey.title}
                    </h2>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : currentQuestion ? (
                <QuestionRenderer
                  question={currentQuestion}
                  answer={currentAnswer}
                  onChange={setAnswer}
                  error={validationError}
                />
              ) : null}
            </div>

            {/* Footer navigation */}
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
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                <div className="flex-1" />

                {isLastStep ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 active:scale-95 transition-all"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trophy className="h-4 w-4" />
                    )}
                    {submitMutation.isPending ? 'Enviando…' : 'Enviar y ganar'}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
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