import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALLOWED_ORIGIN, ROUTES, createMockRouter, matchPath } from '../../e2e/support/mockRoutes.mjs';

// Enrutador de la API simulada de las pruebas de navegador (spec 012, T5).
// Función pura: lee fixtures a través de `readFixture`, no abre sockets.

interface Reply {
  status: number;
  headers: Record<string, string>;
  body?: string;
}
interface Router {
  handle(request: { method: string; url: string; headers?: Record<string, string> }): Reply;
}

const FIXTURES: Record<string, string> = {
  'api/list.json': '{"content":[1,2]}',
  'api/detail.json': '{"id":1}',
  'api/by-query.json': '{"filtered":true}',
  'pet-game.html': '<html>relleno</html>',
};

const TEST_ROUTES = [
  { method: 'GET', path: '/api/raffles', fixture: 'api/list.json' },
  { method: 'GET', path: '/api/raffles/:id', fixture: 'api/detail.json' },
  { method: 'POST', path: '/api/raffles', fixture: 'api/detail.json' },
  { method: 'GET', path: '/api/items', query: { status: 'ACTIVE' }, fixture: 'api/by-query.json' },
  { method: 'GET', path: '/api/items', fixture: 'api/list.json' },
  { method: 'GET', path: '/api/things/:id', fixture: 'api/detail.json' },
  { method: 'GET', path: '/api/things/recent', fixture: 'api/by-query.json' },
];

const makeRouter = (): Router =>
  createMockRouter({ routes: TEST_ROUTES, readFixture: (name: string) => FIXTURES[name] });

const get = (router: Router, url: string) => router.handle({ method: 'GET', url });
const unmatched = (router: Router) => JSON.parse(get(router, '/__unmatched').body ?? '[]');

describe('matchPath', () => {
  it('coincide con segmentos variables y los devuelve', () => {
    expect(matchPath('/api/raffles/:id', '/api/raffles/42')).toEqual({ id: '42' });
    expect(matchPath('/a/:x/b/:y', '/a/1/b/2')).toEqual({ x: '1', y: '2' });
  });

  it('no coincide con otro número de segmentos ni con otro texto fijo', () => {
    expect(matchPath('/api/raffles/:id', '/api/raffles')).toBeNull();
    expect(matchPath('/api/raffles/:id', '/api/raffles/1/live')).toBeNull();
    expect(matchPath('/api/raffles/:id', '/api/games/1')).toBeNull();
  });
});

describe('createMockRouter · coincidencias', () => {
  it('responde el fixture del método y la ruta, con tipo JSON', () => {
    const r = get(makeRouter(), '/api/raffles/7');
    expect(r.status).toBe(200);
    expect(r.headers['Content-Type']).toContain('application/json');
    expect(JSON.parse(r.body ?? '')).toEqual({ id: 1 });
  });

  it('distingue el método: GET y POST de la misma ruta son entradas distintas', () => {
    const router = makeRouter();
    expect(router.handle({ method: 'POST', url: '/api/raffles' }).status).toBe(200);
    expect(router.handle({ method: 'DELETE', url: '/api/raffles' }).status).toBe(404);
  });

  it('ignora la query salvo que el fixture la pida', () => {
    const router = makeRouter();
    expect(JSON.parse(get(router, '/api/raffles?page=3&size=10').body ?? '')).toEqual({ content: [1, 2] });
    expect(JSON.parse(get(router, '/api/items?status=ACTIVE&page=0').body ?? '')).toEqual({ filtered: true });
    expect(JSON.parse(get(router, '/api/items?status=OTHER').body ?? '')).toEqual({ content: [1, 2] });
    expect(JSON.parse(get(router, '/api/items').body ?? '')).toEqual({ content: [1, 2] });
  });
});

describe('createMockRouter · especificidad', () => {
  it('una ruta fija gana a una con segmento variable aunque vaya después en la tabla', () => {
    expect(JSON.parse(get(makeRouter(), '/api/things/recent').body ?? '')).toEqual({ filtered: true });
    expect(JSON.parse(get(makeRouter(), '/api/things/5').body ?? '')).toEqual({ id: 1 });
  });
});

