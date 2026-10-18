# Plan · 001 · Origen del juego de mascotas por ambiente

- **Spec:** [spec.md](spec.md) (Aprobada, 2026-10-17, SCRUM-105)
- **Origen:** API · `specs/006-beta-deployment` (T16 y bloque 5b), SCRUM-77. No cambia ningún
  endpoint: la dependencia con la API es solo de configuración (`PETS_ASSET_BASE_URL` en Infisical).

## Resumen

El destino de las reescrituras `/pet-game/:path*` y `/pet-assets/:path*` deja de estar escrito
fijo en `next.config.ts` y sale de `NEXT_PUBLIC_PET_GAME_ORIGIN`, leída al construir. La lógica
(valor por defecto de dev, normalización de la barra final, validación `https://` con mensaje en
español) vive en un módulo puro con pruebas de Vitest; el `Dockerfile` exige la variable y se
documenta en `CLAUDE.md`.

## Archivos

| Acción | Ruta | Qué cambia |
|--------|------|------------|
| Crear | `src/lib/pet/gameOrigin.ts` | Módulo puro, **sin imports**: `PET_GAME_ORIGIN_ENV` (nombre de la variable), `DEV_PET_GAME_ORIGIN` (`https://pub-4c0bac3292364531a816300210b54c05.r2.dev`, el de hoy), `resolvePetGameOrigin(raw: string \| undefined): string` (lanza `Error` con mensaje en español si el valor es inválido) y `petGameRewrites(origin: string): { source: string; destination: string }[]` (las dos reglas, mismo origen). |
| Crear | `__tests__/pet/gameOrigin.test.ts` | Pruebas del módulo puro (CA-1, CA-2, CA-3, CA-5, CA-6). |
| Crear | `__tests__/pet/nextConfigRewrites.test.ts` | Importa el `next.config.ts` real y llama a `nextConfig.rewrites()` con `vi.stubEnv`: prueba el cableado (que la variable se lee en el momento de construir y que ambas reglas usan el mismo origen). |
| Modificar | `next.config.ts` | `rewrites()` devuelve `petGameRewrites(resolvePetGameOrigin(process.env.NEXT_PUBLIC_PET_GAME_ORIGIN))`, con import **relativo** `./src/lib/pet/gameOrigin`. Se actualizan el comentario SCRUM-105 (ya no "siguen apuntando a dev") y el de `PETS_ASSET_BASE_URL` (local: `http://localhost:3000/pet-assets`; beta: `https://beta.verygana.com/pet-assets`). `images.remotePatterns` y `headers()` no cambian. |
| Modificar | `Dockerfile` | `ARG NEXT_PUBLIC_PET_GAME_ORIGIN`, su línea en el `ENV`, un `RUN test -n "$NEXT_PUBLIC_PET_GAME_ORIGIN" \|\| { echo "Falta NEXT_PUBLIC_PET_GAME_ORIGIN (--build-arg) ..."; exit 1; }` **antes** de `RUN npm run build`, y el comando de cabecera con `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com`. |
| Modificar | `CLAUDE.md` | Fila nueva en la tabla "Variables de entorno" y una frase en "Juego de la mascota" (de dónde sale el origen, valor por defecto dev, obligatoria en Docker, `PETS_ASSET_BASE_URL` de beta). Requisito de RN-6; ver D-3. |

No se tocan: `src/hooks/pet/usePetSession.ts`, `src/components/game-designer/pet/ScenePreviewModal.tsx`
(`NEXT_PUBLIC_PET_GAME_URL` no cambia), `.github/workflows/ci.yml` (CA-9), `src/middleware.ts`,
`__tests__/middleware/routeAccess.ts`, `.dockerignore` (ya deja entrar `src/` y excluye `__tests__`),
`package.json`.

Patrón de referencia: `src/lib/proxy/downloadPolicy.ts` + `__tests__/proxy/downloadPolicy.test.ts`
(política pura, sin red ni entorno, probada aislada) y `__tests__/proxy/route.test.ts` (prueba
del punto de integración real, con la constante crítica escrita literal en la prueba).

