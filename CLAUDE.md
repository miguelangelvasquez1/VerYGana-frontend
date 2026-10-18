# CLAUDE.md

Guía para quien trabaje en este repositorio, con o sin Claude Code. Todo lo que aparece aquí
se puede seguir con el repositorio recién clonado.

# verYganar · front

Front web de verYganar: Next.js 15.5 (App Router) + React 19 + TypeScript. Es la contraparte de
la API (Spring Boot, otro repositorio, por defecto en `http://localhost:8080`). Plataforma con
roles: consumidor, comercial, administrador, oficial de cumplimiento y diseñador de juegos.

## Principios

Innegociables. En la revisión de un PR toda violación se marca. Cada regla indica la
documentación oficial de la que sale y la versión instalada a la que aplica.

@docs/constitution.md

Varias reglas (P-2, P-10, P-11, P-15, P-16, P-18, P-20) llevan una excepción de deuda
conocida: el código de hoy no las cumple en esos sitios, y el documento dice cuáles. La
excepción describe lo que ya existe; **el código nuevo cumple la regla** aunque el código
vecino no lo haga.

## Requisitos

- Node 22 y npm 10 (los que usan el CI y la imagen). El repo no fija `engines`.
- Git y acceso a internet: `npm ci` baja los paquetes y `next dev` / `next build` descargan
  las fuentes de Google (`next/font/google`). El primer `build` de un clon tarda más (en el
  ensayo, unos 2 minutos; los siguientes, medio minuto).
- Opcional, para traer las variables de entorno del equipo: la CLI de Infisical con sesión
  iniciada (`infisical login`) y el proyecto del front enlazado (`infisical init`, que crea
  `.infisical.json`; ese archivo está ignorado por git y no se sube).
- Opcional, para el flujo de specs con agentes: Claude Code (`claude`).

## Levantar el front

```bash
git clone <url del repositorio> && cd <carpeta del clon>
npm ci                      # instala exactamente lo que dice package-lock.json
```

Con Infisical (lo que usa el equipo): `npm run dev` ejecuta
`infisical run --command "next dev --turbopack"`, así que las variables salen de Infisical.

Sin Infisical: crea un archivo `.env.local` en la raíz (`.env*` está ignorado por git, nunca se
sube) con las variables de la tabla de abajo, o expórtalas en la terminal, y corre:

```bash
npx next dev --turbopack    # http://localhost:3000
npx next dev --turbopack -p 3001   # si el 3000 está ocupado
```

Si `npx next dev --turbopack` responde 500 con un error de `next/font/google` ("queries have
exactly one entry") en la primera petición, reinícialo o usa `npx next dev` (sin Turbopack). Se
vio una vez en un clon limpio y no se pudo reproducir. Para comprobar que levantó:
`curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login` debe dar `200`.

Para `NEXTAUTH_SECRET` en local usa una cadena aleatoria tuya (`openssl rand -base64 32`);
nunca la de otro ambiente. Para iniciar sesión hace falta la API levantada en
`NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8080`); sin ella el front arranca y las
pantallas públicas cargan, pero no hay datos.

Con `MIDDLEWARE` sin definir, el middleware deja pasar todas las rutas (modo desarrollo).
Para probar la protección por rol pon `MIDDLEWARE=ACTIVE`.

### Variables de entorno

Solo nombres, nunca valores. Las `NEXT_PUBLIC_*` se incrustan en el JavaScript del navegador al
compilar: son públicas y nunca llevan un secreto (P-3).

