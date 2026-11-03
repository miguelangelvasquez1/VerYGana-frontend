'use client';

import { Controller, useFormContext } from 'react-hook-form';
import type { TaxProfileFormValues } from '@/lib/taxProfile/taxProfileSchema';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';
import { CatalogSelect } from '../CatalogSelect';
import { FormTextArea, useFieldError } from '../FormFields';
import { YesNoRadioGroup } from '../YesNoRadioGroup';

export function InvoicingSection({ invoicingMethods }: { invoicingMethods: readonly CatalogEntry[] }) {
  const { control } = useFormContext<TaxProfileFormValues>();
  const obligatedError = useFieldError('invoicingObligated');
  const methodError = useFieldError('invoicingMethodCode');
  const withholdingError = useFieldError('withholdingAgent');

  return (
    <>
      <Controller
        control={control}
        name="invoicingObligated"
        render={({ field }) => (
          <YesNoRadioGroup
            name="invoicingObligated"
            legend="¿Estás obligado a facturar?"
            value={field.value}
            onChange={field.onChange}
            error={obligatedError}
          />
        )}
      />
      <Controller
        control={control}
        name="invoicingMethodCode"
        render={({ field }) => (
          <CatalogSelect
            id="invoicingMethodCode"
            label="Método de facturación"
            entries={invoicingMethods}
            value={field.value}
            onChange={field.onChange}
            error={methodError}
          />
        )}
      />
      <FormTextArea name="invoicingNotes" id="invoicingNotes" label="Notas sobre la facturación" />

      <Controller
        control={control}
        name="withholdingAgent"
        render={({ field }) => (
          <YesNoRadioGroup
            name="withholdingAgent"
            legend="¿Eres agente de retención?"
            value={field.value}
            onChange={field.onChange}
            error={withholdingError}
          />
        )}
      />
      <FormTextArea name="withholdingNotes" id="withholdingNotes" label="Notas sobre la retención" />
    </>
  );
}
