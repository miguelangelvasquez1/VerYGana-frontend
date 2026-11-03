import { z } from 'zod';
import type { Establishment } from '@/types/commercial/TaxProfile.types';

export const DIGITAL_CHANNEL_MESSAGE =
  'Indica la dirección física de la sede. Una página web, correo o red social no es un establecimiento';

// `http`, `www.` o `@`, sin distinguir mayúsculas (RN-14).
const DIGITAL_CHANNEL_RE = /(http|www\.|@)/i;

export const establishmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de la sede')
    .max(150, 'Máximo 150 caracteres'),
  address: z
    .string()
    .trim()
    .min(1, 'Escribe la dirección de la sede')
    .max(300, 'Máximo 300 caracteres')
    .refine((value) => !DIGITAL_CHANNEL_RE.test(value), DIGITAL_CHANNEL_MESSAGE),
  municipalityCode: z.string().min(1, 'Elige el municipio'),
  relation: z.enum(['OWNED', 'LEASED', 'FRANCHISE', 'OTHER'], {
    error: 'Elige la relación con la sede',
  }),
});

export type EstablishmentFormValues = z.input<typeof establishmentSchema>;

export const closeEstablishmentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Escribe el motivo del cierre')
    .max(300, 'Máximo 300 caracteres'),
});

export type CloseEstablishmentFormValues = z.input<typeof closeEstablishmentSchema>;

export function splitEstablishments(list: readonly Establishment[]): {
  active: Establishment[];
  closed: Establishment[];
} {
  return {
    active: list.filter((e) => e.status === 'ACTIVE'),
    closed: list.filter((e) => e.status === 'CLOSED'),
  };
}
