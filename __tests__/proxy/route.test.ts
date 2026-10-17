import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Sin red ni sesión real: getToken y fetch se simulan.
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));

import { getToken } from 'next-auth/jwt';
import { GET } from '@/app/api/proxy-download/route';
import { DOWNLOAD_TIMEOUT_MS } from '@/lib/proxy/downloadPolicy';

// Literal a propósito: si alguien sube el tope de la política, esta prueba debe ponerse roja.
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_URL = 'https://files.example.test/doc.pdf?sig=firma-ficticia';
const getTokenMock = vi.mocked(getToken);
const fetchMock = vi.fn();

function call(url: string | null) {
  const qs = url === null ? '' : `?url=${encodeURIComponent(url)}`;
  return GET(new NextRequest(`https://app.example.test/api/proxy-download${qs}`));
}

/** Cuerpo en trozos de `chunkSize` bytes hasta `total` bytes. */
function streamOf(total: number, chunkSize = 1024 * 1024): ReadableStream<Uint8Array> {
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= total) return controller.close();
      const n = Math.min(chunkSize, total - sent);
      controller.enqueue(new Uint8Array(n));
      sent += n;
    },
  });
}

async function drain(res: Response): Promise<number> {
  const reader = res.body!.getReader();
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return n;
    n += value.byteLength;
  }
}

beforeEach(() => {
  vi.stubEnv('PROXY_DOWNLOAD_ALLOWED_HOSTS', 'files.example.test');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  getTokenMock.mockReset();
  getTokenMock.mockResolvedValue({ role: 'ROLE_CONSUMER' } as never);
  // El handler registra fallos del origen; se silencia.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/proxy-download: validación previa', () => {
  it.each([
    ['sin parámetro url', null],
    ['host no permitido', 'https://evil.example.test/x'],
    ['http', 'http://files.example.test/x'],
  ])('%s: 400 y nunca llama a fetch (con sesión)', async (_n, url) => {
    const res = await call(url);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('destino no permitido sin sesión: 400 igual (la URL se valida antes que la sesión)', async () => {
    getTokenMock.mockResolvedValue(null);
    const res = await call('https://evil.example.test/x');
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lista de hosts vacía: rechaza todo', async () => {
    vi.stubEnv('PROXY_DOWNLOAD_ALLOWED_HOSTS', '');
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('destino permitido sin sesión: 401 y nunca llama a fetch', async () => {
    getTokenMock.mockResolvedValue(null);
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('GET /api/proxy-download: llamada al origen', () => {
  it('usa redirect: error, señal de tiempo, GET y sin caché', async () => {
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));
    await call(ALLOWED_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, init] = fetchMock.mock.calls[0];
    expect(String(target)).toBe(ALLOWED_URL);
    expect(init.method).toBe('GET');
    expect(init.redirect).toBe('error');
    expect(init.cache).toBe('no-store');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('la señal usa el tiempo límite de la política', async () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));
    await call(ALLOWED_URL);
    expect(spy).toHaveBeenCalledWith(DOWNLOAD_TIMEOUT_MS);
  });
});

describe('GET /api/proxy-download: errores del origen', () => {
  it('tiempo agotado: 504', async () => {
    fetchMock.mockRejectedValue(new DOMException('timeout', 'TimeoutError'));
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(504);
  });

  it('fallo de red: 502', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(502);
  });

  it('redirección rechazada por redirect: error: 502', async () => {
    fetchMock.mockRejectedValue(new TypeError('unexpected redirect'));
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(502);
  });

  it.each([404, 500])('origen con estado %i: 502', async (status) => {
    fetchMock.mockResolvedValue(new Response('no', { status }));
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(502);
  });

  it('el log de fallos no incluye la query firmada de la URL', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await call(ALLOWED_URL);
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain('files.example.test');
    expect(logged).not.toContain('firma-ficticia');
  });
});

describe('GET /api/proxy-download: tope de tamaño', () => {
  it('Content-Length mayor al tope: 502 sin entregar el cuerpo', async () => {
    fetchMock.mockResolvedValue(
      new Response(streamOf(10), {
        status: 200,
        headers: { 'Content-Length': String(MAX_DOWNLOAD_BYTES + 1) },
      }),
    );
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(502);
  });

  it('sin Content-Length y cuerpo mayor al tope: el flujo se corta', async () => {
    fetchMock.mockResolvedValue(new Response(streamOf(MAX_DOWNLOAD_BYTES + 1), { status: 200 }));
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(200);
    await expect(drain(res)).rejects.toThrow();
  });

  it('Content-Length falso (menor que el real): el flujo se corta igual', async () => {
    fetchMock.mockResolvedValue(
      new Response(streamOf(MAX_DOWNLOAD_BYTES + 1), {
        status: 200,
        headers: { 'Content-Length': '10' },
      }),
    );
    const res = await call(ALLOWED_URL);
    await expect(drain(res)).rejects.toThrow();
  });

  it('cuerpo de exactamente el tope: pasa completo', async () => {
    fetchMock.mockResolvedValue(
      new Response(streamOf(MAX_DOWNLOAD_BYTES), {
        status: 200,
        headers: { 'Content-Length': String(MAX_DOWNLOAD_BYTES) },
      }),
    );
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(200);
    await expect(drain(res)).resolves.toBe(MAX_DOWNLOAD_BYTES);
  });
});

describe('GET /api/proxy-download: respuesta correcta', () => {
  it('lleva solo las cabeceras fijas aunque el origen mande text/html', async () => {
    fetchMock.mockResolvedValue(
      new Response('<script>alert(1)</script>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': 'inline',
          'Set-Cookie': 'a=b',
        },
      }),
    );
    const res = await call(ALLOWED_URL);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="download"');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });
});