### Por qué el import es relativo y el módulo no importa nada

Comprobado en la versión instalada (`next` 15.5.27,
`node_modules/next/dist/build/next-config-ts/transpile-config.js` y `require-hook.js`):
`next.config.ts` se transpila con SWC a CommonJS y, si el resultado contiene `require(`, Next
registra un hook de `require` para `.ts`, `.cts`, `.mts`, así que un `import` relativo de un `.ts`
sin extensión se resuelve y transpila. SWC recibe `paths` de `tsconfig.json`, por lo que `@/`
probablemente también funcionaría, pero no está documentado como soportado y no lo usamos: import
relativo, y el módulo sin dependencias para que no arrastre nada al cargar la configuración.
`loadCustomRoutes` (`node_modules/next/dist/lib/load-custom-routes.js`, línea 408) hace
`await config.rewrites()` sin `try`, así que un `Error` lanzado ahí corta `next build` (y
`next dev`) mostrando el mensaje (RN-5). Vitest importa el mismo archivo sin problemas (entorno
`node`, el `import type` de `next` se borra).

La lectura de `process.env` va **dentro** de `rewrites()`, no al cargar el módulo: así la prueba
de cableado puede cambiar la variable con `vi.stubEnv` y `next lint` (que también carga la
configuración) no falla por un valor inválido.

Con `output: 'standalone'`, `server.js` no vuelve a evaluar `next.config.ts`: las reescrituras
quedan en `.next/routes-manifest.json` al construir. Por eso la variable se necesita en el build
y no al arrancar (requisito no funcional de la spec), y el módulo no tiene que estar en la imagen
final.

## Reglas de `resolvePetGameOrigin`

| Entrada | Resultado |
|---------|-----------|
| `undefined` (variable ausente: local, CI) | `DEV_PET_GAME_ORIGIN` (RN-2, CA-1) |
| `https://mascotas-beta.verygana.com` | el mismo valor (CA-2, CA-3) |
| `https://mascotas-beta.verygana.com/` | `https://mascotas-beta.verygana.com`, sin `//` en el destino (CA-5) |
| Espacios alrededor de un valor válido | se recortan y se acepta |
| `''` o solo espacios | error (CA-6; ver D-1) |
| Sin esquema (`mascotas-beta.verygana.com`), no parseable | error (CA-6) |
| `http://…` u otro esquema | error (CA-6) |
| Con usuario o contraseña, con ruta distinta de `/`, con `?` o `#` | error (ver D-2) |

El valor devuelto es `new URL(valor).origin` (sin barra final, host en minúsculas, sin `:443`).
Mensaje de error (texto exacto a criterio del implementer, pero debe contener el nombre de la
variable y ser en español), por ejemplo:

> `NEXT_PUBLIC_PET_GAME_ORIGIN no es un origen https:// válido (se recibió "http://x.test"). Usa solo esquema y host, por ejemplo https://mascotas-beta.verygana.com, o quita la variable para usar el build de dev.`

Incluir el valor recibido es aceptable: es una dirección pública, no PII ni secreto (P-16).

`petGameRewrites(origin)` devuelve, en este orden y con el mismo `origin` (RN-3):
`{ source: '/pet-game/:path*', destination: `${origin}/:path*` }` y
`{ source: '/pet-assets/:path*', destination: `${origin}/:path*` }`.

## Rutas y acceso

Sin páginas ni route handlers nuevos. `/pet-game/*` y `/pet-assets/*` siguen siendo reescrituras
(no páginas), no están en el `matcher` y no cambian de rol. No hay cambios en `src/middleware.ts`
ni en `routeAccess.ts`; `routeProtection.test.ts` y `routeInventory.test.ts` no se ven afectadas.
No hay componentes de servidor ni de cliente nuevos (P-2, P-6 no aplican).

## Contrato con la API

No se consume ningún endpoint nuevo. El juego usa la `baseUrl` de su
`StreamingAssets/network_config.json` (en el build de beta, `https://api-beta.verygana.com`).

