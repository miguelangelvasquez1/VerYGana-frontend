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
  { method: 'POST', path: '/purchases/quote', fixture: 'api/purchases/quote.json' },
  { method: 'GET', path: '/purchases/:id', fixture: 'api/purchases/detail.json' },

  // Juegos, encuestas, foro, soporte y anuncios
  { method: 'GET', path: '/games', fixture: 'api/games/list.json' },
  { method: 'GET', path: '/surveys', fixture: 'api/surveys/available.json' },
  { method: 'GET', path: '/surveys/:id', fixture: 'api/surveys/detail.json' },
  { method: 'GET', path: '/impact-stories/consumer', fixture: 'api/impact-stories/consumer.json' },
  { method: 'GET', path: '/pqrs/mine', fixture: 'api/pqrs/mine.json' },
  { method: 'GET', path: '/pqrs/:id', fixture: 'api/pqrs/detail.json' },
  { method: 'GET', path: '/adLike/next', fixture: 'api/ads/next.json' },
  { method: 'POST', path: '/adLike/like', fixture: 'api/ads/like.json' },

  // Promociones con llaves (informativo; sin ninguna activa)
  { method: 'GET', path: '/key-promotions/active', fixture: 'api/key-promotions/active.json' },

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

  // Comercial (spec 014): onboarding, planes, billetera, panel de inicio
  { method: 'GET', path: '/commercials/onboarding/status', fixture: 'api/onboarding/status-TERMS_PENDING.json' },
  { method: 'GET', path: '/commercials/onboarding/diagnostic/questionnaire', fixture: 'api/onboarding/questionnaire.json' },
  { method: 'GET', path: '/commercials/onboarding/classification', fixture: 'api/onboarding/classification.json' },
  { method: 'GET', path: '/commercials/onboarding/plan', fixture: 'api/onboarding/plan.json' },
  { method: 'GET', path: '/commercials/onboarding/documents', fixture: 'api/onboarding/documents.json' },
  { method: 'GET', path: '/commercials/onboarding/summary', fixture: 'api/onboarding/summary.json' },
  { method: 'GET', path: '/commercials/onboarding/contract', fixture: 'api/onboarding/contract.json' },
  { method: 'GET', path: '/legal-documents', fixture: 'api/admin/legal-documents.json' },
  { method: 'GET', path: '/admin/legal-documents/:type/history', fixture: 'api/admin/legal-documents.json' },
  { method: 'GET', path: '/legal-documents/:type', fixture: 'api/onboarding/legal-document.json' },
  { method: 'GET', path: '/plans/status/:reference', fixture: 'api/plans/status-approved.json' },
  { method: 'GET', path: '/plans/catalog', fixture: 'api/plans/catalog.json' },
  { method: 'GET', path: '/plans/recharge/current', fixture: 'api/plans/recharge-current.json' },
  { method: 'GET', path: '/plans/change-request/current', fixture: 'api/plans/change-request-current.json' },
  { method: 'GET', path: '/plans/change-request/preview', fixture: 'api/plans/change-request-preview.json' },
  { method: 'GET', path: '/commercial/dashboard/summary', fixture: 'api/commercial/dashboard-summary.json' },
  { method: 'GET', path: '/commercial/wallet/me/billing-summary', fixture: 'api/commercial/billing-summary.json' },
  { method: 'GET', path: '/commercial/wallet/me/deposits', fixture: 'api/commercial/deposits.json' },
  { method: 'GET', path: '/commercial/wallet/me/payouts', fixture: 'api/commercial/payouts.json' },
  { method: 'GET', path: '/commercial/payout-methods', fixture: 'api/commercial/payout-methods.json' },
  { method: 'GET', path: '/commercial/payout-methods/banks', fixture: 'api/commercial/payout-banks.json' },
  { method: 'GET', path: '/commercial/prosperity/movements', fixture: 'api/commercial/prosperity-movements.json' },
  { method: 'GET', path: '/commercial/key-promotions/offers', fixture: 'api/commercial/key-promotion-offers.json' },
  { method: 'GET', path: '/commercial/allies', fixture: 'api/commercial/allies.json' },
  { method: 'GET', path: '/commercial/allies/promoters', fixture: 'api/commercial/allies.json' },
  { method: 'GET', path: '/commercial/allies/promotions', fixture: 'api/commercial/allies-promotions.json' },
  { method: 'GET', path: '/commercial/pet/requests', fixture: 'api/commercial/pet-requests.json' },
  { method: 'GET', path: '/commercial/pet/requests/metrics', fixture: 'api/commercial/pet-metrics.json' },
  { method: 'GET', path: '/commercial/pet/requests/metrics/daily', fixture: 'api/commercial/pet-metrics-daily.json' },
  { method: 'GET', path: '/commercials/profile', fixture: 'api/commercial/profile-settings.json' },

  // Comercial: anuncios, encuestas, productos y branding
  { method: 'GET', path: '/ads/my-ads/filter', fixture: 'api/ads/my-ads.json' },
  { method: 'GET', path: '/ads/:id/details', fixture: 'api/ads/detail.json' },
  { method: 'GET', path: '/adLike/:id/likes', fixture: 'api/ads/likes.json' },
  { method: 'GET', path: '/surveys/commercial', fixture: 'api/surveys/commercial-list.json' },
  { method: 'GET', path: '/surveys/commercial/:id', fixture: 'api/surveys/commercial-detail.json' },
  { method: 'GET', path: '/surveys/cost-per-question', fixture: 'api/surveys/cost-per-question.json' },
  { method: 'GET', path: '/surveys/:id/analytics', fixture: 'api/surveys/analytics.json' },
  { method: 'GET', path: '/surveys/:id/responses', fixture: 'api/surveys/responses.json' },
  { method: 'GET', path: '/products/my-products', fixture: 'api/products/commercial.json' },
  { method: 'GET', path: '/products/total-products', fixture: 'api/products/total-products.json' },
  { method: 'GET', path: '/products/edit/:id', fixture: 'api/products/edit-info.json' },
  { method: 'GET', path: '/products/:id/stock', fixture: 'api/products/stock.json' },
  { method: 'GET', path: '/productsReviews/commercial/avg', fixture: 'api/products/reviews-avg.json' },
  { method: 'GET', path: '/campaigns', fixture: 'api/campaigns/list.json' },
  { method: 'GET', path: '/campaigns/:id', fixture: 'api/campaigns/detail.json' },
  { method: 'GET', path: '/branding-requests', fixture: 'api/branding-requests/list.json' },
  { method: 'GET', path: '/branding-requests/games', fixture: 'api/branding-requests/games.json' },
  { method: 'GET', path: '/branding-requests/campaign-goals', fixture: 'api/branding-requests/campaign-goals.json' },
  { method: 'GET', path: '/branding-requests/games/:id/brief-schema', fixture: 'api/branding-requests/brief-schema.json' },
  { method: 'GET', path: '/branding-requests/:id', fixture: 'api/branding-requests/detail.json' },
  { method: 'GET', path: '/branding-requests/:id/comments', fixture: 'api/branding-requests/comments.json' },

  // Admin (spec 014)
  { method: 'GET', path: '/admin/users/stats', fixture: 'api/admin/users-stats.json' },
  { method: 'GET', path: '/admin/users/consumers', fixture: 'api/admin/users-consumers.json' },
  { method: 'GET', path: '/admin/users/consumers/:id', fixture: 'api/admin/user-consumer-detail.json' },
  { method: 'GET', path: '/admin/users/commercials', fixture: 'api/admin/users-commercials.json' },
  { method: 'GET', path: '/admin/pqrs', fixture: 'api/admin/pqrs-list.json' },
  { method: 'GET', path: '/admin/cash-refunds', fixture: 'api/admin/cash-refunds.json' },
  { method: 'GET', path: '/admin/payout-methods', fixture: 'api/admin/payout-methods.json' },
  { method: 'GET', path: '/ads/admin/all', fixture: 'api/ads/admin-all.json' },
  { method: 'GET', path: '/api/admin/branding-requests', fixture: 'api/admin/branding-requests-list.json' },
  { method: 'GET', path: '/api/admin/branding-requests/designers', fixture: 'api/admin/branding-designers.json' },
  { method: 'GET', path: '/api/admin/pet-requests', fixture: 'api/admin/pet-requests-list.json' },
  { method: 'GET', path: '/api/admin/pet-requests/designers', fixture: 'api/admin/pet-designers.json' },
  { method: 'GET', path: '/admin/products', fixture: 'api/admin/products-list.json' },
  { method: 'GET', path: '/admin/products/productCategories/inactives', fixture: 'api/admin/product-categories-inactive.json' },
  { method: 'GET', path: '/api/raffles', fixture: 'api/raffles/actives.json' },
  { method: 'GET', path: '/api/admin/raffles/count', fixture: 'api/admin/raffles-count.json' },
  { method: 'GET', path: '/api/admin/ticket-rules', fixture: 'api/admin/ticket-rules.json' },
  { method: 'GET', path: '/api/admin/ticket-rules/count/active', fixture: 'api/admin/ticket-rules-count.json' },
  { method: 'GET', path: '/surveys/admin', fixture: 'api/surveys/admin-list.json' },
  { method: 'GET', path: '/surveys/admin/:id', fixture: 'api/surveys/admin-detail.json' },
  { method: 'GET', path: '/impact-stories', fixture: 'api/impact-stories/consumer.json' },
  { method: 'GET', path: '/admin/treasury/balance', fixture: 'api/admin/treasury-balance.json' },
  { method: 'GET', path: '/admin/treasury/config/keys-reserve-pct', fixture: 'api/admin/treasury-keys-reserve-pct.json' },
  { method: 'GET', path: '/admin/treasury/movements/:code', fixture: 'api/admin/treasury-movements.json' },
  { method: 'GET', path: '/admin/key-promotions', fixture: 'api/admin/key-promotions-list.json' },
  { method: 'GET', path: '/admin/key-promotions/:id', fixture: 'api/admin/key-promotion-detail.json' },
  { method: 'GET', path: '/admin/recognitions', fixture: 'api/admin/recognitions-list.json' },
  { method: 'GET', path: '/admin/recognitions/fund', fixture: 'api/admin/recognitions-fund.json' },
  { method: 'GET', path: '/admin/recognitions/candidates', fixture: 'api/admin/recognitions-candidates.json' },
  { method: 'GET', path: '/admin/recognitions/:id', fixture: 'api/admin/recognition-detail.json' },
  { method: 'GET', path: '/admin/security-events', fixture: 'api/admin/security-events.json' },
  { method: 'GET', path: '/system-features', fixture: 'api/admin/system-features.json' },
  { method: 'GET', path: '/admin/pricing-configs', fixture: 'api/admin/pricing-configs.json' },

  // Cumplimiento (spec 014)
  { method: 'GET', path: '/compliance/kyc/pending', fixture: 'api/compliance/kyc-pending.json' },
  { method: 'GET', path: '/compliance/screenings/hits', fixture: 'api/compliance/screenings-hits.json' },
  { method: 'GET', path: '/compliance/contracts', fixture: 'api/compliance/contracts-list.json' },
  { method: 'GET', path: '/compliance/contracts/:id', fixture: 'api/compliance/contract-detail.json' },
  { method: 'GET', path: '/compliance/contracts/:id/background-checks', fixture: 'api/compliance/background-checks.json' },
  { method: 'GET', path: '/compliance/screenings/user/:id', fixture: 'api/compliance/screenings-user.json' },
  { method: 'GET', path: '/compliance/contracts/negotiations', fixture: 'api/compliance/contracts-negotiations.json' },
  { method: 'GET', path: '/compliance/plan-changes', fixture: 'api/compliance/plan-changes.json' },
  { method: 'GET', path: '/compliance/audit-logs', fixture: 'api/compliance/audit-logs.json' },

  // Mascota
  { method: 'POST', path: '/pet/session/init', fixture: 'api/pet/session-init.json' },
];