describe('createMockRouter · lo que no tiene fixture', () => {
  it('responde 404 y deja la ruta registrada en /__unmatched, que luego se vacía', () => {
    const router = makeRouter();
    expect(get(router, '/api/desconocida?x=1').status).toBe(404);
    expect(router.handle({ method: 'POST', url: '/api/otra' }).status).toBe(404);
    expect(unmatched(router)).toEqual(['GET /api/desconocida', 'POST /api/otra']);
    expect(unmatched(router)).toEqual([]);
  });

  it('con ?test=<id> solo devuelve los pedidos de esa prueba (x-e2e-test) y deja los demás', () => {
    const router = makeRouter();
    router.handle({ method: 'GET', url: '/api/a', headers: { 'x-e2e-test': 'uno' } });
    router.handle({ method: 'GET', url: '/api/b', headers: { 'x-e2e-test': 'dos' } });
    router.handle({ method: 'GET', url: '/api/c' });
    expect(JSON.parse(get(router, '/__unmatched?test=uno').body ?? '[]')).toEqual(['GET /api/a']);
    expect(JSON.parse(get(router, '/__unmatched?test=uno').body ?? '[]')).toEqual([]);
    expect(unmatched(router)).toEqual(['GET /api/b', 'GET /api/c']);
  });

  it('un fixture que falta en disco también queda registrado y responde 404', () => {
    const router: Router = createMockRouter({
      routes: [{ method: 'GET', path: '/x', fixture: 'api/no-existe.json' }],
      readFixture: () => undefined,
    });
    expect(get(router, '/x').status).toBe(404);
    expect(unmatched(router)).toEqual(['GET /x']);
  });

  it('/ws/** responde 404 sin registrarse (es lo esperado: no hay socket en las pruebas)', () => {
    const router = makeRouter();
    expect(get(router, '/ws/info?t=1').status).toBe(404);
    expect(unmatched(router)).toEqual([]);
  });

  it('el favicon y similares no ensucian el registro', () => {
    const router = makeRouter();
    expect(get(router, '/favicon.ico').status).toBe(404);
    expect(unmatched(router)).toEqual([]);
  });
});

describe('createMockRouter · casos especiales', () => {
  it('el preflight OPTIONS responde 204 con el origen del front y credenciales', () => {
    const r = makeRouter().handle({
      method: 'OPTIONS',
      url: '/api/raffles',
      headers: { 'access-control-request-headers': 'authorization,content-type' },
    });
    expect(r.status).toBe(204);
    expect(r.headers['Access-Control-Allow-Origin']).toBe('http://127.0.0.1:3100');
    expect(ALLOWED_ORIGIN).toBe('http://127.0.0.1:3100');
    expect(r.headers['Access-Control-Allow-Credentials']).toBe('true');
    expect(r.headers['Access-Control-Allow-Headers']).toBe('authorization,content-type');
    expect(r.headers['Access-Control-Allow-Methods']).toContain('PATCH');
  });

  it('las respuestas normales también llevan las cabeceras de CORS', () => {
    const r = get(makeRouter(), '/api/raffles');
    expect(r.headers['Access-Control-Allow-Origin']).toBe('http://127.0.0.1:3100');
    expect(r.headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('el id 999 en una ruta de detalle responde 500 con un mensaje', () => {
    const router = makeRouter();
    const r = get(router, '/api/raffles/999');
    expect(r.status).toBe(500);
    expect(JSON.parse(r.body ?? '').message).toEqual(expect.any(String));
    expect(unmatched(router)).toEqual([]);
  });

  it('el SSE de notificaciones responde 204 (el EventSource no reintenta)', () => {
    const router = makeRouter();
    expect(get(router, '/notifications/stream?token=falso').status).toBe(204);
    expect(unmatched(router)).toEqual([]);
  });

  it('/pet-game-stub sirve el HTML de relleno del juego', () => {
    const r = get(makeRouter(), '/pet-game-stub?session_token=a&user_hash=b');
    expect(r.status).toBe(200);
    expect(r.headers['Content-Type']).toContain('text/html');
    expect(r.body).toBe('<html>relleno</html>');
  });
});

describe('ROUTES (la tabla real)', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../e2e/fixtures');

  it('cada fixture que nombra existe en e2e/fixtures y es JSON válido', () => {
    const missing = (ROUTES as { fixture: string }[])
      .map((r) => r.fixture)
      .filter((f) => !existsSync(path.join(root, f)));
    expect(missing).toEqual([]);
    for (const { fixture } of ROUTES as { fixture: string }[]) {
      expect(() => JSON.parse(readFileSync(path.join(root, fixture), 'utf8')), fixture).not.toThrow();
    }
  });

  it('no repite método, ruta y query', () => {
    const keys = (ROUTES as { method: string; path: string; query?: object }[]).map(
      (r) => `${r.method} ${r.path} ${JSON.stringify(r.query ?? {})}`,
    );
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });

  it('incluye el inicio de sesión de la mascota y el perfil del consumidor', () => {
    const keys = (ROUTES as { method: string; path: string }[]).map((r) => `${r.method} ${r.path}`);
    expect(keys).toContain('POST /pet/session/init');
    expect(keys).toContain('GET /consumers/profile');
  });

  it('el fixture de /pet/session/init trae una url con session_token y user_hash ficticios', () => {
    const body = JSON.parse(readFileSync(path.join(root, 'api/pet/session-init.json'), 'utf8'));
    const [, query] = String(body.url).split('?');
    const search = new URLSearchParams(query);
    expect(search.get('session_token')).toBeTruthy();
    expect(search.get('user_hash')).toBeTruthy();
    expect(String(body.url)).toContain('/pet-game-stub');
  });
});
