import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import middleware, { config } from '@/middleware';
import { listPages } from './routeInventory';
import { PUBLIC, ROLE_RULES, UNPROTECTED_PENDING, classify, type Role } from './routeAccess';
import { sessionCookie, TEST_SECRET } from './session';

const ORIGIN = 'http://localhost:3000';

// El middleware escribe ruta y rol por petición; se silencia para no ensuciar la salida.
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubEnv('NEXTAUTH_SECRET', TEST_SECRET);
  vi.stubEnv('NEXTAUTH_URL', ORIGIN); // cookie sin prefijo __Secure-
  vi.stubEnv('MIDDLEWARE', 'ACTIVE');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------------------------
// Primera parte: inventario y clasificación
// ---------------------------------------------------------------------------------------------

const pages = listPages();

describe('inventario de páginas', () => {
  it('encuentra páginas (el recorrido no está vacío)', () => {
    expect(pages.length).toBeGreaterThan(50);
  });

  it.each(pages.map((p) => [p.route, p] as const))(
    '%s pertenece a exactamente una clase',
    (_route, page) => {
      const classes = classify(page.route);
      expect(
        classes.length,
        `La página ${page.file} (${page.route}) tiene ${classes.length} clases. ` +
          'Clasifícala en __tests__/middleware/routeAccess.ts: ROLE_RULES (y el matcher de ' +
          'src/middleware.ts), PUBLIC o UNPROTECTED_PENDING.',
      ).toBe(1);
    },
  );

  it('ninguna entrada de la tabla apunta a una página que no existe', () => {
    const routes = new Set(pages.map((p) => p.route));
    for (const r of PUBLIC) expect(routes.has(r), `PUBLIC: no existe ${r}`).toBe(true);
    for (const r of UNPROTECTED_PENDING) {
      expect(routes.has(r), `UNPROTECTED_PENDING: no existe ${r}`).toBe(true);
    }
    for (const rule of ROLE_RULES) {
      const hits = pages.filter((p) => classify(p.route).some((c) => c.kind === 'role' && c.rule === rule));
      expect(hits.length, `ROLE_RULES: ${rule.path} no cubre ninguna página`).toBeGreaterThan(0);
      for (const e of rule.except ?? []) expect(routes.has(e), `except: no existe ${e}`).toBe(true);
    }
  });

  it('las rutas de consumidor listadas en el matcher sin página (/consumer/...) siguen sin página', () => {
    // H-10: esas entradas del matcher no corresponden a ninguna página. Si algún día existen, hay que clasificarlas.
    expect(pages.filter((p) => p.route.startsWith('/consumer'))).toEqual([]);
  });

  it('/commercial/[id] de (consumer) se clasifica como ROLE_COMMERCIAL (comportamiento de hoy, D-7)', () => {
    const page = pages.find((p) => p.group === 'consumer' && p.route === '/commercial/[id]');
    expect(page, 'ya no existe src/app/(consumer)/commercial/[id]').toBeDefined();
    const [cls] = classify(page!.route);
    expect(cls).toMatchObject({ kind: 'role', role: 'ROLE_COMMERCIAL' });
  });
});

// ---------------------------------------------------------------------------------------------
// Segunda parte: matriz por rol contra el middleware real
// ---------------------------------------------------------------------------------------------

type Identity = { name: string; role: Role | null };
const IDENTITIES: Identity[] = [
  { name: 'sin sesión', role: null },
  { name: 'consumidor', role: 'ROLE_CONSUMER' },
  { name: 'comercial', role: 'ROLE_COMMERCIAL' },
  { name: 'admin', role: 'ROLE_ADMIN' },
  { name: 'oficial de cumplimiento', role: 'ROLE_COMPLIANCE_OFFICER' },
  { name: 'diseñador', role: 'ROLE_GAME_DESIGNER' },
];

type Outcome = { kind: 'pass' } | { kind: 'redirect'; location: string };

async function run(path: string, role: string | null): Promise<Outcome> {
  const headers: Record<string, string> = {};
  if (role) headers.cookie = await sessionCookie(role);
  const req = new NextRequest(ORIGIN + path, { headers });
  const res = await (middleware as unknown as (r: NextRequest, e: unknown) => Promise<Response>)(req, {});
  if (res.headers.get('x-middleware-next') === '1') return { kind: 'pass' };
  expect(res.status, `${path} no pasó ni redirigió`).toBeGreaterThanOrEqual(300);
  expect(res.status).toBeLessThan(400);
  return { kind: 'redirect', location: res.headers.get('location') ?? '' };
}

const matches = (path: string) => unstable_doesMiddlewareMatch({ config, url: ORIGIN + path });

/**
 * Resultado real de una petición: Next solo ejecuta el middleware si el `matcher` alcanza la URL;
 * si no, la petición pasa sin que el middleware la vea.
 */
