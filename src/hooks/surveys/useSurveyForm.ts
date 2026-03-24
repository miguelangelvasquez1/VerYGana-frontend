import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type {
  SurveyFormState,
  QuestionFormState,
  QuestionType,
  CreateSurveyRequest,
} from '@/types/survey.types';

// ─── Initial state ────────────────────────────────────────────────────────────

const emptyQuestion = (): QuestionFormState => ({
  id: uuid(),
  text: '',
  type: 'SINGLE_CHOICE',
  required: true,
  options: ['', ''],
});

const INITIAL_FORM: SurveyFormState = {
  title: '',
  description: '',
  rewardAmount: '',
  maxResponses: '',
  startsAt: '',
  endsAt: '',
  categoryIds: [],
  municipalityCodes: [],
  minAge: '',
  maxAge: '',
  targetGender: '',
  surveyConfigId: null,
  questions: [emptyQuestion()],
};

// ─── Validation ───────────────────────────────────────────────────────────────

export type FormErrors = Partial<Record<string, string>>;

function validate(state: SurveyFormState): FormErrors {
  const errors: FormErrors = {};

  if (!state.title.trim())
    errors.title = 'El título es obligatorio';
  else if (state.title.length > 200)
    errors.title = 'Máximo 200 caracteres';

  if (state.categoryIds.length === 0)
    errors.categoryIds = 'Selecciona al menos una categoría';

  if (state.minAge && state.maxAge) {
    if (parseInt(state.minAge) > parseInt(state.maxAge))
      errors.minAge = 'La edad mínima no puede superar la máxima';
  }

  if (state.questions.length === 0)
    errors.questions = 'Agrega al menos una pregunta';

  state.questions.forEach((q, i) => {
    if (!q.text.trim())
      errors[`question_${i}_text`] = 'La pregunta no puede estar vacía';

    if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.type)) {
      const filledOpts = q.options.filter((o) => o.trim());
      if (filledOpts.length < 2)
        errors[`question_${i}_options`] =
          'Agrega al menos 2 opciones válidas';
    }
  });

  return errors;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSurveyForm(initial?: Partial<SurveyFormState>) {
  const [form, setForm] = useState<SurveyFormState>({
    ...INITIAL_FORM,
    ...initial,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // ── Generic field setter ──────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof SurveyFormState>(key: K, value: SurveyFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => new Set(prev).add(key));
    },
    [],
  );

  const touchField = useCallback((key: string) => {
    setTouched((prev) => new Set(prev).add(key));
  }, []);

  // ── Question helpers ──────────────────────────────────────────────────────

  const addQuestion = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  }, []);

  const removeQuestion = useCallback((questionId: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  }, []);

  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<QuestionFormState>) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q,
        ),
      }));
    },
    [],
  );

  const setQuestionType = useCallback(
    (questionId: string, type: QuestionType) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id !== questionId) return q;
          const needsOptions = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type);
          return {
            ...q,
            type,
            options: needsOptions
              ? q.options.length >= 2
                ? q.options
                : ['', '']
              : [],
          };
        }),
      }));
    },
    [],
  );

  const moveQuestion = useCallback((fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      const qs = [...prev.questions];
      const [moved] = qs.splice(fromIndex, 1);
      qs.splice(toIndex, 0, moved);
      return { ...prev, questions: qs };
    });
  }, []);

  // ── Option helpers ────────────────────────────────────────────────────────

  const addOption = useCallback((questionId: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ''] } : q,
      ),
    }));
  }, []);

  const removeOption = useCallback(
    (questionId: string, optionIndex: number) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
            : q,
        ),
      }));
    },
    [],
  );

  const updateOption = useCallback(
    (questionId: string, optionIndex: number, value: string) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options: q.options.map((o, i) =>
                  i === optionIndex ? value : o,
                ),
              }
            : q,
        ),
      }));
    },
    [],
  );

  // ── Submission helpers ────────────────────────────────────────────────────

  /** Validates everything and marks all fields as touched to show errors. */
  const validateAll = useCallback((): boolean => {
    const errs = validate(form);
    setErrors(errs);

    const allKeys = new Set([
      ...Object.keys(INITIAL_FORM),
      ...form.questions.flatMap((_, i) => [
        `question_${i}_text`,
        `question_${i}_options`,
      ]),
    ]);
    setTouched(allKeys);

    return Object.keys(errs).length === 0;
  }, [form]);

  /** Serializes form state to the backend CreateSurveyRequest DTO. */
  const toPayload = useCallback((): CreateSurveyRequest => ({
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    surveyConfigId: form.surveyConfigId!,
    rewardAmount: form.rewardAmount ? parseFloat(form.rewardAmount) : 0,
    maxResponses: form.maxResponses ? parseInt(form.maxResponses) : undefined,
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
    categoryIds: form.categoryIds,
    municipalityCodes:
      form.municipalityCodes.length > 0 ? form.municipalityCodes : undefined,
    minAge: form.minAge ? parseInt(form.minAge) : undefined,
    maxAge: form.maxAge ? parseInt(form.maxAge) : undefined,
    targetGender: form.targetGender || undefined,
    questions: form.questions.map((q) => ({
      text: q.text.trim(),
      type: q.type,
      required: q.required,
      options:
        q.options.length > 0 ? q.options.filter((o) => o.trim()) : undefined,
    })),
  }), [form]);

  const reset = useCallback(() => {
    setForm({ ...INITIAL_FORM, ...initial });
    setErrors({});
    setTouched(new Set());
  }, [initial]);

  return {
    form,
    errors,
    touched,
    // Setters
    setField,
    touchField,
    // Question
    addQuestion,
    removeQuestion,
    updateQuestion,
    setQuestionType,
    moveQuestion,
    // Options
    addOption,
    removeOption,
    updateOption,
    // Submission
    validateAll,
    toPayload,
    reset,
  };
}