| Variable | Dónde se lee | Para qué |
|----------|--------------|----------|
| `NEXT_PUBLIC_API_URL` | navegador y servidor, en el build | URL base de la API (obligatoria para compilar) |
| `NEXT_PUBLIC_WS_URL` | navegador, en el build | WebSocket de la API (obligatoria para compilar) |
| `NEXT_PUBLIC_PET_GAME_URL` | navegador, en el build | URL del juego de la mascota (obligatoria para compilar) |
| `NEXT_PUBLIC_PET_GAME_ORIGIN` | servidor, en el build (`next.config.ts`) | origen del build de mascotas al que se reescriben `/pet-game` y `/pet-assets`; ausente, el bucket de dev; obligatoria en el `Dockerfile` (beta: `https://mascotas-beta.verygana.com`) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | navegador, en el build | clave pública de reCAPTCHA (obligatoria: sin ella `next build` falla en `/register`) |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_COPYRIGHT_YEAR` | navegador, en el build | datos de contacto del onboarding comercial (tienen valor por defecto en el código) |
| `API_URL` | servidor, en ejecución | URL de la API para código de servidor; `src/lib/auth/authOptions.ts` usa `NEXT_PUBLIC_API_URL` si falta, pero `src/app/(consumer)/raffles/[id]/live/page.tsx` lee solo `API_URL` |
| `NEXTAUTH_SECRET` | servidor, en ejecución | secreto de next-auth; el mismo para NextAuth y el middleware (P-12) |
| `NEXTAUTH_URL` | servidor, en ejecución | URL pública del front, para next-auth en despliegue |
| `MIDDLEWARE` | servidor, en ejecución | `ACTIVE` para exigir los roles; otro valor o ausente, el middleware no bloquea nada |
| `PROXY_DOWNLOAD_ALLOWED_HOSTS` | servidor, en ejecución | hosts permitidos para `/api/proxy-download`, separados por comas, en minúsculas y sin esquema ni puerto; ausente o vacía, la ruta rechaza todo |

Los hosts de imágenes remotas están en `images.remotePatterns` de `next.config.ts`: un CDN
nuevo se agrega ahí.

## Comandos

Para `build` y `lint:ci` basta con estas variables públicas ficticias (las mismas del CI):

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

| Comando | Qué hace |
|---------|----------|
| `npm ci` | instalación reproducible desde el lockfile |
| `npm test` | Vitest (`vitest run`, una pasada): todo `__tests__/**/*.test.ts` |
| `npx vitest run <archivo>` | una sola prueba |
| `npm run lint` | `next lint` tal cual, para ver los avisos |
| `npm run lint:ci` | la puerta de lint del CI (ver más abajo) |
| `npm run build` | `next build` (salida `standalone`) |
| `npx tsc --noEmit` | tipos; córrelo **después** de `build`, que genera los tipos de rutas en `.next/types` |
| `npm run audit:ci` | la puerta de auditoría del CI (ver más abajo) |
| `npm run dev` / `npm start` | desarrollo con Infisical / servir el build |

Ninguna prueba toca la red, la API ni Infisical, y ninguna usa secretos reales.

## Puertas de CI

`.github/workflows/ci.yml` tiene tres checks, cada uno con tiempo límite de 10 minutos y sin
secretos de GitHub. Para el merge a `main` los tres deben pasar:

1. **`Lint, tipos y build`**: `npm run lint:ci`, `npm run build`, `npx tsc --noEmit`.
2. **`Pruebas`**: `npm test`.
3. **`Auditoría de dependencias`**: `npm run audit:ci`.

No les cambies el nombre sin cambiar la protección de la rama `main`.

### Lint: el tope de avisos solo baja

`npm run lint:ci` (`scripts/lint-ratchet.mjs`) lee el tope de `.lint-max-warnings` (un número).
Códigos de salida: `0` pasa, `1` la puerta falla, `3` no se pudo ejecutar.
Falla con `1` si:

- hay un error de lint (los errores nunca se toleran);
- hay más avisos que el tope: tu cambio agregó avisos; corrígelos;
- hay **menos** avisos que el tope: el mensaje dice a qué número bajarlo. Edita
  `.lint-max-warnings` y deja solo ese número. Así una mejora no se pierde;
- el tope es mayor que el de la rama destino (`origin/main`): el tope nunca se sube.

Para comparar con la rama destino hace falta tener `origin/main` (`git fetch origin main`);
sin ella, en local, avisa y usa 360. En un PR del CI, si no puede traerla, sale con `3`.

En un **push a `main`** el CI compara con el commit anterior al push (`github.event.before`,
que el workflow trae con `git fetch` y pasa al script en `LINT_BASE_SHA`), porque `origin/main`
ya sería el commit nuevo. Si ese commit no se puede traer (push forzado, rama nueva) o no tiene
`.lint-max-warnings` todavía, el script avisa y usa el respaldo 360: es el único caso en que un
push no se compara con el tope anterior. En GitHub Actions (`GITHUB_ACTIONS` definida, aunque vacía, o `CI`) `LINT_BASE_CAP` y
`LINT_BASE_REF` se ignoran (con aviso); solo sirven para ensayos locales.

### Auditoría: excepciones escritas

`npm run audit:ci` (`scripts/audit-gate.mjs`) corre `npm audit --omit=dev --json` (solo
dependencias de producción) y bloquea los avisos de severidad alta o crítica. Códigos de salida:
`0` pasa, `1` hay vulnerabilidades sin excepción o una excepción inválida o vencida, `2` el
registro de npm no respondió (no es un hallazgo: reintenta), `3` error interno.

Un aviso sin corrección disponible solo se tolera con una excepción **por aviso** en
`security/audit-exceptions.json`, aprobada por una persona del equipo y escrita en el mismo PR:

```json
{
  "id": "GHSA-xxxx-xxxx-xxxx",
  "package": "nombre-del-paquete",
  "reason": "Por qué no se puede corregir y por qué el riesgo es aceptable aquí.",
  "approvedBy": "Nombre de quien aprueba",
  "approvedOn": "AAAA-MM-DD",
  "reviewBy": "AAAA-MM-DD"
}
```

- Los seis campos son obligatorios y las fechas van en formato `AAAA-MM-DD`. El `id` y el
  paquete salen de `npm audit --omit=dev --json`.
- La excepción casa por `id` y paquete: un aviso alto **nuevo** en el mismo paquete vuelve a
  fallar.
- Pasada la fecha `reviewBy` la excepción vence y el CI falla en todos los PR hasta que se
  revise (renovar con motivo, o corregir la dependencia). Una excepción que ya no corresponde a
  ningún aviso solo da un aviso: quítala.
- Hoy hay cuatro, de `xlsx` y del `postcss` anidado en Next, con revisión el 2026-11-30.
- Nunca se baja el umbral (`--audit-level`) para que algo pase.

## Arquitectura

**Rutas y roles.** `src/app/` se divide por rol: `(consumer)` (grupo de rutas con URL públicas
como `/home`, `/products`, `/pet`), `commercial/`, `admin/`, `compliance/`, `game-designer/`,
más `(auth)` y páginas públicas. [src/middleware.ts](src/middleware.ts) aplica el acceso por
rol con `withAuth` de next-auth, pero **no hace nada salvo con `MIDDLEWARE=ACTIVE`**. Hoy
protege por prefijo `/admin`, `/commercial`, `/compliance` y `/game-designer` (menos las dos
páginas públicas de contraseña del diseñador) y, para el consumidor, solo `/raffles` y `/ads`.
Muchas páginas de consumidor no pasan por el middleware: están listadas como
`UNPROTECTED_PENDING` en `__tests__/middleware/routeAccess.ts`, a la espera de una decisión.
El middleware no es la única defensa: la API autoriza los datos (P-5).

**Ruta protegida nueva.** El `config.matcher` es una lista literal (P-4). Una ruta que exige un
rol se agrega en tres sitios:

1. el `matcher` de `src/middleware.ts`;
2. la lógica por rol del cuerpo del middleware;
3. la tabla de `__tests__/middleware/routeAccess.ts`: `ROLE_RULES` si exige un rol (prefijo o
   ruta exacta), `PUBLIC` si es pública, `UNPROTECTED_PENDING` solo si se deja sin proteger a
   conciencia.

`__tests__/middleware/routeProtection.test.ts` recorre todas las páginas de `src/app`
(`page.tsx`, `page.ts`, `page.jsx` y `page.js`) y falla si una no está en exactamente una clase, y
prueba cada página protegida con las seis identidades (sin sesión y cada rol). Una página bajo un
prefijo ya protegido (por ejemplo `/admin/...`) queda cubierta sola.

Los route handlers (`route.tsx`, `route.ts`, `route.jsx` o `route.js`) no están en esa tabla. `__tests__/middleware/routeInventory.test.ts`
falla si aparece uno que no esté en su lista de conocidos (hoy `api/auth` y `api/proxy-download`):
el mensaje pide decidir si exige sesión o rol. Solo obliga a decidir; la protección del handler
nuevo y su prueba las escribe quien lo crea.

**Capa de API.** Toda llamada pasa por la instancia de axios de
[src/lib/api/client.ts](src/lib/api/client.ts) (`NEXT_PUBLIC_API_URL`), usada por
`src/services/*Service.ts` (subcarpetas `admin/`, `commercial/`, `games-campaigns/`), que a su
vez envuelven los hooks de TanStack Query en `src/hooks/**`. Los tipos por dominio viven en
`src/types/`. El interceptor de respuesta resuelve lo transversal: 503 (aviso), 402 (modal de
recarga de billetera), 400 de bloqueo por cambio de plan, y 401 (renueva el token y reintenta
una vez; si falla, cierra sesión y redirige a `/login`). No lo reimplementes en servicios ni
componentes.

**Sesión.** next-auth usa un proveedor `credentials-sync`
([src/lib/auth/authOptions.ts](src/lib/auth/authOptions.ts)): la API emite el JWT; el front lo
decodifica (`parseJwt`) y guarda `accessToken`, `publicId` y `role` en la sesión (7 días). El
front **no verifica la firma** de ese token (deuda conocida; ver P-12). Los usuarios se
identifican por `publicId` (UUID), nunca por el id interno. Las peticiones del cliente leen el
token de un almacén en memoria ([src/lib/auth/tokenStore.ts](src/lib/auth/tokenStore.ts))
sincronizado por `<AuthProvider>`; la renovación está centralizada con un candado en
`tokenRefresh.ts` y se difunde entre pestañas. El código de servidor (páginas SSR) usa
`getSession()`. [plan-token-serverside.md](plan-token-serverside.md) es una propuesta (no
implementada): revísala antes de tocar auth o tokens.

**Peticiones que no pasan por `apiClient`** (y necesitan manejar el token a mano):
`LevelService`, las imágenes privadas (`?token=` en la URL), las notificaciones por SSE y el
beacon de `adService`. Las únicas rutas de servidor propias son `src/app/api/auth` (next-auth)
y `src/app/api/proxy-download/route.ts`, cuya política (https, host exacto de la lista, límite
de 25 MiB y 60 s, sin redirecciones, sesión obligatoria) está en `src/lib/proxy/downloadPolicy.ts`
y tiene pruebas en `__tests__/proxy/`.

**Subida de archivos.** La API entrega URL prefirmadas y el navegador sube directo a Cloudflare
R2 (`FileUploadService`, `hooks/pets/*Upload*`). Un fallo que solo ocurre en el navegador suele
ser el CORS del bucket, no el código.

**Juego de la mascota (Unity WebGL).** `/pet` incrusta un build alojado en R2.
[next.config.ts](next.config.ts) reescribe `/pet-game/*` y `/pet-assets/*` para servirlo como
mismo origen (evita contenido mixto y bloqueos de red local). Localmente la API necesita
`PETS_ASSET_BASE_URL=http://localhost:3000/pet-assets`. El origen del build al que apuntan esas
reescrituras sale de `NEXT_PUBLIC_PET_GAME_ORIGIN` al construir (sin ella, el bucket de dev; en el
`Dockerfile`, obligatoria), y en beta la API necesita
`PETS_ASSET_BASE_URL=https://beta.verygana.com/pet-assets`. El estado de sesión del juego está en
`src/hooks/pet/usePetSession.ts`.

**Tiempo real.** WebSocket con `@stomp/stompjs` y `sockjs-client` (`NEXT_PUBLIC_WS_URL`), y SSE
para notificaciones.

**Formularios dinámicos de juegos.** Se generan desde JSON Schema con `@rjsf/*` (tema shadcn).

**Despliegue.** El `Dockerfile` construye una imagen `standalone` con lo que haya en la carpeta
(`COPY . .`); el objetivo es que salga de un commit de `main`, pero hoy depende de quien construye
(excepción de P-20). Las `NEXT_PUBLIC_*` entran como `--build-arg`; los secretos y variables de
ejecución, solo al arrancar el contenedor.

## Flujo de trabajo con specs

Las funcionalidades se llevan con desarrollo guiado por specs, igual que en la API. La
numeración de `specs/` es **propia del front** e independiente de la de la API.

```bash
claude --agent coordinator    # desde la raíz del repositorio
```

El coordinator conduce la funcionalidad en `specs/<NNN>-<slug>/` (slug en inglés, kebab-case):

1. **Spec** (`spec.md`, con la plantilla `specs/_template/spec.md`) y **Puerta 1**: tú apruebas.
2. **Plan** (`plan.md` y `tasks.md`, por el planner) y **Puerta 2**: tú apruebas.
3. **Implementación** (el implementer, con test primero) tarea por tarea.
4. **Revisión** (`review.md`, por el reviewer), hasta 3 rondas.
5. **Cierre**: resumen, y lo pendiente. Los agentes **nunca hacen git**: commitear lo haces tú.

Los agentes están en `.claude/agents/` (versionados). El resto de `.claude/` y `.agents/` está
ignorado: son ajustes y habilidades locales de cada quien.

Una spec puede llegar **en borrador desde el flujo de la API** (`Estado: Borrador`, campo
`Origen: API · specs/…`) cuando una funcionalidad de la API cambia lo que el front consume. La
aprueba quien trabaje el front en la Puerta 1; mientras esté en borrador no se planifica.

Para cambios triviales (un typo, un texto) no hace falta el flujo completo.

## Qué revisar en cada PR

- Los tres checks de CI en verde. Un `.lint-max-warnings` que sube, o una excepción de
  auditoría nueva sin aprobación escrita, se rechaza (P-19, P-14).
- Una ruta protegida nueva: `matcher`, cuerpo del middleware y `routeAccess.ts` coherentes, y la
  prueba de protección en verde (P-4). Marca siempre cualquier cambio en los roles que exige una
  ruta, aunque el diff sea de una línea.
- Dependencias nuevas en `package.json`: justificadas, sin duplicar otra (P-1).
- Ningún secreto en `NEXT_PUBLIC_*`, en el repositorio ni en la imagen (P-3, P-20).
- Nada de cédula, correo, teléfono, dirección, datos bancarios ni tokens en `console.*`, errores
  o URLs (P-16).
- Un bug arreglado trae la prueba que falla sin el arreglo (P-17).
- Llamadas salientes del servidor con tiempo límite, sin mezclar "inválido" con "caído" (P-15).
- Código en inglés; comentarios, commits, documentación y textos al usuario en español (P-18).

## Documentación

Al terminar una funcionalidad que cambió un flujo de usuario, revisa en Notion si ya hay
documentación y actualízala; si no existe, créala con casos de uso y diagramas de secuencia.

## Habilidades locales

Si tienes habilidades de interfaz instaladas en `.claude/skills` (diseño, animación, buenas
prácticas de React), úsalas para pulir la UI. No se versionan.
