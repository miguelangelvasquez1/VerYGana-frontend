import { z } from 'zod';

import type {
  CatalogEntryRequest,
  RetireCatalogEntryRequest,
  TaxCatalogType,
} from '@/types/commercial/TaxProfile.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
// El catálogo es inmutable: solo se agrega y se retira (RN-10).

const REQUIRED = 'Este campo es obligatorio.';
const tooLong = (max: number) => `Máximo ${max} caracteres.`;

export const catalogEntrySchema = z.object({
  code: z.string().trim().min(1, REQUIRED).max(30, tooLong(30)),
  label: z.string().trim().min(1, REQUIRED).max(200, tooLong(200)),
  legalBasis: z.string().trim().min(1, REQUIRED).max(500, tooLong(500)),
  validFrom: z.string().min(1, REQUIRED),
});
export type CatalogEntryFormValues = z.infer<typeof catalogEntrySchema>;

export function buildCatalogEntryBody(
  catalogType: TaxCatalogType,
  values: CatalogEntryFormValues,
): CatalogEntryRequest {
  return {
    catalogType,
    code: values.code.trim(),
    label: values.label.trim(),
    legalBasis: values.legalBasis.trim(),
    validFrom: values.validFrom,
  };
}

// `validFrom` y `validTo` son `YYYY-MM-DD`: la comparación de cadenas es la de fechas.
export function retireEntrySchema(validFrom: string) {
  return z.object({
    validTo: z
      .string()
      .min(1, REQUIRED)
      .refine((value) => value === '' || value >= validFrom, 'No puede ser anterior a "Vigente desde".'),
  });
}
export type RetireEntryFormValues = { validTo: string };

export function buildRetireBody(values: RetireEntryFormValues): RetireCatalogEntryRequest {
  return { validTo: values.validTo };
}
