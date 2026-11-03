import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

import apiClient from '@/lib/api/client';
import { DeclarationService } from '@/services/commercial/DeclarationService';
import { TaxProfileService } from '@/services/commercial/TaxProfileService';
import type { TaxProfileSubmitRequest } from '@/types/commercial/TaxProfile.types';

const get = vi.mocked(apiClient.get);
const put = vi.mocked(apiClient.put);
const post = vi.mocked(apiClient.post);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaxProfileService', () => {
  it('getTaxProfile: 204 -> null (CA-16)', async () => {
    get.mockResolvedValue({ status: 204, data: '' });
    await expect(TaxProfileService.getTaxProfile()).resolves.toBeNull();
    expect(get).toHaveBeenCalledWith('/commercials/tax-profile');
  });

  it('getTaxProfile: 200 -> el perfil', async () => {
    const perfil = { status: 'SUBMITTED', currentVersion: 1 };
    get.mockResolvedValue({ status: 200, data: perfil });
    await expect(TaxProfileService.getTaxProfile()).resolves.toBe(perfil);
  });

  it('submitTaxProfile hace PUT con el cuerpo', async () => {
    const body = { currentCapacity: 'x' } as unknown as TaxProfileSubmitRequest;
    put.mockResolvedValue({ data: { currentVersion: 2 } });
    await expect(TaxProfileService.submitTaxProfile(body)).resolves.toEqual({ currentVersion: 2 });
    expect(put).toHaveBeenCalledWith('/commercials/tax-profile', body);
  });

  it('versiones y catálogo', async () => {
    get.mockResolvedValue({ status: 200, data: [] });
    await TaxProfileService.listTaxProfileVersions();
    expect(get).toHaveBeenLastCalledWith('/commercials/tax-profile/versions');
    await TaxProfileService.getTaxProfileVersion(3);
    expect(get).toHaveBeenLastCalledWith('/commercials/tax-profile/versions/3');
    await TaxProfileService.getTaxCatalog();
    expect(get).toHaveBeenLastCalledWith('/commercials/tax-profile/catalog');
  });

  it('sedes', async () => {
    get.mockResolvedValue({ status: 200, data: [] });
    await TaxProfileService.listEstablishments();
    expect(get).toHaveBeenLastCalledWith('/commercials/establishments');

    post.mockResolvedValue({ data: { id: 5 } });
    const body = {
      name: 'Sede',
      address: 'Calle 1',
      municipalityCode: '11001',
      relation: 'OWNED' as const,
    };
    await TaxProfileService.createEstablishment(body);
    expect(post).toHaveBeenLastCalledWith('/commercials/establishments', body);

    await TaxProfileService.closeEstablishment(5, { reason: 'Cierre' });
    expect(post).toHaveBeenLastCalledWith('/commercials/establishments/5/close', {
      reason: 'Cierre',
    });
  });

  it('un error del cliente se propaga sin tocarlo', async () => {
    const error = new Error('red caída');
    get.mockRejectedValue(error);
    await expect(TaxProfileService.getTaxProfile()).rejects.toBe(error);
  });
});

describe('DeclarationService', () => {
  it('getDeclaration pide el texto con el contexto (CA-12)', async () => {
    const view = { code: 'FORMALIZATION_COMMITMENT', fullText: 'texto' };
    get.mockResolvedValue({ status: 200, data: view });
    await expect(
      DeclarationService.getDeclaration('FORMALIZATION_COMMITMENT', 'TAX_PROFILE'),
    ).resolves.toBe(view);
    expect(get).toHaveBeenCalledWith('/commercials/declarations/FORMALIZATION_COMMITMENT', {
      params: { context: 'TAX_PROFILE' },
    });
  });
});
