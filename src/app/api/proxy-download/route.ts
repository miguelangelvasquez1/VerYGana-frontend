import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  DOWNLOAD_TIMEOUT_MS,
  MAX_DOWNLOAD_BYTES,
  parseAllowedHosts,
  validateTarget,
} from '@/lib/proxy/downloadPolicy';

// Cabeceras fijas: la respuesta siempre es una descarga, nunca contenido renderizable
// desde el origen del front (evita XSS por un cuerpo HTML ajeno).
const DOWNLOAD_HEADERS = {
  'Content-Type': 'application/octet-stream',
  'Content-Disposition': 'attachment; filename="download"',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'private, no-store',
};

function fail(message: string, status: number) {
  return new NextResponse(message, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  // Se lee en ejecución (variable de servidor, no NEXT_PUBLIC). Vacía o ausente: rechaza todo.
  const allowedHosts = parseAllowedHosts(process.env.PROXY_DOWNLOAD_ALLOWED_HOSTS);
  const target = validateTarget(request.nextUrl.searchParams.get('url'), allowedHosts);
  if (!target.ok) return fail('Invalid or not allowed url', 400);

  // Capa extra: exige sesión. No es la defensa principal (la sesión del front se puede fabricar).
  // Va después de validar la URL: así un destino no permitido da 400 con o sin sesión.
  const session = await getToken({ req: request });
  if (!session) return fail('Unauthorized', 401);

  let upstream: Response;
  try {
    upstream = await fetch(target.url, {
      method: 'GET',
      redirect: 'error', // una redirección no puede sacar la petición de la lista
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    // Solo el host: la URL prefirmada lleva la firma en la query.
    console.error('[proxy-download] origin failure', target.url.hostname, timedOut ? 'timeout' : 'error');
    return fail(timedOut ? 'Origin timeout' : 'Failed to fetch resource', timedOut ? 504 : 502);
  }

  if (!upstream.ok || !upstream.body) {
    console.error('[proxy-download] origin status', target.url.hostname, upstream.status);
    await upstream.body?.cancel();
    return fail('Resource not available', 502);
  }

  const declared = Number(upstream.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > MAX_DOWNLOAD_BYTES) {
    await upstream.body.cancel();
    return fail('Resource too large', 502);
  }

  // Tope real por streaming: corta aunque el origen mienta o no declare Content-Length.
  let received = 0;
  const limited = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > MAX_DOWNLOAD_BYTES) {
          controller.error(new Error('size limit exceeded'));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );

  return new NextResponse(limited, { status: 200, headers: DOWNLOAD_HEADERS });
}
