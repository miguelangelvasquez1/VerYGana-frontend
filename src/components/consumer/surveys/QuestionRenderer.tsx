'use client';

import React from 'react';
import type { QuestionResponse, AnswerRequest } from '@/types/survey.types';

interface Props {
  question: QuestionResponse;
  answer: AnswerRequest | undefined;
  onChange: (questionId: number, answer: Partial<AnswerRequest>) => void;
  error: string | null;
}

export default function QuestionRenderer({
  question,
  answer,
  onChange,
  error,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Question text */}
      <div>
        <h3 className="text-lg font-semibold leading-snug text-gray-900">
          {question.text}
          {question.required && (
            <span className="ml-1 text-indigo-500">*</span>
          )}
        </h3>
        <p className="mt-1 text-xs text-gray-400">{typeHint(question)}</p>
      </div>

      {/* Input per type */}
      <div>
        {question.type === 'SINGLE_CHOICE' && (
          <SingleChoice
            question={question}
            selectedId={answer?.selectedOptionId}
            onChange={(id) => onChange(question.id, { selectedOptionId: id })}
          />
        )}

        {question.type === 'YES_NO' && (
          <YesNo
            value={answer?.textAnswer ?? ''}
            onChange={(v) => onChange(question.id, { textAnswer: v })}
          />
        )}

        {question.type === 'MULTIPLE_CHOICE' && (
          <MultipleChoice
            question={question}
            selectedIds={answer?.selectedOptionIds ?? []}
            onChange={(ids) => onChange(question.id, { selectedOptionIds: ids })}
          />
        )}

        {question.type === 'TEXT' && (
          <TextAnswer
            value={answer?.textAnswer ?? ''}
            onChange={(v) => onChange(question.id, { textAnswer: v })}
          />
        )}

        {question.type === 'RATING' && (
          <RatingAnswer
            value={answer?.textAnswer ? parseInt(answer.textAnswer) : 0}
            onChange={(v) => onChange(question.id, { textAnswer: String(v) })}
          />
        )}
      </div>

      {/* Validation error */}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Single Choice ────────────────────────────────────────────────────────────

function SingleChoice({
  question,
  selectedId,
  onChange,
}: {
  question: QuestionResponse;
  selectedId: number | undefined;
  onChange: (id: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      {question.options.map((opt) => {
        const selected = selectedId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
              selected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50'
            }`}
          >
            <span
              className={`mr-3 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                selected ? 'border-indigo-500' : 'border-gray-300'
              }`}
            >
              {selected && (
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
              )}
            </span>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}

// ─── Yes / No ────────────────────────────────────────────────────────────────

const YES_NO_OPTIONS = [
  { id: 'YES', label: 'Sí' },
  { id: 'NO',  label: 'No' },
] as const;

function YesNo({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-3">
      {YES_NO_OPTIONS.map(({ id, label }) => {
        const selected = value === id;
        const isPositive = id === 'YES';

        const baseClasses = 'flex-1 rounded-2xl border-2 py-4 text-base font-bold transition-all';
        const colorClasses = selected
                ? isPositive
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                  : 'border-red-500 bg-red-100 text-red-700 ring-2 ring-red-300'
                : isPositive
                  ? 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                  : 'border-red-200 bg-white text-red-500 hover:bg-red-50'
            
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`${baseClasses} ${colorClasses}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Multiple Choice ──────────────────────────────────────────────────────────

function MultipleChoice({
  question,
  selectedIds,
  onChange,
}: {
  question: QuestionResponse;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2.5">
      {question.options.map((opt) => {
        const checked = selectedIds.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
              checked
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200'
            }`}
          >
            <span
              className={`mr-3 inline-flex h-4 w-4 items-center justify-center rounded ${
                checked
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-2 border-gray-300 bg-white'
              }`}
            >
              {checked && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}

// ─── Text Answer ──────────────────────────────────────────────────────────────

function TextAnswer({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      placeholder="Escribe tu respuesta aquí…"
      className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-indigo-400 transition-colors"
    />
  );
}

// ─── Rating ───────────────────────────────────────────────────────────────────

function RatingAnswer({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const labels = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 text-xl transition-all ${
              value === n
                ? 'border-indigo-500 bg-indigo-50 shadow-md scale-110'
                : 'border-gray-200 bg-white hover:border-indigo-200 hover:scale-105'
            }`}
          >
            {['😞', '😕', '😐', '🙂', '😄'][n - 1]}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-center text-sm font-medium text-indigo-600">
          {labels[value - 1]}
        </p>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function typeHint(question: QuestionResponse): string {
  switch (question.type) {
    case 'SINGLE_CHOICE':
      return 'Selecciona una opción';
    case 'MULTIPLE_CHOICE':
      return 'Puedes seleccionar varias opciones';
    case 'TEXT':
      return 'Respuesta libre';
    case 'RATING':
      return 'Califica del 1 al 5';
    case 'YES_NO':
      return 'Selecciona Sí o No';
    default:
      return '';
  }
}