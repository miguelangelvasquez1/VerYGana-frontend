'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { TaxProfileFormValues } from '@/lib/taxProfile/taxProfileSchema';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';
import { CatalogMultiSelect } from '../CatalogSelect';
import { Field, fieldInputClass } from '../Field';
import { useFieldError } from '../FormFields';

export interface RutDocumentOption {
  id: number;
  originalFileName: string;
  uploadedAt: string;
}

export function RutSection({
  rutDocuments,
  responsibilities,
}: {
  rutDocuments: readonly RutDocumentOption[];
  responsibilities: readonly CatalogEntry[];
}) {
  const { control } = useFormContext<TaxProfileFormValues>();
  const rutError = useFieldError('rutDocumentId');
  const responsibilitiesError = useFieldError('rutResponsibilityCodes');

  return (
    <>
      {rutDocuments.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          No tienes un RUT vigente cargado
        </p>
      ) : (
        <Controller
          control={control}
          name="rutDocumentId"
          render={({ field }) => (
            <Field id="rutDocumentId" label="Documento RUT" error={rutError}>
              <select
                id="rutDocumentId"
                value={field.value === null || field.value === undefined ? '' : String(field.value)}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                ref={field.ref}
                className={fieldInputClass(Boolean(rutError))}
              >
                <option value="">Sin documento RUT</option>
                {rutDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.originalFileName} · cargado el {formatBogotaDateTime(doc.uploadedAt)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        />
      )}

      <Controller
        control={control}
        name="rutResponsibilityCodes"
        render={({ field }) => (
          <CatalogMultiSelect
            id="rutResponsibilityCodes"
            legend="Responsabilidades del RUT"
            entries={responsibilities}
            value={field.value}
            onChange={field.onChange}
            error={responsibilitiesError}
          />
        )}
      />
    </>
  );
}
