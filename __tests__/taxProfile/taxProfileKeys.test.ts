import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { retryUnlessForbiddenOrMissing } from '@/hooks/commercial/retryPolicy';
import {
  isContractSheetDeclarationKey,
  TAX_PROFILE_INVALIDATIONS,
  declarationCachePolicy,
  taxProfileKeys,
} from '@/hooks/commercial/taxProfileKeys';

const asText = (key: readonly unknown[]) => JSON.stringify(key);

describe('taxProfileKeys', () => {
  const keys = {
    all: taxProfileKeys.all,
    profile: taxProfileKeys.profile,
    versions: taxProfileKeys.versions,
    version1: taxProfileKeys.version(1),
    version2: taxProfileKeys.version(2),
    catalog: taxProfileKeys.catalog,
    establishments: taxProfileKeys.establishments,
    declarationTax: taxProfileKeys.declaration('FORMALIZATION_COMMITMENT', 'TAX_PROFILE'),
    declarationContract: taxProfileKeys.declaration('FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET'),
    onboardingAll: taxProfileKeys.onboardingAll,
    onboardingDocuments: taxProfileKeys.onboardingDocuments,
    declarationsAll: taxProfileKeys.declarationsAll,
  };

  it('todas las claves son distintas y serializables', () => {
    const texts = Object.values(keys).map(asText);
    expect(new Set(texts).size).toBe(texts.length);
    for (const key of Object.values(keys)) {
      expect(JSON.parse(asText(key))).toEqual(key);
    }
  });

  it('version(1) distinta de version(2)', () => {
    expect(asText(keys.version1)).not.toBe(asText(keys.version2));
  });

  it('el contexto de la declaración distingue la clave', () => {
    expect(asText(keys.declarationTax)).not.toBe(asText(keys.declarationContract));
  });

  it('onboardingAll es prefijo de onboardingDocuments', () => {
    expect(keys.onboardingDocuments.slice(0, keys.onboardingAll.length)).toEqual(keys.onboardingAll);
  });
});

describe('declarationsAll y política de caché (RN-10 de la 015)', () => {
  it('declarationsAll es prefijo de las claves de declaración', () => {
    const prefix = taxProfileKeys.declarationsAll;
    for (const context of ['TAX_PROFILE', 'CONTRACT_SHEET'] as const) {
      const key = taxProfileKeys.declaration('FORMALIZATION_COMMITMENT', context);
      expect(key.slice(0, prefix.length)).toEqual(prefix);
    }
  });

  it('CONTRACT_SHEET nunca reutiliza caché', () => {
    expect(declarationCachePolicy('CONTRACT_SHEET')).toEqual({
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
    });
  });

  it('TAX_PROFILE conserva los 30 min de la 014', () => {
    const policy = declarationCachePolicy('TAX_PROFILE');
    expect(policy).toEqual({ staleTime: 30 * 60 * 1000 });
    expect('gcTime' in policy).toBe(false);
    expect('refetchOnMount' in policy).toBe(false);
  });
});

describe('TAX_PROFILE_INVALIDATIONS (RN-17)', () => {
  const has = (list: ReadonlyArray<readonly unknown[]>, key: readonly unknown[]) =>
    list.some((k) => asText(k) === asText(key));

  it('aprobar el contrato invalida perfil, declaraciones y onboarding', () => {
    const list = TAX_PROFILE_INVALIDATIONS.approveContract;
    expect(has(list, taxProfileKeys.profile)).toBe(true);
    expect(has(list, taxProfileKeys.declarationsAll)).toBe(true);
    expect(has(list, taxProfileKeys.onboardingAll)).toBe(true);
  });

  it('enviar la ficha invalida perfil, versiones y onboarding', () => {
    const list = TAX_PROFILE_INVALIDATIONS.submit;
    expect(has(list, taxProfileKeys.profile)).toBe(true);
    expect(has(list, taxProfileKeys.versions)).toBe(true);
    expect(has(list, taxProfileKeys.onboardingAll)).toBe(true);
  });

  it('crear o cerrar una sede invalida sedes y perfil', () => {
    for (const list of [
      TAX_PROFILE_INVALIDATIONS.createEstablishment,
      TAX_PROFILE_INVALIDATIONS.closeEstablishment,
    ]) {
      expect(has(list, taxProfileKeys.establishments)).toBe(true);
      expect(has(list, taxProfileKeys.profile)).toBe(true);
    }
  });
});

describe('isContractSheetDeclarationKey (T14: no releer la Hoja Final tras aprobar)', () => {
  it('excluye cualquier declaración de contexto CONTRACT_SHEET', () => {
    expect(
      isContractSheetDeclarationKey(
        taxProfileKeys.declaration('FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET'),
      ),
    ).toBe(true);
  });

  it('deja la de TAX_PROFILE, la ficha y el onboarding', () => {
    expect(
      isContractSheetDeclarationKey(
        taxProfileKeys.declaration('FORMALIZATION_COMMITMENT', 'TAX_PROFILE'),
      ),
    ).toBe(false);
    expect(isContractSheetDeclarationKey(taxProfileKeys.profile)).toBe(false);
    expect(isContractSheetDeclarationKey(taxProfileKeys.onboardingAll)).toBe(false);
    expect(isContractSheetDeclarationKey(taxProfileKeys.declarationsAll)).toBe(false);
  });
});

describe('retryUnlessForbiddenOrMissing (T16)', () => {
  const httpError = (status: number) =>
    new AxiosError('x', 'ERR', undefined, undefined, {
      status,
      data: {},
      statusText: '',
      headers: {},
      config: {} as never,
    });

  it('403 y 404 no se reintentan', () => {
    expect(retryUnlessForbiddenOrMissing(0, httpError(403))).toBe(false);
    expect(retryUnlessForbiddenOrMissing(0, httpError(404))).toBe(false);
  });

  it('500 o fallo de red se reintenta una vez', () => {
    expect(retryUnlessForbiddenOrMissing(0, httpError(500))).toBe(true);
    expect(retryUnlessForbiddenOrMissing(1, httpError(500))).toBe(false);
    expect(retryUnlessForbiddenOrMissing(0, new Error('network'))).toBe(true);
  });
});

describe('useDeclaration usa la política de reintento (T16)', () => {
  it('lleva retry: retryUnlessForbiddenOrMissing', () => {
    const src = readFileSync(join(process.cwd(), 'src/hooks/commercial/useTaxProfile.ts'), 'utf8');
    const body = src.slice(src.indexOf('export function useDeclaration'), src.indexOf('export function useSubmitTaxProfile'));
    expect(body).toMatch(/retry:\s*retryUnlessForbiddenOrMissing/);
  });
});
