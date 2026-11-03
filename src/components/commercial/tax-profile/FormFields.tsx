'use client';

import { get, useFormContext, type Path } from 'react-hook-form';
import type { TaxProfileFormValues } from '@/lib/taxProfile/taxProfileSchema';
import { Field, describedBy, fieldInputClass } from './Field';

export type FieldName = Path<TaxProfileFormValues>;

// Mensaje de error de un campo del formulario (por su ruta, p. ej. `activities.0.ciiuCode`).
export function useFieldError(name: FieldName): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<TaxProfileFormValues>();
  const error = get(errors, name) as { message?: unknown } | undefined;
  return typeof error?.message === 'string' ? error.message : undefined;
}

export function FormTextArea({
  name,
  id,
  label,
  hint,
  required,
  rows = 3,
}: {
  name: FieldName;
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  rows?: number;
}) {
  const { register } = useFormContext<TaxProfileFormValues>();
  const error = useFieldError(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(error), Boolean(hint))}
        className={fieldInputClass(Boolean(error))}
        {...register(name)}
      />
    </Field>
  );
}

export function FormTextInput({
  name,
  id,
  label,
  hint,
  required,
  type = 'text',
  inputMode,
  placeholder,
}: {
  name: FieldName;
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'date';
  inputMode?: 'decimal' | 'numeric';
  placeholder?: string;
}) {
  const { register } = useFormContext<TaxProfileFormValues>();
  const error = useFieldError(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(error), Boolean(hint))}
        className={fieldInputClass(Boolean(error))}
        {...register(name)}
      />
    </Field>
  );
}
