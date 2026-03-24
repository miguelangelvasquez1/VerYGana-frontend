'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle,
  MapPin,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useCreateSurvey, useSurveyConfigs } from '@/hooks/surveys/useAdminSurvey';
import { useSurveyForm } from '@/hooks/surveys/useSurveyForm';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { QUESTION_TYPE_LABELS, GENDER_LABELS } from '@/hooks/surveys/surveyUtils';
// import { SurveyApiError } from '@/services/surveys/surveyAdmin.service';
import type { QuestionType, TargetGender } from '@/types/survey.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES: QuestionType[] = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TEXT',
  'RATING',
  'YES_NO',
];

const GENDERS: TargetGender[] = ['MALE', 'FEMALE', 'ALL'];
const NEEDS_OPTIONS: QuestionType[] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'];

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyFormModal({ onClose }: Props) {
  const createMutation = useCreateSurvey();

  const {
    form, errors, touched,
    setField, touchField,
    addQuestion, removeQuestion, updateQuestion,
    setQuestionType, addOption, removeOption, updateOption,
    moveQuestion, validateAll, toPayload,
  } = useSurveyForm();

  // ── Remote data ──────────────────────────────────────────────────────────
  const { categories = [],    loading: loadingCats    } = useCategories();
  const { data: departments = [], isLoading: loadingDepts } = useDepartments();
  // costPerResponse is a single number returned by the backend
  const { data: costPerResponse,  isLoading: loadingCost  } = useSurveyConfigs();

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { data: municipalities = [], isLoading: loadingMunis } = useMunicipalities(selectedDepartment);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<
    { code: string; name: string; departmentCode: string; departmentName: string }[]
  >([]);

  const [expandedStep, setExpandedStep] = useState<1 | 2 | 3>(1);

  // ── Municipality helpers ─────────────────────────────────────────────────

  const addMunicipality = (code: string) => {
    if (form.municipalityCodes.includes(code)) return;
    const mun  = municipalities.find((m) => m.code === code);
    const dept = departments.find((d) => d.code === selectedDepartment);
    if (!mun || !dept) return;

    setSelectedMunicipalities((prev) => [
      ...prev,
      { code: mun.code, name: mun.name, departmentCode: dept.code, departmentName: dept.name },
    ]);
    setField('municipalityCodes', [...form.municipalityCodes, code]);
  };

  const removeMunicipality = (code: string) => {
    setSelectedMunicipalities((prev) => prev.filter((m) => m.code !== code));
    setField('municipalityCodes', form.municipalityCodes.filter((c) => c !== code));
  };

  // ── Category toggle ──────────────────────────────────────────────────────

  const toggleCategory = (id: number) => {
    const next = form.categoryIds.includes(id)
      ? form.categoryIds.filter((c) => c !== id)
      : [...form.categoryIds, id];
    setField('categoryIds', next);
    touchField('categoryIds');
  };

  // ── Error → step mapping ─────────────────────────────────────────────────
  // Maps every possible error key to the step accordion that contains it,
  // so handleSubmit can automatically open the first step with errors.

  const ERROR_STEP: Record<string, 1 | 2 | 3> = {
    title:          1,
    surveyConfigId: 1,
    maxResponses:   1,
    startsAt:       1,
    endsAt:         1,
    categoryIds:    2,
    municipalityCodes: 2,
    minAge:         2,
    maxAge:         2,
    targetGender:   2,
    questions:      3,
  };

  // User-friendly label for each error key shown in the footer summary
  const ERROR_LABELS: Record<string, string> = {
    title:          'Título',
    surveyConfigId: 'Costo por respuesta',
    categoryIds:    'Categorías',
    minAge:         'Rango de edad',
    questions:      'Preguntas',
  };

  // Derive the errors that are currently active (touched + have a message)
  const activeErrors = Object.entries(errors).filter(
    ([key]) => touched.has(key) && errors[key],
  );

  // Human-readable label for a given error key
  const errorLabel = (key: string): string => {
    if (key.startsWith('question_')) {
      const match = key.match(/question_(\d+)_(\w+)/);
      if (match) {
        const num = parseInt(match[1]) + 1;
        return match[2] === 'options'
          ? `Pregunta ${num}: opciones`
          : `Pregunta ${num}`;
      }
    }
    return ERROR_LABELS[key] ?? key;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateAll();

    if (!valid) {
      // Open the accordion of the first step that has errors
      const firstErrorKey = Object.keys(errors)[0] ?? '';
      const targetStep =
        ERROR_STEP[firstErrorKey] ??
        (firstErrorKey.startsWith('question_') ? 3 : 1);
      setExpandedStep(targetStep);
      return;
    }

    try {
      await createMutation.mutateAsync(toPayload());
      onClose();
    } catch {
      // error surfaced via createMutation.isError
    }
  };

  const err = (key: string) =>
    touched.has(key) && errors[key] ? (
      <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
    ) : null;

  // Estimated total spend when maxResponses is filled
  const estimatedTotal =
    costPerResponse && form.maxResponses
      ? costPerResponse * parseInt(form.maxResponses)
      : null;

  // Count active errors per step for the badge on each accordion header
  const step1Keys = ['title', 'surveyConfigId', 'maxResponses', 'startsAt', 'endsAt'];
  const step2Keys = ['categoryIds', 'municipalityCodes', 'minAge', 'maxAge', 'targetGender'];
  const countStepErrors = (keys: string[]) =>
    keys.filter((k) => touched.has(k) && errors[k]).length;
  const questionErrors = Object.keys(errors).filter(
    (k) => k.startsWith('question_') && touched.has(k),
  ).length;

  const step1Errors = countStepErrors(step1Keys);
  const step2Errors = countStepErrors(step2Keys);
  const step3Errors = questionErrors + (touched.has('questions') && errors.questions ? 1 : 0);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nueva encuesta</h2>
            <p className="text-xs text-gray-400">
              Se crea en borrador. Publícala cuando esté lista.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ═══ STEP 1 — Información básica ══════════════════════════════ */}
          <StepAccordion
            step={1}
            title="Información básica"
            open={expandedStep === 1}
            onToggle={() => setExpandedStep(expandedStep === 1 ? 2 : 1)}
            errorCount={step1Errors}
          >
            <div className="space-y-4">

              {/* Title */}
              <Field label="Título *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  onBlur={() => touchField('title')}
                  placeholder="ej. Satisfacción con nuestro servicio"
                  className={inputCls(!!errors.title && touched.has('title'))}
                />
                {err('title')}
              </Field>

              {/* Description */}
              <Field label="Descripción">
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={3}
                  placeholder="Describe brevemente de qué trata la encuesta…"
                  className={`${inputCls(false)} resize-none`}
                />
              </Field>

              {/* ── Costo por respuesta — read-only display ──────────────── */}
              <Field
                label="Costo por respuesta"
                tooltip="Precio fijo del sistema cobrado por cada respuesta completada. Este valor es definido por la plataforma y no puede modificarse."
              >
                <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                  loadingCost ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <DollarSign className="h-4 w-4 shrink-0 text-indigo-400" />

                  {loadingCost ? (
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Cargando precio…
                    </span>
                  ) : costPerResponse != null ? (
                    <>
                      <span className="text-base font-bold text-indigo-700">
                        {COP.format(costPerResponse)}
                      </span>
                      <span className="text-xs text-gray-400">por respuesta</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No disponible</span>
                  )}
                </div>

                {/* Estimated total — shown once maxResponses is filled */}
                {estimatedTotal != null && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                    <span className="text-xs text-indigo-600">
                      Presupuesto estimado
                      {form.maxResponses && (
                        <span className="ml-1 text-indigo-400">
                          ({parseInt(form.maxResponses).toLocaleString('es-CO')} resp.
                          × {COP.format(costPerResponse!)})
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-indigo-700">
                      {COP.format(estimatedTotal)}
                    </span>
                  </div>
                )}
              </Field>

              {/* Max responses */}
              <Field label="Máximo de respuestas">
                <input
                  type="number"
                  min={1}
                  value={form.maxResponses}
                  onChange={(e) => setField('maxResponses', e.target.value)}
                  placeholder="Sin límite"
                  className={inputCls(false)}
                />
              </Field>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Fecha de inicio"
                  tooltip="La encuesta se activará automáticamente en esta fecha y hora. Si no se define, quedará en borrador hasta que la publiques manualmente."
                >
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setField('startsAt', e.target.value)}
                    className={inputCls(false)}
                  />
                </Field>

                <Field
                  label="Fecha de fin"
                  tooltip="La encuesta se cerrará automáticamente en esta fecha, incluso si no se alcanzó el máximo de respuestas configurado."
                >
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setField('endsAt', e.target.value)}
                    className={inputCls(false)}
                  />
                </Field>
              </div>

            </div>
          </StepAccordion>

          {/* ═══ STEP 2 — Segmentación ════════════════════════════════════ */}
          <StepAccordion
            step={2}
            title="Segmentación de audiencia"
            open={expandedStep === 2}
            onToggle={() => setExpandedStep(expandedStep === 2 ? 1 : 2)}
            errorCount={step2Errors}
          >
            <div className="space-y-5">

              {/* ── Categories ────────────────────────────────────────────── */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Categorías / Intereses *
                  </span>
                </div>

                {loadingCats ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando categorías…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((cat: any) => {
                      const active = form.categoryIds.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
                            active
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleCategory(cat.id)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                              active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {active && (
                              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className={`truncate text-sm font-medium ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {cat.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {err('categoryIds')}
              </div>

              {/* ── Locations ─────────────────────────────────────────────── */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Ubicaciones geográficas
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Departamento
                    </label>
                    <select
                      value={selectedDepartment ?? ''}
                      onChange={(e) => setSelectedDepartment(e.target.value || null)}
                      disabled={loadingDepts}
                      className={inputCls(false)}
                    >
                      <option value="">— Seleccionar —</option>
                      {departments.map((d: any) => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Municipio
                    </label>
                    <select
                      disabled={!selectedDepartment || loadingMunis}
                      onChange={(e) => {
                        if (e.target.value) {
                          addMunicipality(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className={inputCls(false)}
                    >
                      <option value="">— Seleccionar —</option>
                      {municipalities.map((m: any) => (
                        <option
                          key={m.code}
                          value={m.code}
                          disabled={form.municipalityCodes.includes(m.code)}
                        >
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedMunicipalities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMunicipalities.map((m) => (
                      <span
                        key={m.code}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        <MapPin className="h-3 w-3" />
                        {m.name}, {m.departmentName}
                        <button
                          type="button"
                          onClick={() => removeMunicipality(m.code)}
                          className="ml-0.5 text-emerald-500 hover:text-emerald-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Sin ubicaciones específicas — se mostrará en todo el país.
                  </p>
                )}
              </div>

              {/* ── Age range ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Edad mínima (≥ 13)">
                  <input
                    type="number" min={13} max={100}
                    value={form.minAge}
                    onChange={(e) => setField('minAge', e.target.value)}
                    onBlur={() => touchField('minAge')}
                    placeholder="13"
                    className={inputCls(!!errors.minAge && touched.has('minAge'))}
                  />
                  {err('minAge')}
                </Field>
                <Field label="Edad máxima (≤ 100)">
                  <input
                    type="number" min={13} max={100}
                    value={form.maxAge}
                    onChange={(e) => setField('maxAge', e.target.value)}
                    placeholder="100"
                    className={inputCls(false)}
                  />
                </Field>
              </div>

              {/* ── Gender ────────────────────────────────────────────────── */}
              <Field label="Género objetivo">
                <select
                  value={form.targetGender}
                  onChange={(e) =>
                    setField('targetGender', (e.target.value as TargetGender) || '')
                  }
                  className={inputCls(false)}
                >
                  <option value="">Todos los géneros</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{GENDER_LABELS[g]}</option>
                  ))}
                </select>
              </Field>

            </div>
          </StepAccordion>

          {/* ═══ STEP 3 — Preguntas ═══════════════════════════════════════ */}
          <StepAccordion
            step={3}
            title={`Preguntas (${form.questions.length})`}
            open={expandedStep === 3}
            onToggle={() => setExpandedStep(expandedStep === 3 ? 1 : 3)}
            errorCount={step3Errors}
          >
            <div className="space-y-4">
              {errors.questions && touched.has('questions') && (
                <p className="text-xs text-red-500">{errors.questions}</p>
              )}

              {form.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    {/* Move controls */}
                    <div className="flex shrink-0 flex-col gap-0.5 pt-2 text-gray-300">
                      <button
                        type="button" disabled={idx === 0}
                        onClick={() => moveQuestion(idx, idx - 1)}
                        className="hover:text-gray-500 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button" disabled={idx === form.questions.length - 1}
                        onClick={() => moveQuestion(idx, idx + 1)}
                        className="hover:text-gray-500 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Index badge */}
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {idx + 1}
                    </span>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      <textarea
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                        onBlur={() => touchField(`question_${idx}_text`)}
                        placeholder="Escribe aquí el texto completo de tu pregunta…"
                        rows={2}
                        className={`w-full resize-none text-sm ${inputCls(
                          !!errors[`question_${idx}_text`] && touched.has(`question_${idx}_text`),
                        )}`}
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={q.type}
                          onChange={(e) => setQuestionType(q.id, e.target.value as QuestionType)}
                          className={`w-44 ${inputCls(false)}`}
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                          ))}
                        </select>

                        <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Obligatoria
                        </label>

                        {form.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="ml-auto rounded-lg p-1 text-red-400 hover:bg-red-50"
                            title="Eliminar pregunta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors[`question_${idx}_text`] && touched.has(`question_${idx}_text`) && (
                    <p className="ml-14 text-xs text-red-500">
                      {errors[`question_${idx}_text`]}
                    </p>
                  )}

                  {NEEDS_OPTIONS.includes(q.type) && (
                    <div className="ml-14 space-y-2">
                      {errors[`question_${idx}_options`] &&
                        touched.has(`question_${idx}_options`) && (
                          <p className="text-xs text-red-500">
                            {errors[`question_${idx}_options`]}
                          </p>
                        )}

                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-gray-400">
                            {oi + 1}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, oi, e.target.value)}
                            placeholder={`Opción ${oi + 1}`}
                            className={`flex-1 ${inputCls(false)}`}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(q.id, oi)}
                              className="text-gray-300 hover:text-red-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="text-xs font-medium text-indigo-500 hover:text-indigo-700"
                      >
                        + Agregar opción
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar pregunta
              </button>
            </div>
          </StepAccordion>

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100">

          {/* Validation error summary — shown after a failed submit attempt */}
          {activeErrors.length > 0 && (
            <div className="flex items-start gap-2.5 border-b border-red-100 bg-red-50 px-6 py-3">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                <span className="text-[9px] font-bold text-white">!</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-700">
                  Corrige {activeErrors.length === 1 ? 'este error' : `estos ${activeErrors.length} errores`} antes de continuar:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {activeErrors.map(([key, message]) => (
                    <li key={key} className="flex items-baseline gap-1.5 text-xs text-red-600">
                      <span className="shrink-0 font-medium">{errorLabel(key)}:</span>
                      <span className="opacity-80">{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex items-center justify-between px-6 py-4">
            {createMutation.isError && (
              <div className="flex items-start gap-2 text-xs text-red-600 max-w-xs">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                  <span className="text-[9px] font-bold text-white">!</span>
                </div>
                <div>
                  <p className="font-semibold">

                    {createMutation.error
                      ? createMutation.error.message
                      : 'Error al crear la encuesta'}
                  </p>
                  {createMutation.error &&
                    createMutation.error.message && (
                      <p className="mt-0.5 opacity-75">
                        {createMutation.error.message}
                      </p>
                    )}
                </div>
              </div>
            )}
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition-all"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear encuesta
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Field with optional tooltip ─────────────────────────────────────────────

function Field({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  const [showTip, setShowTip] = React.useState(false);

  return (
    <div className="relative">
      <div className="mb-1 flex items-center gap-1.5">
        <label className="text-xs font-medium text-gray-600">{label}</label>

        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              onFocus={() => setShowTip(true)}
              onBlur={() => setShowTip(false)}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
              aria-label={`Ayuda para: ${label}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>

            {showTip && (
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2.5 text-xs leading-relaxed text-white shadow-xl"
              >
                {tooltip}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Step accordion ───────────────────────────────────────────────────────────

function StepAccordion({
  step, title, open, onToggle, children, errorCount = 0,
}: {
  step: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  errorCount?: number;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Step number — turns red when that step has errors */}
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white transition-colors ${
          errorCount > 0 ? 'bg-red-500' : 'bg-indigo-600'
        }`}>
          {errorCount > 0 ? errorCount : step}
        </span>

        <span className="flex-1 text-sm font-semibold text-gray-800">{title}</span>

        {open
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ─── Input class helper ───────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-gray-200 bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
  }`;
}