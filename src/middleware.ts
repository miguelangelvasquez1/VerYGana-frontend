// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


/**
 * Paths to be matched by the middleware.
 */
export const config = {
  matcher: [
    // consumer explicit routes (literal array)
    '/consumer/home/:path*',
    '/consumer/orders/:path*',
    '/consumer/profile',
    '/consumer/wallet/:path*',
    '/raffles',
    "/ads",
    // "/forum",

    // role prefixes (literal entries)
    '/advertiser/:path*',
    '/advertiser',
    '/seller/:path*',
    '/seller',
    '/admin/:path*',
    '/admin',
  ],
};

/**
 * Rutas permitidas explícitamente para CONSUMER.
 * (Aquí definimos las rutas en una constante para mantener legibilidad,
 *  pero **el export config debe usar un array literal**).
 */
const CONSUMER_ALLOWED = [
  '/consumer/home/:path*',
  '/consumer/orders/:path*',
  '/consumer/profile',       
  '/consumer/wallet/:path*',
  '/raffles',
  '/ads',
] as const;

/**
 * Roles que usan prefijo (las rutas que empiezan con su nombre).
 */
const ROLE_PREFIXES = ['advertiser', 'seller', 'admin'] as const;

/** Helpers para comprobar patrones simples como '/consumer/orders/:path*' */
function patternBase(pattern: string): string {
  return pattern.endsWith('/:path*') ? pattern.replace('/:path*', '') : pattern;
}

function matchesPattern(pattern: string, pathname: string): boolean {
  const base = patternBase(pattern);
  if (pattern.endsWith('/:path*')) {
    return pathname === base || pathname.startsWith(base + '/');
  } else {
    // exact match
    return pathname === base;
  }
}

/** Middleware principal */
export default withAuth(function middleware(req: NextRequest) {
  console.log('[middleware] invoked for', req.nextUrl.pathname);

  const dev_mode = process.env.MIDDLEWARE !== 'ACTIVE';
  if (dev_mode) return NextResponse.next();

  // normalizar pathname (quitar slash final)
  const rawPath = req.nextUrl.pathname;
  const pathname = rawPath.replace(/\/$/, '') || '/';

  // token puede estar en diferentes formas; soportar token.role o token.user.role
  const token = (req as any).nextauth?.token as { role?: string } | undefined;
  const rawRole = token?.role ?? (token as any)?.user?.role;
  const normalizedRole = rawRole ? String(rawRole).replace(/^ROLE_/, '').toUpperCase() : undefined;

  // log para depuración (aparecerá en la consola del servidor / terminal)
  console.log('[middleware] path=', pathname, 'rawRole=', rawRole);

  // 1) Rutas explícitas para CONSUMER
  const isConsumerRoute = CONSUMER_ALLOWED.some((p) => matchesPattern(p, pathname));
  if (isConsumerRoute) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // comparar con normalizedRole
    if (normalizedRole !== 'CONSUMER') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    return NextResponse.next();
  }

  // 2) Rutas por prefijo para otros roles
  for (const rolePrefix of ROLE_PREFIXES) {
    if (pathname === `/${rolePrefix}` || pathname.startsWith(`/${rolePrefix}/`)) {
      if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (token.role !== 'ROLE_' + rolePrefix.toUpperCase()) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      return NextResponse.next();
    }
  }

  // 3) Rutas no manejadas por este middleware -> permitir
  return NextResponse.next();
},
{
  callbacks: {
      // Desactiva la validación automática en dev mode
      authorized: ({ token }) => {
        const dev_mode = process.env.MIDDLEWARE !== 'ACTIVE';
        if (dev_mode) return true; // ✅ Siempre permite en dev
        return !!token; // 🔒 Valida token en producción
      },
    },
});