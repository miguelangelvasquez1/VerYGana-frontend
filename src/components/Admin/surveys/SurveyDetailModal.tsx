'use client';

import React from 'react';
import { X, Users, Clock, Tag, MapPin, Loader2 } from 'lucide-react';
import { useAdminSurveyDetail } from '@/hooks/surveys/useAdminSurvey';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  QUESTION_TYPE_LABELS,
  GENDER_LABELS,
  formatReward,
  formatDate,
  getResponseProgress 
} from '@/hooks/surveys/surveyUtils';

interface Props {
  surveyId: number;
  onClose: () => void;
}

export default function SurveyDetailModal({ surveyId, onClose }: Props) {
  const { data: survey, isLoading } = useAdminSurveyDetail(surveyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

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
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : survey ? (
          <div className="space-y-6 p-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Respuestas"
                value={
                  survey.maxResponses
                    ? `${survey.responseCount} / ${survey.maxResponses}`
                    : `${survey.responseCount}`
                }
              />
              <StatCard
                icon={<Tag className="h-4 w-4" />}
                label="Recompensa"
                value={formatReward(survey.rewardAmount)}
              />
            </div>

            {/* Progress bar (when max responses is set) */}
            {survey.maxResponses && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Progreso de respuestas</span>
                  <span>
                    {getResponseProgress(
                      survey.responseCount,
                      survey.maxResponses,
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${getResponseProgress(survey.responseCount, survey.maxResponses)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Targeting */}
            <Section title="Segmentación">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {survey.categoryNames.length > 0 && (
                  <TargetItem
                    icon={<Tag className="h-3.5 w-3.5" />}
                    label="Categorías"
                    value={survey.categoryNames.join(', ')}
                  />
                )}
                {survey.municipalityNames.length > 0 && (
                  <TargetItem
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Municipios"
                    value={survey.municipalityNames.join(', ')}
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
            {(survey.startsAt || survey.endsAt) && (
              <Section title="Vigencia">
                <div className="flex gap-6 text-sm text-gray-600">
                  {survey.startsAt && (
                    <span>
                      <span className="font-medium">Inicio:</span>{' '}
                      {formatDate(survey.startsAt)}
                    </span>
                  )}
                  {survey.endsAt && (
                    <span>
                      <span className="font-medium">Fin:</span>{' '}
                      {formatDate(survey.endsAt)}
                    </span>
                  )}
                </div>
              </Section>
            )}

            {/* Description */}
            {survey.description && (
              <Section title="Descripción">
                <p className="text-sm leading-relaxed text-gray-600">
                  {survey.description}
                </p>
              </Section>
            )}

            {/* Questions */}
            <Section title={`Preguntas (${survey.questions.length})`}>
              <ol className="space-y-4">
                {survey.questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {q.text}
                          {q.required && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </p>
                        {q.options.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {q.options.map((o) => (
                              <li
                                key={o.id}
                                className="flex items-center gap-2 text-xs text-gray-600"
                              >
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
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TargetItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}