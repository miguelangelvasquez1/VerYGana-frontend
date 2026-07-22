# Migrar el JWT a un proxy server-side (BFF) — dejar de exponerlo a JS del cliente

## Contexto

Hoy `session.accessToken` (el JWT que autentica cada llamada al backend) viaja
expuesto a través de `useSession()`/`getSession()` a cualquier componente
cliente. Esto no es un bug — es una decisión arquitectónica que ya estaba
tomada — pero significa que cualquier XSS en la app puede leer el token
directamente. La alternativa "profesional" es que el token nunca salga del
servidor: vive solo en la cookie httpOnly que ya administra NextAuth, y todas
las llamadas al backend pasan por un route handler de Next.js que le agrega
el header `Authorization` del lado del servidor.

Investigué el código real (no es teórico) y encontré que el 90% de las
llamadas ya pasan por un solo punto (`apiClient` en `src/lib/api/client.ts`),
lo cual hace esto viable sin tocar los ~40 archivos de `services/*` uno por
uno. También encontré que el flujo de refresh de token
(`AuthProvider.tsx`) **nunca lee** `session.accessToken` para su propia
lógica — solo lo escribe vía `update()`/`signIn()` con un valor que ya tiene
de la respuesta de `authService.refresh()`. Esto es clave: significa que
ocultar el token del cliente **no rompe** el refresh multi-pestaña existente,
lo cual reduce mucho el riesgo de este cambio.

## Fase 1 — Proxy + migrar todo lo que arma requests con el token

**Objetivo:** ningún código de cliente vuelve a leer `session.accessToken`
para adjuntarlo a una request. Todavía no se lo saca de la sesión (eso es
Fase 2) — este paso es el que realmente mueve la mayoría de los archivos.

### 1.1 — Nuevo route handler proxy
`src/app/api/proxy/[...path]/route.ts` (sigue el estilo ya usado en
`src/app/api/proxy-download/route.ts`: `NextRequest`/`NextResponse`, manual,
sin wrapper). Exporta `GET/POST/PUT/PATCH/DELETE` sobre un único handler
compartido (mismo patrón que `api/auth/[...nextauth]/route.ts`), que:
- Lee el JWT con `getToken({ req })` de `next-auth/jwt` (repo usa next-auth
  v4 confirmado en `package.json` — es `getToken`/`getServerSession`, **no**
  `auth()` de v5). Esto decodifica la cookie directamente, independiente de
  lo que devuelva el callback `session()` — por eso Fase 2 no rompe esto.
- Reenvía método, query params, headers relevantes y body a
  `process.env.API_URL` + el `path` capturado, agregando
  `Authorization: Bearer <token>`.
- Devuelve la respuesta del backend tal cual — status, body, y
  **`Content-Type`/binario intacto** (crítico para no romper
  `exportResponses` en `surveyService.ts`, que baja CSV/XLSX con
  `responseType: 'blob'` — es el único caso blob que existe en el repo).
- `export const dynamic = 'force-dynamic'` (depende de cookies por request).

### 1.2 — Repuntar `apiClient`
En `src/lib/api/client.ts`:
- `baseURL` pasa a `/api/proxy` **solo para el browser** (`typeof window !== 'undefined'`).
- El interceptor de request que hoy arma el header `Authorization` se
  **elimina** para el camino cliente — el proxy lo hace. Esto también deja
  obsoleto todo `src/lib/auth/tokenStore.ts` y el `useEffect` que agregué en
  `AuthProvider.tsx` para sincronizarlo — se borran los dos.
- Para el camino servidor (las 2 páginas que ya llaman `apiClient` directo
  durante SSR: `src/app/(consumer)/products/[id]/page.tsx` y
  `src/app/commercial/products/[id]/page.tsx`), **no** las hago pasar por el
  proxy — un `fetch` server-to-server con URL relativa no funciona en Node.
  Mantengo ese camino pegándole directo al backend con `API_URL` +
  `getToken()`, que es una mejora sobre el `getSessionSafe()` actual (ya no
  depende de un fetch a `/api/auth/session`, lee la cookie directo).

### 1.3 — Migrar las excepciones que no pasan por `apiClient`
Encontré 4, cada una necesita su propio tratamiento:

- **`src/services/LevelService.ts`** — hace `fetch()` crudo con un `token`
  recibido por parámetro. Se reescribe para pegarle al proxy (sin parámetro
  de token). Simplifica 6 call sites que hoy hacen
  `getProfile(session?.accessToken as string)`: `useLevelProfile.ts`,
  `LevelCard.tsx`, `SurveyPlayerModal.tsx`, `VideoAdPlayer.tsx`,
  `referrals/page.tsx`, `purchases/[id]/confirmation/page.tsx`,
  `gamification/page.tsx` — todos pierden el boilerplate de leer/pasar el
  token.
- **Imagen privada** (`ProductsManagement.tsx` tiene su propia copia local de
  la lógica — el `privateImageSrc` exportado de `client.ts` está muerto, no
  lo importa nadie). Hoy arma `?token=<JWT>` en la URL porque un `<img src>`
  no puede llevar headers. Con el proxy esto se simplifica: el endpoint
  `/private-image` pasa a colgar del proxy (`/api/proxy/products/:id/private-image`),
  y como es same-origin el navegador manda la cookie solo — ya no hace falta
  ningún query param con el token.
