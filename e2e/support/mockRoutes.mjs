// Tabla y enrutador puro de la API simulada de las pruebas de navegador (spec 012).
// No abre sockets ni lee disco por su cuenta: `mockApi.mjs` lo conecta a `node:http` y a `e2e/fixtures`.
// Todo son datos ficticios; ninguna respuesta lleva información real (P-16).

/** Origen del front de pruebas: el único que el navegador puede usar para llamar a esta API. */
export const ALLOWED_ORIGIN = 'http://127.0.0.1:3100';

/** Id reservado: en una ruta de detalle (`:id`) la API simulada responde 500 para probar el estado de error. */
export const ERROR_ID = '999';

/**
 * @typedef {{ method: string, path: string, fixture: string, query?: Record<string, string> }} MockRoute
 * `fixture` es una ruta relativa a `e2e/fixtures`. `query` solo se pide cuando el fixture depende de ella.
 */

/** @type {MockRoute[]} */
export const ROUTES = [
  // Barra y proveedores globales
  { method: 'GET', path: '/consumers/initialData', fixture: 'api/consumers/initialData.json' },
  { method: 'GET', path: '/notifications', fixture: 'api/notifications/list.json' },
  { method: 'GET', path: '/notifications/unread/count', fixture: 'api/notifications/unread-count.json' },
  { method: 'GET', path: '/api/levels/me', fixture: 'api/levels/me.json' },
  { method: 'GET', path: '/api/levels/me/history', fixture: 'api/levels/history.json' },
  { method: 'GET', path: '/api/levels/config', fixture: 'api/levels/config.json' },

  // Registro
  { method: 'GET', path: '/categories/all', fixture: 'api/categories/all.json' },
  { method: 'GET', path: '/locations/departments', fixture: 'api/locations/departments.json' },
  { method: 'GET', path: '/avatars', fixture: 'api/avatars/list.json' },

  // Consumidor, referidos y llaves
  { method: 'GET', path: '/consumers/profile', fixture: 'api/consumers/profile.json' },
  { method: 'GET', path: '/consumers/available-keys', fixture: 'api/consumers/available-keys.json' },
  { method: 'GET', path: '/referrals/my-code', fixture: 'api/referrals/my-code.json' },
  { method: 'GET', path: '/referrals/my-referrals', fixture: 'api/referrals/my-referrals.json' },
  { method: 'GET', path: '/key-transactions', fixture: 'api/key-transactions/list.json' },
  { method: 'GET', path: '/key-transactions/total-earned-keys', fixture: 'api/key-transactions/total-earned.json' },
  { method: 'GET', path: '/key-transactions/total-used-keys', fixture: 'api/key-transactions/total-used.json' },
  { method: 'GET', path: '/key-transactions/total-expired-keys', fixture: 'api/key-transactions/total-expired.json' },

  // Tienda
  { method: 'GET', path: '/productCategories', fixture: 'api/products/categories.json' },
  { method: 'GET', path: '/products/filter', fixture: 'api/products/filter.json' },
  { method: 'GET', path: '/products/favorites', fixture: 'api/products/favorites.json' },
  { method: 'GET', path: '/products/favorites/count', fixture: 'api/products/favorites-count.json' },
  { method: 'GET', path: '/products/commercial/:id', fixture: 'api/products/commercial.json' },
  { method: 'GET', path: '/products/:id', fixture: 'api/products/detail.json' },
  { method: 'GET', path: '/commercials/:id/profile', fixture: 'api/commercials/profile.json' },
  { method: 'GET', path: '/purchases', fixture: 'api/purchases/list.json' },
  { method: 'GET', path: '/purchases/:id', fixture: 'api/purchases/detail.json' },

  // Juegos, encuestas, foro, soporte y anuncios
  { method: 'GET', path: '/games', fixture: 'api/games/list.json' },
  { method: 'GET', path: '/surveys', fixture: 'api/surveys/available.json' },
  { method: 'GET', path: '/surveys/:id', fixture: 'api/surveys/detail.json' },
  { method: 'GET', path: '/impact-stories/consumer', fixture: 'api/impact-stories/consumer.json' },
  { method: 'GET', path: '/pqrs/mine', fixture: 'api/pqrs/mine.json' },
  { method: 'GET', path: '/pqrs/:id', fixture: 'api/pqrs/detail.json' },
  { method: 'GET', path: '/adLike/next', fixture: 'api/ads/next.json' },

  // Rifas
  { method: 'GET', path: '/api/raffles/actives', fixture: 'api/raffles/actives.json' },
  { method: 'GET', path: '/api/raffles/lives', fixture: 'api/raffles/lives.json' },
  { method: 'GET', path: '/api/raffles/me', fixture: 'api/raffles/me.json' },
  { method: 'GET', path: '/api/raffles/me/count', fixture: 'api/raffles/me-count.json' },
  { method: 'GET', path: '/api/raffles/:id', fixture: 'api/raffles/detail.json' },
  { method: 'GET', path: '/api/raffles/:id/draw-status', fixture: 'api/raffles/draw-status.json' },
  { method: 'GET', path: '/api/my/raffle-tickets/raffle/:id', fixture: 'api/raffles/my-tickets.json' },
  { method: 'GET', path: '/results/last', fixture: 'api/raffles/results-last.json' },
  { method: 'GET', path: '/results/raffle/:id', fixture: 'api/raffles/result.json' },
  { method: 'GET', path: '/results/raffle/:id/draw-proof', fixture: 'api/raffles/draw-proof.json' },
  { method: 'GET', path: '/winners/last', fixture: 'api/raffles/winners-last.json' },
  { method: 'GET', path: '/winners/my-prizes', fixture: 'api/winners/my-prizes.json' },

  // Otros roles (solo las capturas de escritorio de CA-8)
  { method: 'GET', path: '/commercials/initialData', fixture: 'api/commercials/initial-data.json' },
  { method: 'GET', path: '/plans/commercial/state', fixture: 'api/plans/commercial-state.json' },
  { method: 'GET', path: '/commercial/prosperity', fixture: 'api/commercial/prosperity-summary.json' },
  { method: 'GET', path: '/game-designers/me/branding-requests', fixture: 'api/game-designers/branding-requests.json' },

  // Mascota
  { method: 'POST', path: '/pet/session/init', fixture: 'api/pet/session-init.json' },
];

