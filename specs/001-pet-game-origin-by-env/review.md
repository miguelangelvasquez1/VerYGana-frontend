# Revisión · 001 · Origen del juego de mascotas por ambiente

## Ronda 1: APROBADO

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅

Las puertas las corrió el reviewer el 2026-10-17 con las variables públicas ficticias de
`CLAUDE.md`, **sin** `NEXT_PUBLIC_PET_GAME_ORIGIN` en el entorno y sin archivos `.env*` en la raíz:

- `npm test`: 8 archivos, 660 pruebas, todas en verde (incluye `__tests__/pet/gameOrigin.test.ts`
  y `__tests__/pet/nextConfigRewrites.test.ts`).
- `npm run lint:ci`: 0 errores, 360 avisos, tope 360 (sin cambios). `.lint-max-warnings` no está
  en el diff. `npx eslint src/lib/pet/gameOrigin.ts __tests__/pet next.config.ts` no da ningún
  aviso: el cambio no agrega avisos (P-19). Nota: `origin/main` aún no tiene `.lint-max-warnings`
  y el script usa el respaldo 360; es lo que ya pasaba antes de este cambio.
- `npm run build`: sale con 0. `.next/routes-manifest.json` (`rewrites.afterFiles`) tiene
  exactamente las dos reglas `/pet-game/:path*` y `/pet-assets/:path*` con destino
  `https://pub-4c0bac3292364531a816300210b54c05.r2.dev/:path*` (CA-1). Se deja así construido.
- `npx tsc --noEmit` (después del build): sale con 0.
- `npm run audit:ci`: sale con 0; solo las cuatro excepciones vigentes de `postcss` y `xlsx`.
- Comprobaciones extra: `npm run build` con
  `NEXT_PUBLIC_PET_GAME_ORIGIN='https://user:secreto@x.example.test'` sale con 1 y el mensaje en
  español que nombra la variable (CA-6, caso credenciales). `docker build` con los cuatro
  `--build-arg` de siempre y sin `NEXT_PUBLIC_PET_GAME_ORIGIN` falla en el paso
  `[build 6/7] RUN test -n …` con "Falta NEXT_PUBLIC_PET_GAME_ORIGIN (--build-arg)…", antes de
  `RUN npm run build` (CA-7). Se corrió sin `-t` y el número de imágenes y contenedores no cambió.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `__tests__/pet/gameOrigin.test.ts` ("usa el bucket de dev…", valor literal) y `__tests__/pet/nextConfigRewrites.test.ts` ("sin la variable…", contra el `next.config.ts` real); `routes-manifest.json` del build del reviewer. |
| CA-2 | ✅ (la parte de red, manual) | `nextConfigRewrites.test.ts` ("con la variable (y barra final)…") falla con el `next.config.ts` anterior (destino fijo a dev): cumple P-17. Que el bucket de beta sirva un `network_config.json` con `baseUrl` `https://api-beta.verygana.com` es la comprobación con `curl` de T3; el reviewer no la repitió (necesita red y un servidor corriendo). |
| CA-3 | ✅ | Mismo test: ambas reglas con el mismo origen (`toEqual` exacto de las dos); `petGameRewrites` en `gameOrigin.test.ts` comprueba `rules[0].destination === rules[1].destination`. |
| CA-4 | ⏳ | Verificación manual en beta (T8), a cargo del usuario tras desplegar y con `PETS_ASSET_BASE_URL` ajustada en la API. No bloquea esta revisión. |
| CA-5 | ✅ | `gameOrigin.test.ts` ("quita la barra final" y "con barra final … no aparece //") y `nextConfigRewrites.test.ts` (entrada con `/` final, destino sin `//`). |
| CA-6 | ✅ | `it.each` de `gameOrigin.test.ts` con los nueve inválidos de D-1/D-2 (`''`, espacios, sin esquema, `http`, `ftp`, credenciales, ruta, query, `#`), todos `toThrow(/NEXT_PUBLIC_PET_GAME_ORIGIN/)`; `nextConfigRewrites.test.ts` con `rejects.toThrow`; build real con valor inválido sale con 1 (comprobado por el reviewer). |
| CA-7 | ✅ | `docker build` sin el argumento, corrido por el reviewer: falla en el `RUN test -n` (línea 51 del `Dockerfile`), antes del `RUN npm run build` (línea 54). |
| CA-8 | ✅ | `grep -n '^ARG' Dockerfile`: el único `ARG` nuevo es `NEXT_PUBLIC_PET_GAME_ORIGIN` (línea 29), en la etapa `build`; nada nuevo en `runner`. Es una dirección pública (P-3, P-20). |
| CA-9 | ✅ | `grep -c NEXT_PUBLIC_PET_GAME_ORIGIN .github/workflows/ci.yml` da `0` y las cinco puertas pasan sin la variable. |