async function effective(path: string, role: string | null): Promise<Outcome> {
  return matches(path) ? run(path, role) : { kind: 'pass' };
}

const protectedPages = pages.flatMap((p) => {
  const [cls] = classify(p.route);
  return cls?.kind === 'role' ? [{ page: p, role: cls.role }] : [];
});

describe('matriz de protección por rol (MIDDLEWARE=ACTIVE)', () => {
  it('hay páginas protegidas que probar', () => {
    expect(protectedPages.length).toBeGreaterThan(40);
  });

  describe.each(protectedPages.map((x) => [x.page.url, x] as const))('%s', (_url, { page, role }) => {
    it('el matcher la alcanza', () => {
      expect(matches(page.url)).toBe(true);
    });

    it.each(IDENTITIES)('$name', async ({ role: identityRole }) => {
      const out = await run(page.url, identityRole);
      if (identityRole === null) {
        // H-13: sin sesión, withAuth redirige antes de ejecutar el cuerpo del middleware.
        expect(out).toMatchObject({ kind: 'redirect' });
        expect((out as { location: string }).location).toContain('/api/auth/signin');
      } else if (identityRole === role) {
        expect(out).toEqual({ kind: 'pass' });
      } else {
        expect(out.kind).toBe('redirect');
        expect(new URL((out as { location: string }).location).pathname).toBe('/unauthorized');
      }
    });
  });
});

describe('páginas públicas', () => {
  it.each(PUBLIC)('%s deja pasar sin sesión', async (route) => {
    const page = pages.find((p) => p.route === route)!;
    expect(await effective(page.url, null)).toEqual({ kind: 'pass' });
  });

  it.each(['/game-designer/reset-password', '/game-designer/setup-password'])(
    '%s (diseñador, enlace de correo): el matcher la alcanza y pasa sin sesión',
    async (path) => {
      expect(matches(path)).toBe(true);
      expect(await run(path, null)).toEqual({ kind: 'pass' });
    },
  );

  it('/commercial-onboarding no se trata como /commercial', async () => {
    expect(matches('/commercial-onboarding')).toBe(false);
    expect(await effective('/commercial-onboarding', null)).toEqual({ kind: 'pass' });
    // Un consumidor con sesión tampoco es redirigido.
    expect(await effective('/commercial-onboarding', 'ROLE_CONSUMER')).toEqual({ kind: 'pass' });
  });
});

describe('sin protección de middleware hoy, decisión pendiente (D-7)', () => {
  it.each(UNPROTECTED_PENDING)('%s: el matcher no la alcanza y pasa sin sesión', async (route) => {
    const page = pages.find((p) => p.route === route)!;
    expect(matches(page.url)).toBe(false);
    expect(await effective(page.url, null)).toEqual({ kind: 'pass' });
  });
});

describe('regresiones ya ocurridas', () => {
  it('subruta parecida a las públicas del diseñador sí exige sesión', async () => {
    for (const path of [
      '/game-designer/reset-password/otra',
      '/game-designer/reset-password-x',
      '/game-designer/setup-password/otra',
    ]) {
      const out = await run(path, null);
      expect(out.kind, path).toBe('redirect');
    }
  });

  it('subruta parecida a las públicas del diseñador con rol equivocado va a /unauthorized', async () => {
    const out = await run('/game-designer/reset-password/otra', 'ROLE_CONSUMER');
    expect(out.kind).toBe('redirect');
    expect(new URL((out as { location: string }).location).pathname).toBe('/unauthorized');
  });

  it('barra final: las públicas del diseñador pasan sin sesión', async () => {
    expect(await run('/game-designer/reset-password/', null)).toEqual({ kind: 'pass' });
    expect(await run('/game-designer/setup-password/', null)).toEqual({ kind: 'pass' });
  });

  it('barra final: una ruta protegida sigue exigiendo el rol', async () => {
    expect((await run('/admin/', null)).kind).toBe('redirect');
    expect(await run('/admin/', 'ROLE_ADMIN')).toEqual({ kind: 'pass' });
    const wrong = await run('/admin/', 'ROLE_CONSUMER');
    expect(new URL((wrong as { location: string }).location).pathname).toBe('/unauthorized');
  });

  it('el rol del consumidor se acepta con o sin prefijo ROLE_ (comportamiento de hoy)', async () => {
    expect(await run('/raffles', 'CONSUMER')).toEqual({ kind: 'pass' });
  });
});

describe('modo apagado (sin MIDDLEWARE=ACTIVE)', () => {
  it('deja pasar todo, incluso sin sesión', async () => {
    vi.stubEnv('MIDDLEWARE', '');
    for (const { page } of protectedPages) {
      expect(await run(page.url, null), page.url).toEqual({ kind: 'pass' });
    }
  });
});
