import { describe, expect, it, vi } from 'vitest';
import {
  DOWNLOAD_URL_MAX_AGE_MS,
  documentsFromRefetch,
  isDownloadUrlFresh,
  openExpedienteDocument,
} from '@/lib/expediente/openDocument';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';

const OLD_URL = 'https://r2.example.test/viejo?sig=1';
const NEW_URL = 'https://r2.example.test/nuevo?sig=2';
const NOW = 1_000_000_000;

function docWith(url: string | null, id = 1): ExpedienteDocument {
  return { id, downloadUrl: url } as ExpedienteDocument;
}

function fakeWindow() {
  return { opener: {} as unknown, location: { replace: vi.fn() }, close: vi.fn() };
}

describe('isDownloadUrlFresh', () => {
  it('3 min 59 s sí; 4 min no; fetchedAt 0 no', () => {
    expect(DOWNLOAD_URL_MAX_AGE_MS).toBe(4 * 60 * 1000);
    expect(isDownloadUrlFresh(NOW - (3 * 60 + 59) * 1000, NOW)).toBe(true);
    expect(isDownloadUrlFresh(NOW - 4 * 60 * 1000, NOW)).toBe(false);
    expect(isDownloadUrlFresh(0, NOW)).toBe(false);
  });
});

describe('openExpedienteDocument', () => {
  it('URL fresca: abre sin pedir la lista', async () => {
    const win = fakeWindow();
    const openWindow = vi.fn().mockReturnValue(win);
    const refetch = vi.fn();
    const result = await openExpedienteDocument({
      documentId: 1,
      documents: [docWith(OLD_URL)],
      fetchedAt: NOW - 1000,
      now: NOW,
      refetch,
      openWindow,
    });
    expect(result).toBe('opened');
    expect(openWindow).toHaveBeenCalledTimes(1);
    expect(openWindow).toHaveBeenCalledWith(OLD_URL);
    expect(refetch).not.toHaveBeenCalled();
  });

  it('URL fresca: el null de window.open (siempre con noopener) no se trata como fallo', async () => {
    const result = await openExpedienteDocument({
      documentId: 1,
      documents: [docWith(OLD_URL)],
      fetchedAt: NOW - 1000,
      now: NOW,
      refetch: vi.fn(),
      openWindow: vi.fn().mockReturnValue(null),
    });
    expect(result).toBe('opened');
  });

  it('CA-6: URL vieja abre la pestaña vacía, pide la lista y redirige a la URL nueva', async () => {
    const win = fakeWindow();
    const openWindow = vi.fn().mockReturnValue(win);
    const refetch = vi.fn().mockResolvedValue([docWith(NEW_URL)]);
    const result = await openExpedienteDocument({
      documentId: 1,
      documents: [docWith(OLD_URL)],
      fetchedAt: NOW - 10 * 60 * 1000,
      now: NOW,
      refetch,
      openWindow,
    });
    expect(result).toBe('opened');
    expect(openWindow).toHaveBeenCalledTimes(1);
    expect(openWindow).toHaveBeenCalledWith();
    expect(win.opener).toBeNull();
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(win.location.replace).toHaveBeenCalledWith(NEW_URL);
    expect(win.location.replace).not.toHaveBeenCalledWith(OLD_URL);
  });

  it('vieja y el documento ya no está tras la lista, o la lista falla: cierra y falla', async () => {
    for (const refetch of [
      vi.fn().mockResolvedValue([docWith(NEW_URL, 99)]),
      vi.fn().mockResolvedValue([docWith(null)]),
      vi.fn().mockRejectedValue(new Error('red')),
    ]) {
      const win = fakeWindow();
      const result = await openExpedienteDocument({
        documentId: 1,
        documents: [docWith(OLD_URL)],
        fetchedAt: 0,
        now: NOW,
        refetch,
        openWindow: vi.fn().mockReturnValue(win),
      });
      expect(result).toBe('failed');
      expect(win.close).toHaveBeenCalledTimes(1);
      expect(win.location.replace).not.toHaveBeenCalled();
    }
  });

  it('vieja y un bloqueador de ventanas: tras la lista abre con la URL nueva', async () => {
    const reopened = fakeWindow();
    const openWindow = vi.fn().mockReturnValueOnce(null).mockReturnValue(reopened);
    const refetch = vi.fn().mockResolvedValue([docWith(NEW_URL)]);
    const result = await openExpedienteDocument({
      documentId: 1,
      documents: [docWith(OLD_URL)],
      fetchedAt: 0,
      now: NOW,
      refetch,
      openWindow,
    });
    expect(result).toBe('opened');
    expect(openWindow).toHaveBeenNthCalledWith(1);
    expect(openWindow).toHaveBeenNthCalledWith(2, NEW_URL);
  });

  it('el resultado es solo "opened" o "failed" (no devuelve la URL)', async () => {
    const result = await openExpedienteDocument({
      documentId: 1,
      documents: [docWith(OLD_URL)],
      fetchedAt: NOW,
      now: NOW,
      refetch: vi.fn(),
      openWindow: vi.fn(),
    });
    expect(['opened', 'failed']).toContain(result);
    expect(JSON.stringify(result)).not.toContain('r2.example.test');
  });
});

describe('documentsFromRefetch (bloqueante 1, CA-6)', () => {
  it('un refetch fallido de TanStack trae el data anterior con isError: debe rechazar', () => {
    const failed = { data: [docWith(OLD_URL)], isError: true, status: 'error', error: new Error('red') };
    expect(() => documentsFromRefetch(failed)).toThrow();
  });

  it('también rechaza si solo trae status "error"', () => {
    expect(() => documentsFromRefetch({ data: [docWith(OLD_URL)], isError: false, status: 'error' })).toThrow();
  });

  it('un refetch bueno devuelve la lista nueva', () => {
    const ok = { data: [docWith(NEW_URL)], isError: false, status: 'success' };
    expect(documentsFromRefetch(ok)).toEqual([docWith(NEW_URL)]);
  });

  it('con el adaptador, un refetch fallido cierra la pestaña y no abre la URL vencida', async () => {
    const win = fakeWindow();
    const failed = { data: [docWith(OLD_URL)], isError: true, status: 'error', error: new Error('red') };
    const result = await openExpedienteDocument({
      documentId: 1,
      documents: [docWith(OLD_URL)],
      fetchedAt: 0,
      now: NOW,
      refetch: async () => documentsFromRefetch(failed),
      openWindow: vi.fn().mockReturnValue(win),
    });
    expect(result).toBe('failed');
    expect(win.close).toHaveBeenCalledTimes(1);
    expect(win.location.replace).not.toHaveBeenCalled();
  });
});