**Dependencia de la API (configuración):** en Infisical de beta, `PETS_ASSET_BASE_URL` debe ser
`https://beta.verygana.com/pet-assets`. La ajusta el equipo de la API; sin eso CA-3 se cumple en
el front (la reescritura va al bucket de beta) pero el juego en beta seguiría pidiendo los assets
a donde diga la API, y CA-4 no se puede verificar.

## Datos y estado

No aplica: sin servicios, hooks, `queryKey`s ni mutaciones.

## UI

No aplica: no hay pantallas nuevas. Lo visible es el juego que ya existe en `/pet` y la vista
previa de `ScenePreviewModal`.

## Configuración

- Variable nueva **`NEXT_PUBLIC_PET_GAME_ORIGIN`**: de build, se lee solo en `next.config.ts`
  (Node), no en código de cliente. Lleva `NEXT_PUBLIC_` por decisión de la spec (RN-1) para
  entrar como `--build-arg` sin apartarse de P-20; es una dirección pública, nunca un secreto
  (P-3). Como nadie la lee en el navegador, no termina incrustada en el bundle.
- Fuera de Docker es opcional (por defecto, dev). En `Dockerfile` es obligatoria (RN-4).
- `.github/workflows/ci.yml` **no** la define (CA-9): el build del CI usa dev.
- `images.remotePatterns`: sin cambios (ya tiene `mascotas-beta.verygana.com`; además las
  reescrituras no pasan por `next/image`).
- `CLAUDE.md`: fila nueva en la tabla, ubicada junto a `NEXT_PUBLIC_PET_GAME_URL`:
  `| NEXT_PUBLIC_PET_GAME_ORIGIN | servidor, en el build (next.config.ts) | origen del build de mascotas al que se reescriben /pet-game y /pet-assets; ausente, el bucket de dev; obligatoria en el Dockerfile (beta: https://mascotas-beta.verygana.com) |`.
  La lista de variables ficticias del CI en `CLAUDE.md` **no** cambia.

## Dependencias

Ninguna nueva (P-1).

## Seguridad y PII

Sin PII. La variable es una dirección pública; el mensaje de error solo repite esa dirección. No
se tocan tokens ni el flujo de auth (P-12). El `Dockerfile` recibe un único `ARG` nuevo, público
(CA-8, P-20). La deuda P-16 (e) de `usePetSession.ts` (credenciales de partida en la URL del
iframe) no se toca ni empeora.

## Llamadas salientes del servidor

No se agrega ninguna ruta de `src/app/api` ni `fetch` del servidor. Las reescrituras externas las
hace el servidor de Next al recibir la petición (proxy interno de Next); su comportamiento ante
un origen caído (502 de Next) es el de hoy y no cambia con este plan. P-15 no aplica a código
nuevo.

## Efectos colaterales

- Consumidor (`/pet`) y diseñador (`ScenePreviewModal`) cargan el build del origen configurado:
  en beta, el de `verygana-pets-beta`; en local y CI, el de dev, como hoy.
- Un valor inválido rompe `next build` **y** `next dev` (también en local): es lo que pide RN-5.
- Sin tiempo real, notificaciones ni otras pantallas afectadas.
- `up-front.sh` (no versionado) tiene que pasar el `--build-arg` nuevo; si no, el `docker build`
  de beta falla con el mensaje de RN-4. Lo ajusta quien despliega (fuera de alcance).

## Trazabilidad

