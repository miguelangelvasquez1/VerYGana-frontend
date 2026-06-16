'use client';

import React, { useState } from 'react';
import { X, Users, Tag, MapPin, Loader2, Pencil } from 'lucide-react';
import { useCommercialSurveyDetail } from '@/hooks/surveys/useCommercialSurvey';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  QUESTION_TYPE_LABELS,
  GENDER_LABELS,
  formatReward,
  formatDate,
} from '@/hooks/surveys/surveyUtils';
import SurveyEditModal from './SurveyEditModal';
import type { SurveyCommercialDetailDTO } from '@/types/survey.types';

interface Props {
  surveyId: number;
  onClose: () => void;
}

export default function SurveyDetailModal({ surveyId, onClose }: Props) {
  const { data: survey, isLoading } = useCommercialSurveyDetail(surveyId);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${showEdit ? 'invisible' : ''}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isLoading ? 'Cargando...' : survey?.title}
              </h2>
              {survey && (
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[survey.status]}`}
                >
                  {STATUS_LABELS[survey.status]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {survey && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="cursor-pointer rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
                  title="Editar encuesta"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : survey ? (
            <SurveyContent survey={survey} />
          ) : null}
        </div>
      </div>

      {showEdit && survey && (
        <SurveyEditModal survey={survey} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}

// ─── Content — receives survey so derived values can be computed at the top ───

function SurveyContent({ survey }: { survey: SurveyCommercialDetailDTO }) {
  const categoryNames = (survey.categories ?? []).map((c) => c.name);
  const municipalityNames = (survey.targetMunicipalities ?? []).map((m) => m.name);

  const questionCount = survey.questions.length;
  const spentCents = survey.completedSessions * questionCount * survey.rewardAmountPerQuestionCents;
  const remainingCents = survey.totalBudgetCents != null ? survey.totalBudgetCents - spentCents : null;
  const completionRate = survey.maxResponses
    ? Math.round((survey.responseCount * 1000) / survey.maxResponses) / 10
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Live progress */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Respuestas completadas"
          value={
            survey.maxResponses
              ? `${survey.responseCount} / ${survey.maxResponses}`
              : String(survey.responseCount)
          }
        />
      </div>

      {/* Completion progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Progreso de respuestas</span>
          <span>{completionRate}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Budget */}
      <Section title="Presupuesto">
        <div className="grid grid-cols-3 gap-3">
          {survey.totalBudgetCents != null && (
            <BudgetCard label="Total" value={formatReward(survey.totalBudgetCents / 100)} colorClass="text-gray-900" />
          )}
          <BudgetCard label="Gastado" value={formatReward(spentCents / 100)} colorClass="text-red-600" />
          {remainingCents != null && (
            <BudgetCard label="Restante" value={formatReward(remainingCents / 100)} colorClass="text-emerald-600" />
          )}
        </div>
      </Section>

      {/* Targeting */}
      <Section title="Segmentación">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {categoryNames.length > 0 && (
            <TargetItem
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Categorías"
              value={categoryNames.join(', ')}
            />
          )}
          {municipalityNames.length > 0 && (
            <TargetItem
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Municipios"
              value={municipalityNames.join(', ')}
            />
          )}
          {(survey.minAge || survey.maxAge) && (
            <TargetItem
              icon={<Users className="h-3.5 w-3.5" />}
              label="Edad"
              value={`${survey.minAge ?? '13'}–${survey.maxAge ?? '100'} años`}
            />
          )}
          {survey.targetGender && (
            <TargetItem
              icon={<Users className="h-3.5 w-3.5" />}
              label="Género"
              value={GENDER_LABELS[survey.targetGender]}
            />
          )}
        </div>
      </Section>

      {/* Dates */}
      {survey.startsAt && (
        <Section title="Vigencia">
          <div className="flex gap-6 text-sm text-gray-600">
            <span>
              <span className="font-medium">Inicio:</span> {formatDate(survey.startsAt)}
            </span>
          </div>
        </Section>
      )}

      {/* Description */}
      {survey.description && (
        <Section title="Descripción">
          <p className="text-sm leading-relaxed text-gray-600">{survey.description}</p>
        </Section>
      )}

      {/* Questions */}
      <Section title={`Preguntas (${survey.questions.length})`}>
        <ol className="space-y-4">
          {survey.questions.map((q, i) => (
            <li key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {q.text}
                    {q.required && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{QUESTION_TYPE_LABELS[q.type]}</p>
                  {q.options.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                          {o.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, color = 'text-gray-900',
}: {
  icon: React.ReactNode; label: string; value: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`mt-1.5 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function BudgetCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h3>
      {children}
    </div>
  );
}

function TargetItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
