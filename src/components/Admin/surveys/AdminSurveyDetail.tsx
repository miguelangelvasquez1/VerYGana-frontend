'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  Loader2,
  AlertCircle,
  Users,
  Clock,
  Award,
  FileEdit,
  Tag,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  useAdminSurveyDetail,
  useAdminUpdateStatus,
  SurveyApiError,
} from '@/hooks/surveys/useAdminSurvey';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  QUESTION_TYPE_LABELS,
  GENDER_LABELS,
  formatReward,
  formatDate,
  formatDateTime,
  getResponseProgress,
} from '@/hooks/surveys/surveyUtils';
import type { QuestionResponse, OptionResponse, SurveyStatus } from '@/types/survey.types';

// ─── Allowed transitions per current status ────────────────────────────────

interface Transition {
  label: string;
  next: SurveyStatus;
  icon: React.ReactNode;
  btnClass: string;
  confirmMsg: string;
}

const TRANSITIONS: Record<SurveyStatus, Transition[]> = {
  DRAFT: [
    {
      label: 'Publicar encuesta',
      next: 'ACTIVE',
      icon: <Play className="h-4 w-4" />,
      btnClass: 'bg-emerald-600 text-white hover:bg-emerald-500',
      confirmMsg:
        'La encuesta quedará visible para los usuarios y comenzará a recibir respuestas.',
    },
  ],
  ACTIVE: [
    {
      label: 'Pausar',
      next: 'PAUSED',
      icon: <Pause className="h-4 w-4" />,
      btnClass: 'bg-amber-500 text-white hover:bg-amber-400',
      confirmMsg:
        'La encuesta dejará de mostrarse a los usuarios temporalmente. Puedes reactivarla en cualquier momento.',
    },
    {
      label: 'Cerrar encuesta',
      next: 'CLOSED',
      icon: <XCircle className="h-4 w-4" />,
      btnClass: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
      confirmMsg:
        'La encuesta se cerrará definitivamente y no podrá recibir más respuestas. Esta acción no se puede deshacer.',
    },
  ],
  PAUSED: [
    {
      label: 'Reactivar',
      next: 'ACTIVE',
      icon: <Play className="h-4 w-4" />,
      btnClass: 'bg-emerald-600 text-white hover:bg-emerald-500',
      confirmMsg:
        'La encuesta volverá a ser visible para los usuarios y aceptará nuevas respuestas.',
    },
    {
      label: 'Cerrar encuesta',
      next: 'CLOSED',
      icon: <XCircle className="h-4 w-4" />,
      btnClass: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
      confirmMsg:
        'La encuesta se cerrará definitivamente y no podrá recibir más respuestas. Esta acción no se puede deshacer.',
    },
  ],
  CLOSED: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  surveyId: number;
}