const CORS_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';

/**
 * Compara un patrón con segmentos `:variable` contra una ruta.
 * @param {string} pattern
 * @param {string} pathname
 * @returns {Record<string, string> | null} los valores de los segmentos variables, o null si no coincide
 */
export function matchPath(pattern, pathname) {
  const p = pattern.split('/');
  const a = pathname.split('/');
  if (p.length !== a.length) return null;
  /** @type {Record<string, string>} */
  const params = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(':')) {
      if (a[i] === '') return null;
      params[p[i].slice(1)] = decodeURIComponent(a[i]);
    } else if (p[i] !== a[i]) {
      return null;
    }
  }
  return params;
}

/**
 * Busca la entrada de la tabla. Las que piden query van antes que las que no.
 * @param {MockRoute[]} routes
 * @param {string} method
 * @param {string} pathname
 * @param {URLSearchParams} search
 */
function findRoute(routes, method, pathname, search) {
  let fallback = null;
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchPath(route.path, pathname);
    if (!params) continue;
    if (route.query) {
      const ok = Object.entries(route.query).every(([k, v]) => search.get(k) === v);
      if (ok) return { route, params };
    } else if (!fallback || Object.keys(params).length < Object.keys(fallback.params).length) {
      // Gana la entrada con menos segmentos variables: `/products/favorites` antes que `/products/:id`.
      fallback = { route, params };
    }
  }
  return fallback;
}

/**
 * @param {{ routes?: MockRoute[], readFixture: (name: string) => string | undefined }} options
 */
export function createMockRouter({ routes = ROUTES, readFixture }) {
  // Pedidos sin fixture. `test` es el id que la prueba manda en `x-e2e-test` (vacío si no lo manda,
  // como el servidor de Next): con dos workers, cada prueba mira solo lo suyo.
  /** @type {{ line: string, test: string }[]} */
  let unmatched = [];

  /** @param {Record<string, string>} [extra] */
  const baseHeaders = (extra = {}) => ({
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
    ...extra,
  });

  /** @param {number} status @param {unknown} data */
  const json = (status, data) => ({
    status,
    headers: baseHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
    body: JSON.stringify(data),
  });

  /**
   * @param {{ method: string, url: string, headers?: Record<string, string> }} request
   * @returns {{ status: number, headers: Record<string, string>, body?: string }}
   */
  function handle({ method, url, headers = {} }) {
    const { pathname, searchParams } = new URL(url, 'http://127.0.0.1');
    const verb = method.toUpperCase();

    if (verb === 'OPTIONS') {
      return {
        status: 204,
        headers: baseHeaders({
          'Access-Control-Allow-Methods': CORS_METHODS,
          'Access-Control-Allow-Headers': headers['access-control-request-headers'] ?? 'authorization,content-type',
          'Access-Control-Max-Age': '600',
        }),
      };
    }

    // Endpoint de control: devuelve y vacía el registro de pedidos sin fixture.
    // Con `?test=<id>` solo devuelve (y quita) los de esa prueba.
    if (pathname === '/__unmatched') {
      const test = searchParams.get('test');
      const taken = test === null ? unmatched : unmatched.filter((entry) => entry.test === test);
      unmatched = test === null ? [] : unmatched.filter((entry) => entry.test !== test);
      return json(200, taken.map((entry) => entry.line));
    }

    // SSE de notificaciones: 204 hace que el EventSource se cierre y no reintente.
    if (pathname === '/notifications/stream') return { status: 204, headers: baseHeaders() };

    // Juego de la mascota: página de relleno (el build de Unity no entra en las pruebas).
    if (pathname === '/pet-game-stub' || pathname.startsWith('/pet-game-stub/')) {
      const html = readFixture('pet-game.html');
      if (html === undefined) return json(404, { message: 'Sin fixture del juego' });
      return { status: 200, headers: baseHeaders({ 'Content-Type': 'text/html; charset=utf-8' }), body: html };
    }

    // Sin sockets en las pruebas, y los pedidos del navegador que no son de la app no cuentan como hueco.
    if (pathname === '/ws' || pathname.startsWith('/ws/') || pathname === '/favicon.ico') {
      return json(404, { message: 'No disponible en las pruebas' });
    }

    const hit = findRoute(routes, verb, pathname, searchParams);
    if (hit) {
      if (Object.values(hit.params).includes(ERROR_ID)) {
        return json(500, { message: 'Error simulado de la API' });
      }
      const text = readFixture(hit.route.fixture);
      if (text !== undefined) {
        return { status: 200, headers: baseHeaders({ 'Content-Type': 'application/json; charset=utf-8' }), body: text };
      }
    }

    unmatched.push({ line: `${verb} ${pathname}`, test: headers['x-e2e-test'] ?? '' });
    return json(404, { message: `Sin fixture para ${verb} ${pathname}` });
  }

  return { handle };
}
