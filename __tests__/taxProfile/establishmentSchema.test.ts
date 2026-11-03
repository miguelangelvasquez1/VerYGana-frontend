import { describe, expect, it } from 'vitest';
import {
  closeEstablishmentSchema,
  establishmentSchema,
  splitEstablishments,
} from '@/lib/taxProfile/establishmentSchema';
import type { Establishment } from '@/types/commercial/TaxProfile.types';

const RN14 =
  'Indica la dirección física de la sede. Una página web, correo o red social no es un establecimiento';

const valid = {
  name: 'Sede principal',
  address: 'Calle 10 # 5-20',
  municipalityCode: '11001',
  relation: 'OWNED' as const,
};

function messagesFor(input: unknown, field: string): string[] {
  const result = establishmentSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path[0] === field).map((i) => i.message);
}

describe('establishmentSchema', () => {
  it('acepta una dirección física', () => {
    expect(establishmentSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['http://x.co', 'HTTPS://x', 'WwW.tienda', 'Www.', 'ventas@x', '@tienda', 'Http://x'])(
    'rechaza canal digital: %s',
    (address) => {
      expect(messagesFor({ ...valid, address }, 'address')).toContain(RN14);
    },
  );

  it('nombre vacío o demasiado largo', () => {
    expect(messagesFor({ ...valid, name: '' }, 'name').length).toBeGreaterThan(0);
    expect(messagesFor({ ...valid, name: 'a'.repeat(151) }, 'name').length).toBeGreaterThan(0);
    expect(establishmentSchema.safeParse({ ...valid, name: 'a'.repeat(150) }).success).toBe(true);
  });

  it('dirección demasiado larga', () => {
    expect(messagesFor({ ...valid, address: 'a'.repeat(301) }, 'address').length).toBeGreaterThan(0);
  });

  it('municipio y relación obligatorios', () => {
    expect(messagesFor({ ...valid, municipalityCode: '' }, 'municipalityCode').length).toBeGreaterThan(0);
    expect(messagesFor({ ...valid, relation: '' }, 'relation').length).toBeGreaterThan(0);
    expect(messagesFor({ ...valid, relation: 'RENTED' }, 'relation').length).toBeGreaterThan(0);
  });

  it.each(['OWNED', 'LEASED', 'FRANCHISE', 'OTHER'])('relación %s válida', (relation) => {
    expect(establishmentSchema.safeParse({ ...valid, relation }).success).toBe(true);
  });
});

describe('closeEstablishmentSchema', () => {
  it('motivo vacío o solo espacios: error', () => {
    expect(closeEstablishmentSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(closeEstablishmentSchema.safeParse({ reason: '   ' }).success).toBe(false);
  });
  it('301 caracteres: error', () => {
    expect(closeEstablishmentSchema.safeParse({ reason: 'a'.repeat(301) }).success).toBe(false);
  });
  it('motivo válido', () => {
    expect(closeEstablishmentSchema.safeParse({ reason: 'Me trasladé' }).success).toBe(true);
  });
});

describe('splitEstablishments', () => {
  const est = (id: number, status: Establishment['status']): Establishment => ({
    id,
    name: `Sede ${id}`,
    address: 'Calle 1',
    municipalityCode: '11001',
    municipalityName: 'Municipio de prueba',
    relation: 'OWNED',
    status,
    createdAt: '2026-01-01T00:00:00Z',
    closedAt: status === 'CLOSED' ? '2026-02-01T00:00:00Z' : null,
    closedReason: status === 'CLOSED' ? 'Cierre' : null,
  });
  it('separa activos y cerrados conservando el orden', () => {
    const { active, closed } = splitEstablishments([
      est(1, 'ACTIVE'),
      est(2, 'CLOSED'),
      est(3, 'ACTIVE'),
      est(4, 'CLOSED'),
    ]);
    expect(active.map((e) => e.id)).toEqual([1, 3]);
    expect(closed.map((e) => e.id)).toEqual([2, 4]);
  });
});
