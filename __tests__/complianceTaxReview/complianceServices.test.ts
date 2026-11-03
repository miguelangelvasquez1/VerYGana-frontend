import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import apiClient from '@/lib/api/client';
import { ComplianceCaseService } from '@/services/compliance/ComplianceCaseService';
import { ComplianceTaxProfileService } from '@/services/compliance/ComplianceTaxProfileService';

const get = vi.mocked(apiClient.get);
const post = vi.mocked(apiClient.post);
const ID = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ComplianceTaxProfileService', () => {
  it('list: sin status cuando no se pasa', async () => {
    const page = { data: [], meta: {} };
    get.mockResolvedValue({ data: page });
    await expect(ComplianceTaxProfileService.list({ page: 0, size: 20 })).resolves.toBe(page);
    expect(get).toHaveBeenCalledWith('/compliance/tax-profiles', { params: { page: 0, size: 20 } });
  });

  it('list: con status lo manda en params', async () => {
    get.mockResolvedValue({ data: { data: [] } });
    await ComplianceTaxProfileService.list({ status: 'OBSERVED', page: 1, size: 20 });
    expect(get).toHaveBeenCalledWith('/compliance/tax-profiles', {
      params: { status: 'OBSERVED', page: 1, size: 20 },
    });
  });

  it('get y getVersion', async () => {
    const detail = { profile: {} };
    get.mockResolvedValue({ data: detail });
    await expect(ComplianceTaxProfileService.get(ID)).resolves.toBe(detail);
    expect(get).toHaveBeenCalledWith(`/compliance/tax-profiles/${ID}`);
    await ComplianceTaxProfileService.getVersion(ID, 2);
    expect(get).toHaveBeenLastCalledWith(`/compliance/tax-profiles/${ID}/versions/2`);
  });

  it('getCatalog: sin params y sin filtrar los retirados', async () => {
    const entries = [
      { code: 'A', active: true },
      { code: 'B', active: false },
    ];
    get.mockResolvedValue({ data: entries });
    await expect(ComplianceTaxProfileService.getCatalog()).resolves.toBe(entries);
    expect(get).toHaveBeenCalledWith('/compliance/tax-catalog');
  });

  it('reviewSection: POST con el cuerpo tal cual', async () => {
    const body = { result: 'VERIFIED' as const };
    const res = { profile: {} };
    post.mockResolvedValue({ data: res });
    await expect(ComplianceTaxProfileService.reviewSection(ID, 'A_RUT', body)).resolves.toBe(res);
    expect(post).toHaveBeenCalledWith(`/compliance/tax-profiles/${ID}/sections/A_RUT/review`, body);
  });
});

describe('ComplianceCaseService', () => {
  it('listDocuments y reviewDocument', async () => {
    const docs = [{ id: 1 }];
    get.mockResolvedValue({ data: docs });
    await expect(ComplianceCaseService.listDocuments(ID)).resolves.toBe(docs);
    expect(get).toHaveBeenCalledWith(`/compliance/commercials/${ID}/documents`);
    const body = { result: 'ACCEPTED' as const, holderIdentification: 'x' };
    const doc = { id: 7 };
    post.mockResolvedValue({ data: doc });
    await expect(ComplianceCaseService.reviewDocument(7, body)).resolves.toBe(doc);
    expect(post).toHaveBeenCalledWith('/compliance/commercial-documents/7/review', body);
  });

  it('listCommitment, listFindings y listIncidents', async () => {
    get.mockResolvedValue({ data: [] });
    await ComplianceCaseService.listCommitment(ID);
    expect(get).toHaveBeenLastCalledWith(
      `/compliance/commercials/${ID}/declarations/FORMALIZATION_COMMITMENT`,
    );
    await ComplianceCaseService.listFindings(ID);
    expect(get).toHaveBeenLastCalledWith(`/compliance/commercials/${ID}/findings`);
    await ComplianceCaseService.listIncidents(ID);
    expect(get).toHaveBeenLastCalledWith(`/compliance/commercials/${ID}/incidents`);
  });

  it('listRequests: params con el empresario y sin status', async () => {
    const page = { data: [] };
    get.mockResolvedValue({ data: page });
    await expect(ComplianceCaseService.listRequests(ID, 1)).resolves.toBe(page);
    expect(get).toHaveBeenCalledWith('/compliance/information-requests', {
      params: { commercialPublicId: ID, page: 1, size: 20 },
    });
    const call = get.mock.calls[0][1] as { params: Record<string, unknown> };
    expect(call.params).not.toHaveProperty('status');
  });

  it('expone lecturas, las dos revisiones y (spec 018) las altas', () => {
    expect(Object.keys(ComplianceCaseService).sort()).toEqual([
      'createFinding',
      'createIncident',
      'listCommitment',
      'listDocuments',
      'listFindings',
      'listIncidents',
      'listRequests',
      'reviewDocument',
    ]);
    expect(Object.keys(ComplianceTaxProfileService).sort()).toEqual([
      'createCatalogEntry',
      'get',
      'getCatalog',
      'getVersion',
      'list',
      'retireCatalogEntry',
      'reviewSection',
    ]);
  });
});
