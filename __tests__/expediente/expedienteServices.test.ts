import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));
vi.mock('@/services/commercial/OnboardingService', () => ({
  OnboardingService: { uploadDocumentFile: vi.fn() },
}));

import apiClient from '@/lib/api/client';
import { OnboardingService } from '@/services/commercial/OnboardingService';
import { ExpedienteService } from '@/services/commercial/ExpedienteService';
import { InformationRequestService } from '@/services/commercial/InformationRequestService';
import type { ExpedienteDocumentUploadRequest } from '@/types/commercial/Expediente.types';

const get = vi.mocked(apiClient.get);
const post = vi.mocked(apiClient.post);
const uploadDocumentFile = vi.mocked(OnboardingService.uploadDocumentFile);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExpedienteService', () => {
  it('list: GET /commercials/documents y devuelve data', async () => {
    const docs = [{ id: 1 }];
    get.mockResolvedValue({ data: docs });
    await expect(ExpedienteService.list()).resolves.toBe(docs);
    expect(get).toHaveBeenCalledWith('/commercials/documents');
  });

  it('prepareUpload: POST con el cuerpo tal cual', async () => {
    const body: ExpedienteDocumentUploadRequest = {
      documentType: 'RUT',
      originalFileName: 'rut.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    };
    const permission = { documentId: 7, permission: { uploadUrl: 'u', expiresInSeconds: 60 } };
    post.mockResolvedValue({ data: permission });
    await expect(ExpedienteService.prepareUpload(body)).resolves.toBe(permission);
    expect(post).toHaveBeenCalledWith('/commercials/documents/prepare-upload', body);
  });

  it('confirmUpload: POST /commercials/documents/7/confirm', async () => {
    const doc = { id: 7 };
    post.mockResolvedValue({ data: doc });
    await expect(ExpedienteService.confirmUpload(7)).resolves.toBe(doc);
    expect(post).toHaveBeenCalledWith('/commercials/documents/7/confirm');
  });

  it('uploadFile delega en OnboardingService.uploadDocumentFile y no usa apiClient', async () => {
    uploadDocumentFile.mockResolvedValue(undefined);
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    await ExpedienteService.uploadFile('https://r2.example.test/u', file);
    expect(uploadDocumentFile).toHaveBeenCalledWith('https://r2.example.test/u', file);
    expect(get).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('CA-7: solo expone listar, preparar, subir y confirmar (sin eliminar ni editar)', () => {
    expect(Object.keys(ExpedienteService).sort()).toEqual(
      ['confirmUpload', 'list', 'prepareUpload', 'uploadFile'].sort(),
    );
  });
});

describe('InformationRequestService', () => {
  it('listMine: GET /commercials/information-requests', async () => {
    const list = [{ publicId: 'a' }];
    get.mockResolvedValue({ data: list });
    await expect(InformationRequestService.listMine()).resolves.toBe(list);
    expect(get).toHaveBeenCalledWith('/commercials/information-requests');
  });

  it('getMine: GET por publicId', async () => {
    const view = { publicId: 'abc' };
    get.mockResolvedValue({ data: view });
    await expect(InformationRequestService.getMine('abc')).resolves.toBe(view);
    expect(get).toHaveBeenCalledWith('/commercials/information-requests/abc');
  });

  it('respond: POST /{id}/responses con ese cuerpo', async () => {
    const view = { publicId: 'abc', status: 'RESPONDED' };
    post.mockResolvedValue({ data: view });
    await expect(InformationRequestService.respond('abc', { message: 'x' })).resolves.toBe(view);
    expect(post).toHaveBeenCalledWith('/commercials/information-requests/abc/responses', {
      message: 'x',
    });
  });
});