Pruebas que fallarían sin el cambio (P-17): `gameOrigin.test.ts` no puede ni importar el módulo
sin él; en `nextConfigRewrites.test.ts`, los casos de beta, de valor inválido y de "lee la
variable en cada llamada" se ponen en rojo con el `rewrites()` anterior (destino fijo). El caso
"sin la variable" pasa con el código viejo y con el nuevo, a propósito: protege el refactor.
Si se rompe mentalmente la línea `url.protocol === 'https:'` (`src/lib/pet/gameOrigin.ts:33`),
los casos `http://` y `ftp://` del `it.each` se ponen en rojo; si se quita `url.pathname === '/'`
(línea 36), cae `https://x.example.test/sub`.

Alcance: el diff toca solo lo que dice el plan (`src/lib/pet/gameOrigin.ts`, las dos pruebas,
`next.config.ts`, `Dockerfile`, `CLAUDE.md` y las casillas y la nota de T5 en `tasks.md`). Ni
`package.json`, ni `package-lock.json`, ni `security/audit-exceptions.json`, ni
`.lint-max-warnings`, ni `src/middleware.ts`, ni `routeAccess.ts` cambian. `CLAUDE.md` cambia
solo en lo que autoriza D-3: la fila de la tabla de variables (texto del plan, palabra por
palabra) y la frase del párrafo "Juego de la mascota".

Constitución: sin dependencias nuevas (P-1); sin páginas, layouts ni `'use client'` nuevos (P-2,
P-6 no aplican); la variable se lee solo en `next.config.ts` (Node), no en código de cliente, así
que no queda en el bundle del navegador, y no es un secreto (P-3); sin rutas nuevas ni cambios de
rol (P-4, P-5); sin `any` ni `@ts-ignore` (P-9); pruebas en `__tests__/`, entorno `node`, sin red
(P-13); identificadores en inglés y comentarios y mensaje en español (P-18); el `Dockerfile` solo
recibe un `ARG` público más y nada en la etapa final (P-20). P-15 no aplica: no hay `fetch` de
servidor nuevo (las reescrituras las hace el proxy de Next, como antes).

### Bloqueantes
Ninguno.

### Sugerencias (no bloquean)
- `src/lib/pet/gameOrigin.ts:20` (P-16): el mensaje de error repite el valor recibido
  (`se recibió "${raw}"`). Para el uso previsto es aceptable, y así lo aprobó el plan: el valor es
  una dirección pública y el mensaje solo aparece en la salida del build de quien construye. Pero
  el caso que la propia validación rechaza por tener credenciales (`https://user:pw@host`) es
  justo el que más daño hace al repetirse: el reviewer lo comprobó y el log del build muestra la
  contraseña tal cual (`se recibió "https://user:secreto@x.example.test"`), y ese log puede
  terminar en la salida de CI o de `docker build`. Para que el mensaje no muestre nunca una
  credencial, se puede omitir el valor, o, si `new URL` lo parsea, mostrar solo
  `url.protocol + '//' + url.host + url.pathname` sin la parte de usuario y contraseña, con una
  prueba que compruebe que el mensaje no contiene `pw`. Es poco probable que alguien escriba una
  credencial ahí, por eso no bloquea.
- `src/lib/pet/gameOrigin.ts:32-38`: un `?` o un `#` vacíos al final (`https://host?`,
  `https://host#`) pasan la validación porque `url.search` y `url.hash` quedan en `''`. No hace
  daño, porque se devuelve `url.origin` y el destino queda limpio. También se acepta un puerto
  explícito (`https://host:8443`), que entra en `origin`. Si se quiere que la regla "solo esquema
  y host" sea estricta, conviene dejarlo escrito en el comentario de la función o cubrirlo con
  una prueba.
- La comprobación de red de CA-2 y CA-3 (`curl` a `/pet-game/…/network_config.json` contra el
  servidor standalone construido con la variable de beta) solo la reporta el implementer en T3;
  conviene pegar su salida en la descripción del PR junto con la de CA-7.
- Recordatorio fuera del diff: `up-front.sh` (no versionado) tiene que pasar
  `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com`, o la imagen de beta
  dejará de construirse (es lo que se busca con RN-4, pero hay que avisar a quien despliega). Y
  `PETS_ASSET_BASE_URL` de beta en Infisical de la API es requisito de CA-3 y CA-4 en beta.
