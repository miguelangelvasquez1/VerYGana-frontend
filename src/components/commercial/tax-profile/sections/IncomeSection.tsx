'use client';

import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { EXPEDIENTE_TEXTS } from '@/lib/labels/expedienteRequests';
import { supportSelectorState } from '@/lib/expediente/expediente';
import { INCOME_CONCEPT_LABELS, INCOME_SCOPE_LABELS } from '@/lib/labels/taxCompliance';
import { formatCents, parsePesosInput, pesosToCents } from '@/lib/money/cents';
import { findIncomeOverlaps } from '@/lib/taxProfile/incomeOverlap';
import {
  emptyTaxProfileValues,
  OVERLAP_MESSAGE,
  type TaxProfileFormValues,
} from '@/lib/taxProfile/taxProfileSchema';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';
import type { IncomeConcept, IncomeScope } from '@/types/commercial/TaxProfile.types';
import { Field, describedBy, fieldInputClass } from '../Field';
import { FormTextArea, FormTextInput, useFieldError } from '../FormFields';

const CONCEPTS = Object.keys(INCOME_CONCEPT_LABELS) as IncomeConcept[];
const SCOPES = Object.keys(INCOME_SCOPE_LABELS) as IncomeScope[];

// Vista previa "= $ 1.234,56" del monto escrito; vacía si todavía no es un monto válido.
function amountPreview(text: string): string | null {
  const parsed = parsePesosInput(text);
  if (parsed.kind !== 'valid' || parsed.decimals > 2) return null;
  const cents = pesosToCents(text);
  return cents === null ? null : `= ${formatCents(cents)}`;
}

function SelectField({
  name,
  id,
  label,
  placeholder,
  options,
  overlapped,
}: {
  name: `incomeReports.${number}.concept` | `incomeReports.${number}.scope`;
  id: string;
  label: string;
  placeholder: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  overlapped: boolean;
}) {
  const { control } = useFormContext<TaxProfileFormValues>();
  const rawError = useFieldError(name);
  // Con choque en vivo ya se muestra el texto de RN-10: no se repite el mismo error.
  const error = overlapped && rawError === OVERLAP_MESSAGE ? undefined : rawError;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field id={id} label={label} required error={error}>
          <select
            id={id}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, Boolean(error), false)}
            className={fieldInputClass(Boolean(error))}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    />
  );
}

// RN-15: soporte del periodo. Valor "" <-> null y número <-> id del documento.
function SupportSelect({
  index,
  documentsStatus,
  documents,
}: {
  index: number;
  documentsStatus: 'pending' | 'error' | 'success';
  documents: readonly ExpedienteDocument[] | undefined;
}) {
  const { control } = useFormContext<TaxProfileFormValues>();
  const name = `incomeReports.${index}.supportDocumentId` as const;
  const id = `incomeReports-${index}-supportDocumentId`;
  const error = useFieldError(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const state = supportSelectorState({
          status: documentsStatus,
          documents,
          currentId: field.value,
        });
        return (
          <Field id={id} label={EXPEDIENTE_TEXTS.supportLabel} hint={state.note ?? undefined} error={error}>
            <select
              id={id}
              value={field.value === null ? '' : String(field.value)}
              onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={state.disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(id, Boolean(error), Boolean(state.note))}
              className={fieldInputClass(Boolean(error))}
            >
              {state.options.map((option) => (
                <option key={option.value ?? 'none'} value={option.value === null ? '' : String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        );
      }}
    />
  );
}

export function IncomeSection({
  documentsStatus,
  documents,
}: {
  documentsStatus: 'pending' | 'error' | 'success';
  documents: readonly ExpedienteDocument[] | undefined;
}) {
  const { control, formState } = useFormContext<TaxProfileFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'incomeReports' });
  // Solo se observa esta lista, no todo el formulario.
  const rows = useWatch({ control, name: 'incomeReports' });
  const overlaps = findIncomeOverlaps(rows ?? []);
  const listError =
    formState.errors.incomeReports?.root?.message ?? formState.errors.incomeReports?.message;

  return (
    <div className="flex flex-col gap-3">
      {listError && (
        <p role="alert" className="text-xs text-red-600">
          {String(listError)}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {fields.map((item, index) => {
          const overlapped = overlaps.has(index);
          const preview = amountPreview(rows?.[index]?.amount ?? '');
          return (
            <li
              key={item.id}
              className={`flex flex-col gap-3 rounded-xl border p-3 ${
                overlapped ? 'border-orange-400 bg-orange-50/40' : 'border-gray-200'
              }`}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SelectField
                  name={`incomeReports.${index}.concept`}
                  id={`incomeReports-${index}-concept`}
                  label="Concepto"
                  placeholder="Selecciona un concepto"
                  options={CONCEPTS.map((value) => ({ value, label: INCOME_CONCEPT_LABELS[value] }))}
                  overlapped={overlapped}
                />
                <SelectField
                  name={`incomeReports.${index}.scope`}
                  id={`incomeReports-${index}-scope`}
                  label="Alcance"
                  placeholder="Selecciona un alcance"
                  options={SCOPES.map((value) => ({ value, label: INCOME_SCOPE_LABELS[value] }))}
                  overlapped={overlapped}
                />
                <FormTextInput
                  name={`incomeReports.${index}.periodStart`}
                  id={`incomeReports-${index}-periodStart`}
                  label="Desde"
                  type="date"
                  required
                />
                <FormTextInput
                  name={`incomeReports.${index}.periodEnd`}
                  id={`incomeReports-${index}-periodEnd`}
                  label="Hasta"
                  type="date"
                  required
                />
                <div className="flex flex-col gap-1">
                  <FormTextInput
                    name={`incomeReports.${index}.amount`}
                    id={`incomeReports-${index}-amount`}
                    label="Monto en pesos"
                    inputMode="decimal"
                    placeholder="1500000 o 1234,56"
                    required
                  />
                  {preview && <p className="text-xs text-gray-500">{preview}</p>}
                </div>
                <SupportSelect index={index} documentsStatus={documentsStatus} documents={documents} />
              </div>
              <FormTextArea
                name={`incomeReports.${index}.notes`}
                id={`incomeReports-${index}-notes`}
                label="Notas (opcional)"
                rows={2}
              />
              {overlapped && (
                <p role="alert" className="text-xs font-semibold text-orange-700">
                  {OVERLAP_MESSAGE}
                </p>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div>
        <button
          type="button"
          onClick={() => append(emptyTaxProfileValues().incomeReports[0])}
          className="rounded-lg border border-[#03548C] px-4 py-2 text-sm font-semibold text-[#03548C] hover:bg-blue-50"
        >
          Agregar periodo
        </button>
      </div>
    </div>
  );
}