/** Extensiones que sirve `/media/<archivo>` (medios ficticios de los anuncios, spec 013) y su tipo. */
const MEDIA_TYPES = { '.webm': 'video/webm', '.png': 'image/png' };

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
 * `readBinary` lee un medio de `e2e/fixtures/media` por su nombre (sin carpeta) y devuelve sus bytes.
 * @param {{ routes?: MockRoute[], readFixture: (name: string) => string | undefined, readBinary?: (name: string) => Uint8Array | undefined }} options
 */
export function createMockRouter({ routes = ROUTES, readFixture, readBinary = () => undefined }) {
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
   * @returns {{ status: number, headers: Record<string, string>, body?: string | Uint8Array }}
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

    // Medios de los anuncios (video e imagen ficticios) servidos desde loopback. Solo el nombre de un archivo
    // con extensión permitida; cualquier otra cosa (subcarpetas, `..`, otras extensiones) es 404 y queda registrada.
    if (verb === 'GET' && pathname.startsWith('/media/')) {
      const name = decodeURIComponent(pathname.slice('/media/'.length));
      const ext = /\.[a-z0-9]+$/i.exec(name)?.[0].toLowerCase() ?? '';
      const type = MEDIA_TYPES[/** @type {keyof typeof MEDIA_TYPES} */ (ext)];
      const bytes = type && !/[\\/]/.test(name) ? readBinary(name) : undefined;
      if (bytes !== undefined) return { status: 200, headers: baseHeaders({ 'Content-Type': type }), body: bytes };
      unmatched.push({ line: `${verb} ${pathname}`, test: headers['x-e2e-test'] ?? '' });
      return json(404, { message: `Sin medio para ${pathname}` });
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
