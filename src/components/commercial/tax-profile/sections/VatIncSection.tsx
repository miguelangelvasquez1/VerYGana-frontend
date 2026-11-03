'use client';

import { Controller, useFormContext } from 'react-hook-form';
import type { TaxProfileFormValues } from '@/lib/taxProfile/taxProfileSchema';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';
import { CatalogSelect } from '../CatalogSelect';
import { FormTextArea, useFieldError } from '../FormFields';

export function VatIncSection({
  vatConditions,
  incConditions,
}: {
  vatConditions: readonly CatalogEntry[];
  incConditions: readonly CatalogEntry[];
}) {
  const { control } = useFormContext<TaxProfileFormValues>();
  const vatError = useFieldError('vatConditionCode');
  const incError = useFieldError('incConditionCode');

  return (
    <>
      <Controller
        control={control}
        name="vatConditionCode"
        render={({ field }) => (
          <CatalogSelect
            id="vatConditionCode"
            label="Condición frente al IVA"
            entries={vatConditions}
            value={field.value}
            onChange={field.onChange}
            error={vatError}
          />
        )}
      />
      <Controller
        control={control}
        name="incConditionCode"
        render={({ field }) => (
          <CatalogSelect
            id="incConditionCode"
            label="Condición frente al INC"
            entries={incConditions}
            value={field.value}
            onChange={field.onChange}
            error={incError}
          />
        )}
      />
      <FormTextArea
        name="taxConditionScope"
        id="taxConditionScope"
        label="¿A qué productos o servicios aplica?"
      />
    </>
  );
}
