'use client';

import React from 'react';
import { STATUS_LABELS } from '@/hooks/surveys/surveyUtils';
import type { SurveyStatus } from '@/types/survey.types';

const ALL_STATUSES: SurveyStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'];

interface Props {
  value: SurveyStatus | undefined;
  onChange: (status: SurveyStatus | undefined) => void;
}

export default function SurveyStatusFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterPill
        label="Todas"
        active={value === undefined}
        onClick={() => onChange(undefined)}
      />
      {ALL_STATUSES.map((s) => (
        <FilterPill
          key={s}
          label={STATUS_LABELS[s]}
          active={value === s}
          onClick={() => onChange(s)}
        />
      ))}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}