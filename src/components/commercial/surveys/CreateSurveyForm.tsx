'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateSurvey, useSurveyConfigs } from '@/hooks/surveys/useCommercialSurvey';
import { useSurveyForm, MAX_QUESTIONS, MAX_OPTIONS_PER_QUESTION, MAX_QUESTION_TEXT_LENGTH } from '@/hooks/surveys/useSurveyForm';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { QUESTION_TYPE_LABELS, GENDER_LABELS } from '@/hooks/surveys/surveyUtils';
import type { QuestionType, TargetGender, CreateSurveyRequest } from '@/types/survey.types';

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

function getMultiplesFrom(min: number, count = 8, step = 10): number[] {
  const start = min % step === 0 ? min : Math.ceil(min / step) * step;
  return Array.from({ length: count }, (_, i) => start + i * step);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyFormModal() {
  const router = useRouter();
  const createMutation = useCreateSurvey();

  const {
    form, errors, touched,
    setField, touchField,
    addQuestion, removeQuestion, updateQuestion,
    setQuestionType, addOption, removeOption, updateOption,
    moveQuestion, validateAll,
  } = useSurveyForm();

  // ── Remote data ──────────────────────────────────────────────────────────
  const { categories = [], loading: loadingCats } = useCategories();
  const { data: costPerQuestion, isLoading: loadingCost } = useSurveyConfigs();

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { departments, loading: loadingDepts } = useDepartments();
  const { municipalities, loading: loadingMunis } = useMunicipalities(selectedDepartment);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<
    { code: string; name: string; departmentCode: string; departmentName: string }[]
  >([]);

  const [pricePerQuestion, setPricePerQuestion] = useState(0);
  const [expandedStep, setExpandedStep] = useState<1 | 2 | 3>(1);

  useEffect(() => { setField('maxResponses', '1'); }, []);
  useEffect(() => {
    if (costPerQuestion != null && costPerQuestion > 0) setPricePerQuestion(costPerQuestion);
  }, [costPerQuestion]);

  // ── Municipality helpers ─────────────────────────────────────────────────

  const addMunicipality = (code: string) => {
    if (form.municipalityCodes.includes(code)) return;
    const mun = municipalities.find((m) => m.code === code);
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

  const ERROR_STEP: Record<string, 1 | 2 | 3> = {
    title: 1, surveyConfigId: 1, maxResponses: 1,
    categoryIds: 2, municipalityCodes: 2, minAge: 2, maxAge: 2, targetGender: 2,
    questions: 3,
  };

  const ERROR_LABELS: Record<string, string> = {
    title: 'Título',
    surveyConfigId: 'Costo por pregunta',
    categoryIds: 'Categorías',
    minAge: 'Edad mínima',
    maxAge: 'Edad máxima',
    questions: 'Preguntas',
  };

  const activeErrors = Object.entries(errors).filter(
    ([key]) => touched.has(key) && errors[key],
  );

  const errorLabel = (key: string): string => {
    if (key.startsWith('question_')) {
      const match = key.match(/question_(\d+)_(\w+)/);
      if (match) {
        const num = parseInt(match[1]) + 1;
        return match[2] === 'options' ? `Pregunta ${num}: opciones` : `Pregunta ${num}`;
      }
    }
    return ERROR_LABELS[key] ?? key;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateAll();
    if (!valid) {
      const firstErrorKey = Object.keys(errors)[0] ?? '';
      const targetStep =
        ERROR_STEP[firstErrorKey] ?? (firstErrorKey.startsWith('question_') ? 3 : 1);
      setExpandedStep(targetStep);
      return;
    }
    const payload: CreateSurveyRequest = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      pricePerQuestionCents: pricePerQuestion * 100,
      maxResponses: form.maxResponses ? parseInt(form.maxResponses) : undefined,
      categoryIds: form.categoryIds,
      municipalityCodes: form.municipalityCodes.length > 0 ? form.municipalityCodes : undefined,
      minAge: form.minAge ? parseInt(form.minAge) : undefined,
      maxAge: form.maxAge ? parseInt(form.maxAge) : undefined,
      targetGender: (form.targetGender as TargetGender) || undefined,
      questions: form.questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        required: q.required,
        options: q.options.length > 0 ? q.options.filter((o) => o.trim()) : undefined,
      })),
    };

    try {
      await createMutation.mutateAsync(payload);
      router.push('/commercial/surveys');
    } catch {
      // error surfaced via createMutation.isError
    }
  };

  const err = (key: string) =>
    touched.has(key) && errors[key] ? (
      <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
    ) : null;

  // ── Computed values ──────────────────────────────────────────────────────

  const minPrice = costPerQuestion ?? 0;
  const maxResponsesNum = Math.max(1, form.maxResponses ? parseInt(form.maxResponses) : 1);
  const totalCost = pricePerQuestion * form.questions.length * maxResponsesNum;

  const step1Keys = ['title', 'surveyConfigId', 'maxResponses'];
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
    <div className="max-w-3xl mx-auto space-y-5 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/commercial/surveys')}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva encuesta</h2>
          <p className="text-sm text-gray-500 mt-1">Se crea en borrador. Publícala cuando esté lista.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Accordion sections */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* ══ STEP 1 — Información básica ══════════════════════════════════ */}
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

              {/* Cost per question — interactive */}
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <label className="text-xs font-medium text-gray-600">Precio por pregunta</label>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Mínimo del sistema: <span className="font-semibold text-[#03548C]">
                    {loadingCost ? '…' : COP.format(minPrice)}
                  </span>. Un precio más alto puede priorizar tu encuesta.
                </p>

                {/* Quick chips */}
                {!loadingCost && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getMultiplesFrom(minPrice, 8, 5).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPricePerQuestion(val)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                          pricePerQuestion === val
                            ? 'border-[#03548C] bg-[#03548C] text-white shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-[#03548C]/40 hover:text-[#03548C]'
                        }`}
                      >
                        {COP.format(val)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Stepper */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPricePerQuestion((p) => Math.max(minPrice, p - 5))}
                    disabled={loadingCost || pricePerQuestion <= minPrice}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition text-gray-600 disabled:opacity-40"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={loadingCost ? 'Cargando…' : COP.format(pricePerQuestion)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-center font-bold text-gray-900 bg-gray-50 cursor-default focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPricePerQuestion((p) => p + 5)}
                    disabled={loadingCost}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition text-gray-600 disabled:opacity-40"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {pricePerQuestion < minPrice && !loadingCost && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    El precio mínimo es {COP.format(minPrice)}
                  </p>
                )}
              </div>

              {/* Max responses */}
              <Field
                label="Máximo de respuestas"
                tooltip="Número máximo de respuestas que la encuesta aceptará. Una vez alcanzado este límite, la encuesta se cerrará automáticamente."
              >
                <input
                  type="number"
                  min={1}
                  max={10000000}
                  value={form.maxResponses}
                  onChange={(e) => setField('maxResponses', e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => ['e', 'E', '-', '+', '.'].includes(e.key) && e.preventDefault()}
                  onBlur={() => {
                    if (!form.maxResponses || parseInt(form.maxResponses) < 1) setField('maxResponses', '1');
                    touchField('maxResponses');
                  }}
                  className={inputCls(!!errors.maxResponses && touched.has('maxResponses'))}
                />
                {err('maxResponses')}
                <p className="mt-1 text-xs text-gray-400">Mínimo 1 — máximo 10.000.000</p>
              </Field>

            </div>
          </StepAccordion>

          {/* ══ STEP 2 — Segmentación ════════════════════════════════════════ */}
          <StepAccordion
            step={2}
            title="Segmentación de audiencia"
            open={expandedStep === 2}
            onToggle={() => setExpandedStep(expandedStep === 2 ? 1 : 2)}
            errorCount={step2Errors}
          >
            <div className="space-y-5">

              {/* Segmentation explainer */}
              <div className="flex items-start gap-2.5 rounded-xl border border-[#03548C]/15 bg-[#03548C]/5 px-4 py-3">
                <Info className="h-4 w-4 shrink-0 text-[#03548C] mt-0.5" />
                <p className="text-xs leading-relaxed text-[#03548C]/90">
                  La encuesta solo se le mostrará a usuarios que cumplan <strong>todos</strong> los
                  filtros de esta sección (ubicación, edad, género) — a excepción de{' '}
                  <strong>categorías</strong>, que no restringe a nadie: solo prioriza la encuesta
                  para quienes tengan esos intereses.
                </p>
              </div>

              {/* Categories */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Categorías / Intereses *
                  </span>
                </div>
                <p className="mb-2.5 text-xs text-gray-400">
                  No limita quién ve la encuesta — solo la prioriza para usuarios con estos intereses.
                </p>
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
                              ? 'border-[#03548C] bg-[#03548C]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleCategory(cat.id)}
                            className="sr-only"
                          />
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            active ? 'border-[#03548C] bg-[#00a4ff]' : 'border-gray-300 bg-white'
                          }`}>
                            {active && (
                              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className={`truncate text-sm font-medium ${active ? 'text-[#03548C]' : 'text-gray-700'}`}>
                            {cat.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {err('categoryIds')}
              </div>

              {/* Locations */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Ubicaciones geográficas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Departamento</label>
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
                    <label className="mb-1 block text-xs font-medium text-gray-600">Municipio</label>
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

              {/* Age range */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Edad mínima *">
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
                <Field label="Edad máxima *">
                  <input
                    type="number" min={13} max={100}
                    value={form.maxAge}
                    onChange={(e) => setField('maxAge', e.target.value)}
                    onBlur={() => touchField('maxAge')}
                    placeholder="100"
                    className={inputCls(!!errors.maxAge && touched.has('maxAge'))}
                  />
                  {err('maxAge')}
                </Field>
              </div>

              {/* Gender */}
              <Field label="Género objetivo">
                <select
                  value={form.targetGender}
                  onChange={(e) => setField('targetGender', (e.target.value as TargetGender) || '')}
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

          {/* ══ STEP 3 — Preguntas ═══════════════════════════════════════════ */}
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
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#03548C]/10 text-xs font-bold text-[#03548C]">
                      {idx + 1}
                    </span>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      <textarea
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, { text: e.target.value.slice(0, MAX_QUESTION_TEXT_LENGTH) })}
                        onBlur={() => touchField(`question_${idx}_text`)}
                        placeholder="Escribe aquí el texto completo de tu pregunta…"
                        rows={2}
                        maxLength={MAX_QUESTION_TEXT_LENGTH}
                        className={`w-full resize-none text-sm ${inputCls(
                          !!errors[`question_${idx}_text`] && touched.has(`question_${idx}_text`),
                        )}`}
                      />
                      <p className={`-mt-1 text-right text-[11px] ${
                        q.text.length > MAX_QUESTION_TEXT_LENGTH - 30 ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {q.text.length}/{MAX_QUESTION_TEXT_LENGTH}
                      </p>

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
                      {errors[`question_${idx}_options`] && touched.has(`question_${idx}_options`) && (
                        <p className="text-xs text-red-500">
                          {errors[`question_${idx}_options`]}
                        </p>
                      )}
                      {q.options.map((opt, oi) => {
                        const normalized = opt.trim().toLowerCase();
                        const isDuplicate = normalized !== '' && q.options.some(
                          (other, otherIdx) => otherIdx !== oi && other.trim().toLowerCase() === normalized,
                        );
                        return (
                          <div key={oi} className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-gray-400">
                              {oi + 1}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                updateOption(q.id, oi, e.target.value);
                                touchField(`question_${idx}_options`);
                              }}
                              onBlur={() => touchField(`question_${idx}_options`)}
                              placeholder={`Opción ${oi + 1}`}
                              className={`flex-1 ${inputCls(isDuplicate)}`}
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
                        );
                      })}
                      {q.options.length < MAX_OPTIONS_PER_QUESTION ? (
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="text-xs font-medium text-[#03548C] hover:text-[#03548C]"
                        >
                          + Agregar opción ({q.options.length}/{MAX_OPTIONS_PER_QUESTION})
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Máximo {MAX_OPTIONS_PER_QUESTION} opciones por pregunta
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {form.questions.length < MAX_QUESTIONS ? (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 hover:border-[#03548C]/40 hover:text-[#03548C] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Agregar pregunta ({form.questions.length}/{MAX_QUESTIONS})
                </button>
              ) : (
                <p className="text-center text-xs text-gray-400">
                  Alcanzaste el máximo de {MAX_QUESTIONS} preguntas por encuesta
                </p>
              )}
            </div>
          </StepAccordion>
        </div>

        {/* Total cost — always visible */}
        <div className="bg-gradient-to-br from-[#0b1440] via-[#03548C] to-[#0b1440] rounded-2xl p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-wide">Costo total de la encuesta</p>
              {loadingCost ? (
                <p className="text-white/70 text-sm mt-0.5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculando…
                </p>
              ) : (
                <p className="text-white/70 text-sm mt-0.5">
                  {COP.format(pricePerQuestion)} × {form.questions.length} pregunta(s) × {maxResponsesNum.toLocaleString('es-CO')} respuesta(s).
                </p>
              )}
            </div>
            <div className="text-right">
              {loadingCost ? (
                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
              ) : (
                <>
                  <p className="text-3xl font-extrabold">{COP.format(totalCost ?? 0)}</p>
                  <p className="text-white/50 text-xs">se descontará de tu saldo</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Validation error summary */}
        {activeErrors.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
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

        {/* Mutation error */}
        {createMutation.isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700">
              {createMutation.error?.message ?? 'Error al crear la encuesta'}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/commercial/surveys')}
            disabled={createMutation.isPending}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm
              hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-[2] py-3.5 bg-[#03548C] text-white rounded-xl font-bold text-sm
              hover:bg-[#0b1440] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 shadow-lg  cursor-pointer"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {createMutation.isPending
              ? 'Creando encuesta...'
              : loadingCost
                ? 'Crear encuesta'
                : `Crear encuesta · ${COP.format(totalCost ?? 0)}`}
          </button>
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
              className="text-gray-400 hover:text-[#03548C] transition-colors"
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
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white transition-colors ${
          errorCount > 0 ? 'bg-red-500' : 'bg-[#03548C]'
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
      : 'border-gray-200 bg-white focus:border-[#03548C] focus:ring-1 focus:ring-[#03548C]/40'
  }`;
}