- **Notificaciones SSE** (`useNotifications.ts` → `NotificationService.ts`)
  — abre un `EventSource` con `?token=` en la URL (SSE no soporta headers
  custom, así que hoy no hay otra forma). Necesita una ruta dedicada
  `src/app/api/proxy/notifications/stream/route.ts` (no el catch-all
  genérico) que lea el token server-side y haga streaming del `body` del
  backend de vuelta. **Esta es la pieza más delicada de la Fase 1** —
  streaming largo-vivo en un route handler tiene consideraciones de runtime
  (Node, no Edge) y de limpieza al desconectar el cliente. Si preferís, la
  puedo dejar para el final o como un paso separado que se prueba con más
  cuidado.
- **Beacon de `adService`** (`useAdUpload.ts` → `adService.ts`, fetch con
  `keepalive:true` al cerrar la pestaña) — pasa a apuntar al proxy también;
  al ser same-origin y `keepalive`, sigue funcionando igual, solo cambia la
  URL destino y deja de necesitar el token cacheado explícito.

**Sin cambios** (ya están bien, quedan fuera de este plan): el flujo de
upload de archivos ya bypassa el backend para el PUT real (URL prefirmada
directo a R2) — solo el paso de "pedir la URL prefirmada" pasa por
`apiClient`, así que se arregla solo al migrar `apiClient`.

## Fase 2 — Sacar `accessToken` de la sesión visible al cliente

Con la Fase 1 completa, nada del lado cliente necesita ya leer
`session.accessToken`. Esta fase es la que cumple el objetivo real
("el token nunca toca JS del navegador"):

- `src/lib/auth/authOptions.ts`: el callback `session()` deja de hacer
  `session.accessToken = token.accessToken`. El JWT interno sigue teniendo
  el campo (lo sigue leyendo `getToken()` en el proxy) — solo deja de
  copiarse al objeto de sesión que ve el cliente.
- `src/lib/auth/next-auth.d.ts`: se quita `accessToken` de la interfaz
  `Session` (queda solo en `JWT`).
- **Verificado que no rompe el refresh:** `AuthProvider.tsx` nunca lee
  `session.accessToken`, solo lo escribe (`update({accessToken})`,
  `signIn('credentials-sync', {accessToken})`) con valores que ya tiene de
  `authService.refresh()` o del broadcast entre pestañas — ninguno de esos
  depende de leerlo de vuelta desde `session`. El mecanismo de refresh
  multi-pestaña (BroadcastChannel) queda intacto, sin tocar.

**Bonus fuera de este plan, no incluido:** con todo same-origin, se podría
cerrar el CORS del backend para que solo acepte al origen de Next.js. Lo
menciono porque es una consecuencia natural, pero es un cambio del lado del
backend, no del frontend.

## Archivos tocados (resumen)

| Archivo | Cambio |
|---|---|
| `src/app/api/proxy/[...path]/route.ts` | **nuevo** — proxy genérico |
| `src/app/api/proxy/notifications/stream/route.ts` | **nuevo** — proxy SSE dedicado |
| `src/lib/api/client.ts` | `baseURL` condicional, se borra el interceptor de auth cliente |
| `src/lib/auth/tokenStore.ts` | **se borra** (queda obsoleto) |
| `src/app/providers/AuthProvider.tsx` | se borra el `useEffect` de sync al tokenStore |
| `src/services/LevelService.ts` | deja de recibir `token`, pega al proxy |
| 7 call sites de `LevelService` | dejan de pasar `session.accessToken` |
| `src/components/admin/products/ProductsManagement.tsx` | URL de imagen privada sin `?token=` |
| `src/hooks/useNotifications.ts` / `NotificationService.ts` | EventSource apunta al proxy SSE, sin `?token=` |
| `src/hooks/ads/useAdUpload.ts` / `adService.ts` | beacon apunta al proxy |
| `src/lib/auth/authOptions.ts` | `session()` deja de exponer `accessToken` (Fase 2) |
| `src/lib/auth/next-auth.d.ts` | tipo `Session` sin `accessToken` (Fase 2) |

## Verificación

- Login/logout normal, confirmar que las llamadas autenticadas (lista de
  encuestas, perfil, etc.) siguen funcionando con Network tab mostrando
  requests a `/api/proxy/*` en vez de al backend directo.
- Forzar expiración de token (o esperar) y confirmar que el refresh
  multi-pestaña sigue andando (abrir 2 pestañas, refrescar en una, ver que
  la otra se sincroniza vía BroadcastChannel).
- Completar una encuesta (dispara `LevelService` para el toast de XP) y
  confirmar que el toast aparece con los datos correctos.
- Exportar respuestas de una encuesta (CSV/XLSX) desde el panel comercial —
  es el único caso blob, confirmar que el archivo baja bien a través del proxy.
- Ver una imagen privada de producto en `ProductsManagement.tsx`.
- Abrir el panel de notificaciones y confirmar que las notificaciones en
  vivo (SSE) siguen llegando.
- Tras Fase 2: en devtools, `useSession()`/la cookie de sesión ya no debe
  contener `accessToken` en ningún campo legible desde la consola del
  navegador.
