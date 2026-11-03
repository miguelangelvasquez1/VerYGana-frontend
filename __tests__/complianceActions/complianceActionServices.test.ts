import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import apiClient from '@/lib/api/client';
import { ComplianceAlertService } from '@/services/compliance/ComplianceAlertService';
import { ComplianceCaseService } from '@/services/compliance/ComplianceCaseService';
import { ComplianceRequestService } from '@/services/compliance/ComplianceRequestService';
import { ComplianceTaxProfileService } from '@/services/compliance/ComplianceTaxProfileService';

const get = vi.mocked(apiClient.get);
const post = vi.mocked(apiClient.post);
const ID = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ data: 'res' });
  post.mockResolvedValue({ data: 'res' });
});

describe('ComplianceRequestService', () => {
  it('search: sin status cuando es "Todos"', async () => {
    await expect(ComplianceRequestService.search({ page: 0, size: 20 })).resolves.toBe('res');
    expect(get).toHaveBeenCalledWith('/compliance/information-requests', { params: { page: 0, size: 20 } });
  });
  it('search: con status', async () => {
    await ComplianceRequestService.search({ status: 'RESPONDED', page: 1, size: 20 });
    expect(get).toHaveBeenCalledWith('/compliance/information-requests', {
      params: { status: 'RESPONDED', page: 1, size: 20 },
    });
  });
  it('get', async () => {
    await ComplianceRequestService.get(ID);
    expect(get).toHaveBeenCalledWith(`/compliance/information-requests/${ID}`);
  });
  it('create, review y cancel: POST con el cuerpo tal cual', async () => {
    const create = { commercialPublicId: ID } as never;
    await ComplianceRequestService.create(create);
    expect(post).toHaveBeenLastCalledWith('/compliance/information-requests', create);
    await ComplianceRequestService.review(ID, { result: 'SUFFICIENT' });
    expect(post).toHaveBeenLastCalledWith(`/compliance/information-requests/${ID}/review`, { result: 'SUFFICIENT' });
    await ComplianceRequestService.cancel(ID, { reason: 'x' });
    expect(post).toHaveBeenLastCalledWith(`/compliance/information-requests/${ID}/cancel`, { reason: 'x' });
  });
});

describe('ComplianceCaseService (018)', () => {
  it('createFinding y createIncident', async () => {
    const finding = { factObserved: 'x' } as never;
    await ComplianceCaseService.createFinding(finding);
    expect(post).toHaveBeenLastCalledWith('/compliance/findings', finding);
    const incident = { context: 'x' } as never;
    await ComplianceCaseService.createIncident(incident);
    expect(post).toHaveBeenLastCalledWith('/compliance/incidents', incident);
  });
});

describe('ComplianceAlertService', () => {
  it('listAlerts: pendingOnly, página base 0 y size 20', async () => {
    await ComplianceAlertService.listAlerts({ pendingOnly: true, page: 0, size: 20 });
    expect(get).toHaveBeenCalledWith('/compliance/alerts', { params: { pendingOnly: true, page: 0, size: 20 } });
    await ComplianceAlertService.listAlerts({ pendingOnly: false, page: 2, size: 20 });
    expect(get).toHaveBeenLastCalledWith('/compliance/alerts', { params: { pendingOnly: false, page: 2, size: 20 } });
  });
  it('reviewAlert', async () => {
    await ComplianceAlertService.reviewAlert(9, { notes: 'ok' });
    expect(post).toHaveBeenCalledWith('/compliance/alerts/9/review', { notes: 'ok' });
  });
  it('reglas: listar, crear y desactivar sin cuerpo', async () => {
    await ComplianceAlertService.listRules();
    expect(get).toHaveBeenCalledWith('/compliance/alert-rules');
    const rule = { code: 'ABC' } as never;
    await ComplianceAlertService.createRule(rule);
    expect(post).toHaveBeenLastCalledWith('/compliance/alert-rules', rule);
    await ComplianceAlertService.deactivateRule(4);
    expect(post).toHaveBeenLastCalledWith('/compliance/alert-rules/4/deactivate');
  });
});

describe('ComplianceTaxProfileService (018)', () => {
  it('createCatalogEntry y retireCatalogEntry', async () => {
    const entry = { code: 'A' } as never;
    await ComplianceTaxProfileService.createCatalogEntry(entry);
    expect(post).toHaveBeenLastCalledWith('/compliance/tax-catalog', entry);
    await ComplianceTaxProfileService.retireCatalogEntry(3, { validTo: '2026-12-01' });
    expect(post).toHaveBeenLastCalledWith('/compliance/tax-catalog/3/retire', { validTo: '2026-12-01' });
  });
});
