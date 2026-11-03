'use client';

import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { TaxProfileFormValues } from '@/lib/taxProfile/taxProfileSchema';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';
import { CatalogSelect } from '../CatalogSelect';
import { Field, describedBy, fieldInputClass } from '../Field';
import { FormTextInput, useFieldError } from '../FormFields';

export function RegimeActivitiesSection({ regimes }: { regimes: readonly CatalogEntry[] }) {
  const { control, setValue, formState } = useFormContext<TaxProfileFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'activities' });
  const activities = useWatch({ control, name: 'activities' });
  const regimeError = useFieldError('regimeCode');
  // Error de la lista completa (p. ej. "exactamente una principal"): RHF lo deja en `root`.
  const listError = formState.errors.activities?.root?.message ?? formState.errors.activities?.message;

  const markMain = (index: number) => {
    fields.forEach((_, i) => {
      setValue(`activities.${i}.main`, i === index, { shouldDirty: true, shouldValidate: formState.isSubmitted });
    });
  };

  return (
    <>
      <Controller
        control={control}
        name="regimeCode"
        render={({ field }) => (
          <CatalogSelect
            id="regimeCode"
            label="Régimen"
            entries={regimes}
            value={field.value}
            onChange={field.onChange}
            error={regimeError}
          />
        )}
      />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">Actividades económicas (CIIU)</p>
        {listError && (
          <p role="alert" className="text-xs text-red-600">
            {typeof listError === 'string' ? listError : String(listError)}
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {fields.map((item, index) => (
            <li
              key={item.id}
              className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[8rem_1fr_auto_auto] md:items-start"
            >
              <Controller
                control={control}
                name={`activities.${index}.ciiuCode`}
                render={({ field, fieldState }) => (
                  <Field
                    id={`activities-${index}-ciiuCode`}
                    label="CIIU"
                    required
                    error={fieldState.error?.message}
                  >
                    <input
                      id={`activities-${index}-ciiuCode`}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="off"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      aria-invalid={fieldState.error ? true : undefined}
                      aria-describedby={describedBy(
                        `activities-${index}-ciiuCode`,
                        Boolean(fieldState.error),
                        false,
                      )}
                      className={fieldInputClass(Boolean(fieldState.error))}
                    />
                  </Field>
                )}
              />
              <FormTextInput
                name={`activities.${index}.description`}
                id={`activities-${index}-description`}
                label="Descripción (opcional)"
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 md:mt-7">
                <input
                  type="radio"
                  name="activities-main"
                  checked={activities?.[index]?.main === true}
                  onChange={() => markMain(index)}
                  className="h-4 w-4"
                />
                Principal
              </label>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:mt-6"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <div>
          <button
            type="button"
            onClick={() => append({ ciiuCode: '', description: '', main: false })}
            className="rounded-lg border border-[#03548C] px-4 py-2 text-sm font-semibold text-[#03548C] hover:bg-blue-50"
          >
            Agregar actividad
          </button>
        </div>
      </div>
    </>
  );
}
