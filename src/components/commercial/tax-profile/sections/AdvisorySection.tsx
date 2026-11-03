'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import type { TaxProfileFormValues } from '@/lib/taxProfile/taxProfileSchema';
import { FormTextArea, useFieldError } from '../FormFields';
import { YesNoRadioGroup } from '../YesNoRadioGroup';

export function AdvisorySection() {
  const { control } = useFormContext<TaxProfileFormValues>();
  const hasAdvisor = useWatch({ control, name: 'hasAccountingAdvisor' });
  const error = useFieldError('hasAccountingAdvisor');

  return (
    <>
      <Controller
        control={control}
        name="hasAccountingAdvisor"
        render={({ field }) => (
          <YesNoRadioGroup
            name="hasAccountingAdvisor"
            legend="¿Tienes asesor contable?"
            value={field.value}
            onChange={field.onChange}
            error={error}
          />
        )}
      />
      {hasAdvisor === true && (
        <FormTextArea name="advisorScope" id="advisorScope" label="Alcance de la asesoría" />
      )}
      <p className="text-sm text-gray-600">
        Esta información no le da acceso a tu asesor a la plataforma
      </p>
    </>
  );
}
