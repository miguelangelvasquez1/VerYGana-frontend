/**
 * Tabla de acceso por ruta: describe lo que el middleware hace HOY, no lo que debería hacer.
 * Toda página nueva de `src/app` debe quedar en exactamente una clase (lo exige routeProtection.test.ts).
 * Una ruta protegida nueva entra aquí, en el `matcher` de `src/middleware.ts` y en su cuerpo (P-4).
 */

export type Role =
  | 'ROLE_CONSUMER'
  | 'ROLE_COMMERCIAL'
  | 'ROLE_ADMIN'
  | 'ROLE_COMPLIANCE_OFFICER'
  | 'ROLE_GAME_DESIGNER';

/** Regla de rol: la página exige `role`. `prefix` cubre la ruta y todo lo que cuelga de ella. */
export type RoleRule = {
  path: string;
  match: 'prefix' | 'exact';
  role: Role;
  /** Plantillas de ruta que la regla de prefijo deja pasar sin sesión (están en PUBLIC). */
  except?: readonly string[];
};

export const ROLE_RULES: readonly RoleRule[] = [
  {
    path: '/admin',
    match: 'prefix',
    role: 'ROLE_ADMIN',
  },
  {
    // Ojo (D-7): el prefijo atrapa también `src/app/(consumer)/commercial/[id]`, el perfil de un
    // comercial que ve el CONSUMIDOR. Hoy, con el middleware activo, un consumidor sería
    // redirigido a /unauthorized. Es el comportamiento actual y no se corrige aquí.
    path: '/commercial',
    match: 'prefix',
    role: 'ROLE_COMMERCIAL',
  },
  {
    path: '/compliance',
    match: 'prefix',
    role: 'ROLE_COMPLIANCE_OFFICER',
  },
  {
    path: '/game-designer',
    match: 'prefix',
    role: 'ROLE_GAME_DESIGNER',
    except: ['/game-designer/reset-password', '/game-designer/setup-password'],
  },
  // Consumidor: el middleware solo protege estas dos, y por ruta exacta.
  { path: '/raffles', match: 'exact', role: 'ROLE_CONSUMER' },
  { path: '/ads', match: 'exact', role: 'ROLE_CONSUMER' },
];

/** Públicas de forma explícita (autenticación, aterrizaje, enlaces de correo). */
export const PUBLIC: readonly string[] = [
  '/',
  '/login',
  '/register',
  '/verify',
  '/forgot-password',
  '/unlock-account',
  '/terminos',
  // `/commercial-onboarding` NO es `/commercial`: el prefijo se compara por segmento completo.
  '/commercial-onboarding',
  // Enlaces de correo del diseñador: públicos por excepción en el middleware (defecto D-1 de la revisión 006).
  '/game-designer/reset-password',
  '/game-designer/setup-password',
];

/**
 * Sin protección de middleware hoy, decisión pendiente (D-7).
 * Páginas que por su nombre parecen necesitar sesión (cuenta, compras, rifas, planes) pero que el
 * `matcher` no alcanza: el middleware las deja pasar a cualquiera. Se listan tal cual para que el
 * cambio, cuando se decida, sea una edición visible de esta tabla y no un hallazgo accidental.
 */
export const UNPROTECTED_PENDING: readonly string[] = [
  '/checkout',
  '/explore/favorites',
  '/explore/gamification',
  '/explore/participations',
  '/explore/profile',
  '/explore/profile/edit',
  '/explore/purchases',
  '/explore/referrals',
  '/explore/transactions',
  '/forum',
  '/games',
  '/games/play',
  '/home',
  '/pet',
  '/plans',
  '/plans/checkout',
  '/plans/mobile-plans',
  '/products',
  '/products/[id]',
  '/purchases/[id]/confirmation',
  '/raffles/[id]',
  '/raffles/[id]/live',
  '/raffles/[id]/results',
  '/support',
  '/surveys',
];

export type RouteClass =
  | { kind: 'role'; role: Role; rule: RoleRule }
  | { kind: 'public' }
  | { kind: 'pending' };

function underPrefix(route: string, prefix: string): boolean {
  return route === prefix || route.startsWith(prefix + '/');
}

/** Todas las clases a las que pertenece una plantilla de ruta. Debe ser exactamente una. */
export function classify(route: string): RouteClass[] {
  const out: RouteClass[] = [];
  for (const rule of ROLE_RULES) {
    const hit = rule.match === 'prefix' ? underPrefix(route, rule.path) : route === rule.path;
    if (hit && !rule.except?.includes(route)) out.push({ kind: 'role', role: rule.role, rule });
  }
  if (PUBLIC.includes(route)) out.push({ kind: 'public' });
  if (UNPROTECTED_PENDING.includes(route)) out.push({ kind: 'pending' });
  return out;
}