| CA | Tareas | Cómo se verifica |
|----|--------|------------------|
| CA-1 | T1, T2, T3 | `__tests__/pet/gameOrigin.test.ts` (`undefined` → dev) y `__tests__/pet/nextConfigRewrites.test.ts` (sin variable → dos reglas al bucket de dev, literal en la prueba); `npm run build` sin la variable y lectura de `.next/routes-manifest.json`. |
| CA-2 | T1, T2, T3 | Pruebas con `https://mascotas-beta.verygana.com` → destino `https://mascotas-beta.verygana.com/:path*`; build con la variable y `curl` a `/pet-game/StreamingAssets/network_config.json` en el servidor standalone: la respuesta trae `api-beta.verygana.com`. |
| CA-3 | T1, T2, T3 | Pruebas: ambas reglas con el mismo origen; `curl` a `/pet-assets/StreamingAssets/network_config.json` devuelve el mismo archivo que por `/pet-game` (mismo bucket). |
| CA-4 | T8 | **Manual en beta**, tras desplegar la imagen y con `PETS_ASSET_BASE_URL` ajustada: comprar un ítem, recargar, la compra y el progreso siguen. |
| CA-5 | T1, T2, T3 | Pruebas con barra final: destinos idénticos y sin `//`; build con barra final y `grep` en `routes-manifest.json`. |
| CA-6 | T1, T2, T3 | Pruebas: `''`, `'   '`, `mascotas-beta.verygana.com`, `http://…` lanzan con mensaje que contiene `NEXT_PUBLIC_PET_GAME_ORIGIN`; `npm run build` con `http://…` sale con código distinto de 0 y el mensaje. |
| CA-7 | T4, T5 | `docker build` sin `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN` falla en el `RUN test -n` (antes de `npm run build`) con el mensaje que nombra la variable. Si en la máquina no hay Docker, se verifica **por lectura** del `Dockerfile` (el `RUN test` está antes de `RUN npm run build` y su `echo` nombra la variable) y se anota así en el PR. |
| CA-8 | T4, T5 | Revisión del diff del `Dockerfile`: un único `ARG` nuevo, `NEXT_PUBLIC_PET_GAME_ORIGIN`, ningún secreto; `grep -n '^ARG' Dockerfile`. |
| CA-9 | T7 | `grep -c NEXT_PUBLIC_PET_GAME_ORIGIN .github/workflows/ci.yml` da `0` y las cinco puertas locales pasan con solo las variables ficticias de `CLAUDE.md`; luego los tres checks del PR en verde. |

## Riesgos

- **R-1 · Import de `.ts` desde `next.config.ts`.** Soportado según el código de la versión
  instalada, pero no es un camino muy usado. Se confirma en T2 con `npm run build` (y
  `npx next dev` arrancando). Si fallara, alternativa sin cambiar el comportamiento: dejar la
  lógica en el propio `next.config.ts` exportando las funciones con nombre y probarlas desde ahí.
- **R-2 · Un valor inválido rompe también `next dev`.** Intencional (RN-5); el mensaje dice cómo
  arreglarlo (quitar la variable).
- **R-3 · CA-2/CA-3 dependen de la red** en la verificación manual (T3 hace `curl` a través del
  servidor local hacia `mascotas-beta.verygana.com`). Las pruebas automáticas no tocan la red
  (P-13).
- **R-4 · `up-front.sh` sin versionar.** Si quien despliega no agrega el `--build-arg`, el build
  de beta falla (que es lo deseado por RN-4), pero hay que avisarle.
- **R-5 · Caché de Docker:** el `RUN test` va en la etapa `build`, después de `npm ci` (etapa
  `deps`); la comprobación de CA-7 en un clon sin caché tarda lo que tarde `npm ci`.

## Decisiones para el usuario

- **D-1 · Cadena vacía.** El plan trata `NEXT_PUBLIC_PET_GAME_ORIGIN=` (vacía, por ejemplo en
  `.env.local`) como **error**, igual que "solo espacios", y solo la variable ausente como "usar
  dev". Alternativa: tratar `''` como ausente. Recomendado: error (RN-5 dice "vacía de espacios" y
  evita caer a dev en silencio).
- **D-2 · Solo origen.** El plan rechaza valores con ruta (`https://host/sub`), query, fragmento
  o credenciales: la variable se llama *origin* y el build está en la raíz del bucket. Si se
  quisiera admitir una subcarpeta, cambia la regla y sus pruebas.
- **D-3 · Edición de `CLAUDE.md`.** RN-6 la exige (tabla y párrafo "Juego de la mascota"). Al
  aprobar este plan en la Puerta 2 se autoriza esa edición en T6.

## Bloqueos

Ninguno para implementar. CA-4 queda pendiente de la dependencia de la API (`PETS_ASSET_BASE_URL`
de beta en Infisical) y del despliegue, que hace el usuario.