export default function AdminSurveyDetail({ surveyId }: Props) {
  const router = useRouter();

  const { data: survey, isLoading, isError } = useAdminSurveyDetail(surveyId);
  const updateStatus = useAdminUpdateStatus();

  const [pendingTransition, setPendingTransition] = useState<Transition | null>(null);
  const [mutationError,     setMutationError]     = useState<string | null>(null);

  const confirmChange = () => {
    if (!pendingTransition) return;
    setMutationError(null);
    updateStatus.mutate(
      { surveyId, status: pendingTransition.next },
      {
        onSuccess: () => setPendingTransition(null),
        onError: (err:any) => {
          setMutationError(
            err instanceof SurveyApiError
              ? err.message
              : 'Error al cambiar el estado',
          );
          setPendingTransition(null);
        },
      },
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Back */}
      <button
        onClick={() => router.push('/admin/surveys')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a encuestas
      </button>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No se pudo cargar la encuesta. Intenta de nuevo.
        </div>
      )}

      {survey && (
        <>
          {/* ── Identity card ───────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            {/* Status + date */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[survey.status]}`}>
                {STATUS_LABELS[survey.status]}
              </span>
              <span className="text-xs text-gray-400">
                Creada el {formatDate(survey.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-black text-gray-900 leading-snug">
              {survey.title}
            </h1>

            {survey.description && (
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {survey.description}
              </p>
            )}

            {/* Mutation error */}
            {mutationError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {mutationError}
              </div>
            )}

            {/* Action buttons */}
            {TRANSITIONS[survey.status].length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
                {TRANSITIONS[survey.status].map((t: Transition) => (
                  <button
                    key={t.next}
                    onClick={() => setPendingTransition(t)}
                    disabled={updateStatus.isPending}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 ${t.btnClass}`}
                  >
                    {updateStatus.isPending && updateStatus.variables?.status === t.next
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {survey.status === 'CLOSED' && (
              <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-5 text-sm text-gray-400">
                <CheckCircle2 className="h-4 w-4" />
                Encuesta cerrada permanentemente
              </div>
            )}
          </div>

          {/* ── Stats ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Users className="h-4 w-4 text-indigo-400" />}
              label="Respuestas"
              value={
                survey.maxResponses
                  ? `${survey.responseCount} / ${survey.maxResponses}`
                  : `${survey.responseCount}`
              }
            />
            <StatCard
              icon={<Award className="h-4 w-4 text-indigo-400" />}
              label="Recompensa"
              value={formatReward(survey.rewardAmount)}
            />
            <StatCard
              icon={<FileEdit className="h-4 w-4 text-indigo-400" />}
              label="Preguntas"
              value={String(survey.questions.length)}
            />
          </div>

          {/* Progress bar */}
          {survey.maxResponses != null && survey.maxResponses > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">Progreso de respuestas</span>
                <span className="font-bold text-indigo-600">
                  {getResponseProgress(survey.responseCount, survey.maxResponses)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${getResponseProgress(survey.responseCount, survey.maxResponses)}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Targeting ───────────────────────────────────────────────────── */}
          <Section title="Segmentación">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {survey.categoryNames.length > 0 && (
                <TargetCard
                  icon={<Tag className="h-3.5 w-3.5" />}
                  label="Categorías"
                  value={survey.categoryNames.join(', ')}
                />
              )}

              {survey.municipalityNames.length > 0 && (
                <TargetCard
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Municipios"
                  value={survey.municipalityNames.join(', ')}
                />
              )}

              {(survey.minAge || survey.maxAge) && (
                <TargetCard
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Rango de edad"
                  value={`${survey.minAge ?? 13} – ${survey.maxAge ?? 100} años`}
                />
              )}

              {survey.targetGender && (
                <TargetCard
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Género"
                  value={GENDER_LABELS[survey.targetGender]}
                />
              )}

              {!survey.categoryNames.length && !survey.municipalityNames.length &&
               !survey.minAge && !survey.maxAge && !survey.targetGender && (
                <p className="col-span-2 text-xs text-gray-400">
                  Sin segmentación — visible para todos los usuarios.
                </p>
              )}
            </div>
          </Section>

          {/* ── Dates ───────────────────────────────────────────────────────── */}
          {(survey.startsAt || survey.endsAt) && (
            <Section title="Vigencia">
              <div className="flex flex-wrap gap-4">
                {survey.startsAt && (
                  <TargetCard
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Fecha de inicio"
                    value={formatDateTime(survey.startsAt)}
                  />
                )}
                {survey.endsAt && (
                  <TargetCard
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Fecha de fin"
                    value={formatDateTime(survey.endsAt)}
                  />
                )}
              </div>
            </Section>
          )}

          {/* ── Questions ───────────────────────────────────────────────────── */}
          <Section title={`Preguntas (${survey.questions.length})`}>
            <div className="space-y-3">
              {survey.questions
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((q: QuestionResponse, i: number) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            {QUESTION_TYPE_LABELS[q.type]}
                          </span>
                          {q.required && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                              Obligatoria
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {q.text}
                        </p>
                        {q.options.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {q.options
                              .slice()
                              .sort((a:any, b:any) => a.orderIndex - b.orderIndex)
                              .map((opt:any) => (
                                <li
                                  key={opt.id}
                                  className="flex items-center gap-2 text-xs text-gray-500"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                                  {opt.text}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        </>
      )}

      {/* ── Confirm dialog ──────────────────────────────────────────────────── */}
      {pendingTransition && survey && (
        <ConfirmDialog
          from={survey.status}
          transition={pendingTransition}
          loading={updateStatus.isPending}
          onConfirm={confirmChange}
          onCancel={() => setPendingTransition(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

function TargetCard({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="mb-0.5 flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function ConfirmDialog({ from, transition, loading, onConfirm, onCancel }: {
  from: SurveyStatus;
  transition: Transition;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isCritical = transition.next === 'CLOSED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-gray-900">
          {STATUS_LABELS[from]} → {STATUS_LABELS[transition.next]}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {transition.confirmMsg}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60 ${
              isCritical ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}