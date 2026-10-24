// Las 30 páginas del alcance de la spec 012, con la URL que se abre en las pruebas de navegador.
// Los ids salen de los fixtures de `e2e/fixtures/api` (rifa 1, producto 1, comercial, compra 1...).
// El id reservado 999 hace que la API simulada responda 500 (estado de error).

export interface ScopePage {
  /** Ruta del alcance, tal como está en el plan (sirve para filtrar con `-g`). */
  route: string;
  /** URL que se abre. */
  url: string;
  /** Si la página se abre con sesión de consumidor; las públicas van sin cookie. */
  session: boolean;
  /**
   * Pedidos a la API simulada (patrones glob sobre su origen) que se responden con 500 para ver el
   * estado de error a 360 px. Vacío: la página no tiene un estado de error propio que mostrar.
   */
  errorApi: string[];
  /** Para páginas que piden sus datos desde el servidor de Next: la URL con el id reservado 999 (500). */
  errorUrl?: string;
}

/** Id del comercial de los fixtures (`publicId`). */
export const COMMERCIAL_ID = '00000000-0000-4000-8000-0000000000c1';

export const PAGES: ScopePage[] = [
  { route: '/', url: '/', session: false, errorApi: [] },
  { route: '/login', url: '/login', session: false, errorApi: [] },
  { route: '/register', url: '/register', session: false, errorApi: [] },
  { route: '/verify', url: '/verify?email=consumidor%40example.test', session: false, errorApi: [] },
  { route: '/ads', url: '/ads', session: true, errorApi: ['**/adLike/next'] },
  { route: '/checkout', url: '/checkout', session: true, errorApi: [] },
  { route: '/commercial/[id]', url: `/commercial/${COMMERCIAL_ID}`, session: true, errorApi: ['**/commercials/*/profile'] },
  { route: '/forum', url: '/forum', session: true, errorApi: ['**/impact-stories/consumer*'] },
  { route: '/home', url: '/home', session: true, errorApi: [] },
  { route: '/pet', url: '/pet', session: true, errorApi: ['**/pet/session/init'] },
  { route: '/support', url: '/support', session: true, errorApi: ['**/pqrs/mine'] },
  { route: '/surveys', url: '/surveys', session: true, errorApi: ['**/surveys*'] },
  { route: '/explore/favorites', url: '/explore/favorites', session: true, errorApi: ['**/products/favorites*'] },
  { route: '/explore/gamification', url: '/explore/gamification', session: true, errorApi: ['**/api/levels/config'] },
  { route: '/explore/participations', url: '/explore/participations', session: true, errorApi: ['**/api/raffles/me*'] },
  { route: '/explore/profile', url: '/explore/profile', session: true, errorApi: ['**/consumers/profile'] },
  { route: '/explore/profile/edit', url: '/explore/profile/edit', session: true, errorApi: ['**/consumers/profile'] },
  { route: '/explore/purchases', url: '/explore/purchases', session: true, errorApi: ['**/purchases*'] },
  { route: '/explore/referrals', url: '/explore/referrals', session: true, errorApi: ['**/referrals/my-code'] },
  { route: '/explore/transactions', url: '/explore/transactions', session: true, errorApi: ['**/key-transactions*'] },
  { route: '/games', url: '/games', session: true, errorApi: ['**/games*'] },
  {
    route: '/games/play',
    url: `/games/play?url=${encodeURIComponent('http://127.0.0.1:4010/pet-game-stub?session_token=token-de-juego-ficticio&user_hash=hash-ficticio')}`,
    session: true,
    errorApi: [],
  },
  { route: '/plans/mobile-plans', url: '/plans/mobile-plans', session: true, errorApi: [] },
  { route: '/products', url: '/products', session: true, errorApi: ['**/products/filter*'] },
  { route: '/products/[id]', url: '/products/1', session: true, errorApi: [], errorUrl: '/products/999' },
  { route: '/purchases/[id]/confirmation', url: '/purchases/1/confirmation', session: true, errorApi: [] },
  { route: '/raffles', url: '/raffles', session: true, errorApi: ['**/api/raffles/actives*'] },
  { route: '/raffles/[id]', url: '/raffles/1', session: true, errorApi: ['**/api/raffles/1'] },
  { route: '/raffles/[id]/live', url: '/raffles/1/live', session: true, errorApi: [] },
  { route: '/raffles/[id]/results', url: '/raffles/1/results', session: true, errorApi: ['**/results/raffle/*'] },
];
