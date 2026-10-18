# Tareas · 001 · Origen del juego de mascotas por ambiente

Plan: [plan.md](plan.md). Spec: [spec.md](spec.md).

Para `npm run build` y `npm run lint:ci` exporta antes las variables públicas ficticias de
`CLAUDE.md` (sección "Comandos"); en este documento se abrevian como `$CI_VARS`:

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

Ninguna prueba toca la red. Ninguna tarea agrega avisos de lint: `.lint-max-warnings` no cambia
(P-19).

- [x] T1 · Módulo puro: resolver el origen y armar las reescrituras (CA-1, CA-2, CA-3, CA-5, CA-6)
  - Archivos: src/lib/pet/gameOrigin.ts, __tests__/pet/gameOrigin.test.ts
  - Test primero: __tests__/pet/gameOrigin.test.ts, importando de `@/lib/pet/gameOrigin`. Falla
    antes porque el módulo no existe. Casos:
    - `resolvePetGameOrigin(undefined)` devuelve `'https://pub-4c0bac3292364531a816300210b54c05.r2.dev'`
      (literal en la prueba, no la constante: si alguien cambia el valor por defecto, la prueba
      se pone roja) y `DEV_PET_GAME_ORIGIN` es ese mismo valor.
    - `https://mascotas-beta.verygana.com` y `https://mascotas-beta.verygana.com/` devuelven
      `https://mascotas-beta.verygana.com`; con espacios alrededor, también.
    - `it.each` de inválidos: `''`, `'   '`, `'mascotas-beta.verygana.com'`, `'http://mascotas-beta.verygana.com'`,
      `'ftp://x.example.test'`, `'https://user:pw@x.example.test'`, `'https://x.example.test/sub'`,
      `'https://x.example.test/?a=1'`, `'https://x.example.test/#h'`: lanzan y el mensaje
      contiene `NEXT_PUBLIC_PET_GAME_ORIGIN` (`toThrow(/NEXT_PUBLIC_PET_GAME_ORIGIN/)`).
    - `petGameRewrites('https://mascotas-beta.verygana.com')` es exactamente
      `[{ source: '/pet-game/:path*', destination: 'https://mascotas-beta.verygana.com/:path*' },
      { source: '/pet-assets/:path*', destination: 'https://mascotas-beta.verygana.com/:path*' }]`.
    - Con el resultado de `resolvePetGameOrigin('https://mascotas-beta.verygana.com/')`, ningún
      `destination` contiene `//:` ni `.com//` (CA-5) y ambos destinos son iguales (RN-3).
    - `PET_GAME_ORIGIN_ENV === 'NEXT_PUBLIC_PET_GAME_ORIGIN'`.
  - Implementación: sin imports (ni `@/` ni paquetes), sin `any`; `new URL` dentro de `try`;
    devuelve `url.origin`. Reglas y mensaje en la sección "Reglas de `resolvePetGameOrigin`" del
    plan. Identificadores en inglés, comentario de cabecera y mensaje en español (P-18).
  - Verificar: npx vitest run __tests__/pet/gameOrigin.test.ts && npx tsc --noEmit

- [x] T2 · `next.config.ts` lee la variable al construir (CA-1, CA-2, CA-3, CA-5, CA-6)
  - Archivos: next.config.ts, __tests__/pet/nextConfigRewrites.test.ts
  - Test primero: __tests__/pet/nextConfigRewrites.test.ts, con `import nextConfig from '../../next.config'`,
    `vi.stubEnv` / `vi.unstubAllEnvs()` en `afterEach`, y un ayudante que comprueba que
    `nextConfig.rewrites` es función y que su resultado es un arreglo. Casos:
    - Sin la variable (`vi.stubEnv('NEXT_PUBLIC_PET_GAME_ORIGIN', undefined)`): las dos reglas van
      a `https://pub-4c0bac3292364531a816300210b54c05.r2.dev/:path*` (literal). Hoy ya pasa:
      sirve de red de seguridad del refactor.
    - Con `https://mascotas-beta.verygana.com/`: las dos reglas van a
      `https://mascotas-beta.verygana.com/:path*`. **Debe fallar antes** del cambio (hoy el
      destino es fijo a dev).
    - Con `http://mascotas-beta.verygana.com`: `await expect(nextConfig.rewrites!()).rejects.toThrow(/NEXT_PUBLIC_PET_GAME_ORIGIN/)`.
      **Debe fallar antes** del cambio.
    - La variable se lee en cada llamada: dos llamadas seguidas con valores distintos dan
      destinos distintos (comprueba que la lectura está dentro de `rewrites()`).
  - Implementación: `import { petGameRewrites, resolvePetGameOrigin } from './src/lib/pet/gameOrigin';`
    (relativo, no `@/`); `async rewrites() { return petGameRewrites(resolvePetGameOrigin(process.env.NEXT_PUBLIC_PET_GAME_ORIGIN)); }`.
    Conservar el comentario largo sobre contenido mixto / Local Network Access y el de CORS de
    los assets; reemplazar el comentario SCRUM-105 por uno que diga de dónde sale el origen
    (variable de build, dev por defecto, beta `https://mascotas-beta.verygana.com`) y ampliar el
    de `PETS_ASSET_BASE_URL` con el valor de beta (`https://beta.verygana.com/pet-assets`).
    `images.remotePatterns` y `headers()` sin cambios.
  - Verificar: npx vitest run __tests__/pet && $CI_VARS npm run build && npx tsc --noEmit
  - Comprobar (R-1, el import relativo carga en Next): el `npm run build` anterior termina sin
    errores; `npx next dev` arranca y `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login`
    da `200`.

- [x] T3 · Comprobación de las reescrituras construidas (CA-1, CA-2, CA-3, CA-5, CA-6)
  - Archivos: ninguno (solo verificación; anotar resultados en el PR)
  - Verificar: con `$CI_VARS` exportadas, en este orden:
    1. CA-1: `unset NEXT_PUBLIC_PET_GAME_ORIGIN; npm run build && grep -o 'pub-4c0bac3292364531a816300210b54c05.r2.dev/:path\*' .next/routes-manifest.json | wc -l`
       da `2`.
    2. CA-6: `NEXT_PUBLIC_PET_GAME_ORIGIN=http://mascotas-beta.verygana.com npm run build; echo $?`
       termina con código distinto de `0` y la salida muestra el mensaje en español con
       `NEXT_PUBLIC_PET_GAME_ORIGIN`. Repetir con `NEXT_PUBLIC_PET_GAME_ORIGIN='   '` y con
       `NEXT_PUBLIC_PET_GAME_ORIGIN=mascotas-beta.verygana.com`.
    3. CA-5: `NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com/ npm run build && grep -o 'mascotas-beta.verygana.com[^"]*' .next/routes-manifest.json`
       muestra solo `mascotas-beta.verygana.com/:path*` (dos veces, sin `//`).
  - Comprobar (CA-2, CA-3; necesita red): tras el build del paso 3, `PORT=3005 node .next/standalone/server.js`
    y en otra terminal:
    - `curl -s http://localhost:3005/pet-game/StreamingAssets/network_config.json` muestra un
      JSON cuya `baseUrl` es `https://api-beta.verygana.com` (CA-2).
    - `curl -s http://localhost:3005/pet-assets/StreamingAssets/network_config.json` devuelve el
      mismo contenido (mismo bucket que `/pet-game`, CA-3).
    - Al terminar, vuelve a correr `npm run build` sin la variable para no dejar un `.next` de beta.

- [x] T4 · `Dockerfile`: argumento obligatorio y comando documentado (CA-7, CA-8; RN-4, RN-6)
  - Archivos: Dockerfile
  - Test primero: no aplica (no hay pruebas de `Dockerfile`); se verifica en T5.
  - Cambios: `ARG NEXT_PUBLIC_PET_GAME_ORIGIN` junto a los demás; `NEXT_PUBLIC_PET_GAME_ORIGIN=$NEXT_PUBLIC_PET_GAME_ORIGIN`
    en el bloque `ENV`; un `RUN test -n "$NEXT_PUBLIC_PET_GAME_ORIGIN" || { echo "Falta NEXT_PUBLIC_PET_GAME_ORIGIN (--build-arg): origen del build de mascotas, por ejemplo https://mascotas-beta.verygana.com"; exit 1; }`
    después del `RUN test` existente y **antes** de `RUN npm run build`; en el comentario de
    cabecera, `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com` en el
    comando de beta. Ningún otro `ARG` nuevo; nada en la etapa `runner`.
  - Verificar: grep -n '^ARG' Dockerfile (un solo `ARG` nuevo, `NEXT_PUBLIC_PET_GAME_ORIGIN`) && grep -n 'NEXT_PUBLIC_PET_GAME_ORIGIN' Dockerfile (aparece en cabecera, `ARG`, `ENV` y `RUN test`, y el `RUN test` tiene número de línea menor que `RUN npm run build`)

- [x] T5 · Comprobar la imagen sin y con el argumento (CA-7, CA-8)
  - Nota: solo se corrió el `docker build` sin el argumento (CA-7); el build completo opcional no se hizo.
  - Archivos: ninguno (solo verificación; anotar resultados en el PR)
  - Verificar (CA-7): `docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.test --build-arg NEXT_PUBLIC_WS_URL=https://api.example.test/ws --build-arg NEXT_PUBLIC_PET_GAME_URL=https://games.example.test --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci -t verygana-front:spec001-check .`
    falla en el paso `RUN test -n "$NEXT_PUBLIC_PET_GAME_ORIGIN"` con el mensaje "Falta
    NEXT_PUBLIC_PET_GAME_ORIGIN…", y `npm run build` no llega a ejecutarse.
  - Verificar (opcional, tarda unos minutos): el mismo comando con
    `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com` termina bien.
  - Sin Docker en la máquina: CA-7 se verifica **por lectura** del `Dockerfile` (el `RUN test`
    está antes de `RUN npm run build` y su `echo` nombra la variable) y se dice así en el PR.
  - CA-8: revisión del diff del `Dockerfile` (un único `ARG` nuevo, público; ningún secreto ni
    variable de ejecución como `ARG`, P-3, P-20).

- [x] T6 · Documentación en `CLAUDE.md` (RN-6; decisión D-3)
  - Archivos: CLAUDE.md
  - Cambios: fila de `NEXT_PUBLIC_PET_GAME_ORIGIN` en la tabla "Variables de entorno", justo
    después de `NEXT_PUBLIC_PET_GAME_URL` (texto propuesto en el plan, sección "Configuración");
    en "Juego de la mascota", una frase: el origen del build sale de `NEXT_PUBLIC_PET_GAME_ORIGIN`
    al construir (sin ella, el bucket de dev; en el `Dockerfile`, obligatoria) y en beta la API
    necesita `PETS_ASSET_BASE_URL=https://beta.verygana.com/pet-assets`. No cambiar la lista de
    variables ficticias de "Comandos" ni las puertas de CI.
  - Verificar: grep -n 'NEXT_PUBLIC_PET_GAME_ORIGIN' CLAUDE.md (tabla y párrafo)

- [x] T7 · Puertas completas (CA-9 y todo lo anterior)
  - Archivos: ninguno
  - Verificar: `grep -c NEXT_PUBLIC_PET_GAME_ORIGIN .github/workflows/ci.yml` da `0`; luego, en
    una terminal con solo `$CI_VARS` (sin `NEXT_PUBLIC_PET_GAME_ORIGIN`):
    `npm test && npm run lint:ci && npm run build && npx tsc --noEmit && npm run audit:ci`.
    `lint:ci` pasa con el mismo `.lint-max-warnings` (ningún aviso nuevo; si bajara, ajustar el
    número según el mensaje, P-19). Tras abrir el PR, los tres checks en verde.

- [ ] T8 · Verificación manual en beta (CA-4) — la hace el usuario tras desplegar
  - Archivos: ninguno
  - Requisitos: imagen construida con `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com`
    (actualizar `up-front.sh`, no versionado), desplegada en `https://beta.verygana.com`, y
    `PETS_ASSET_BASE_URL=https://beta.verygana.com/pet-assets` en Infisical de la API de beta.
  - Comprobar: con una cuenta de consumidor en `https://beta.verygana.com/pet`, en las
    herramientas de red del navegador las peticiones a `/pet-game/…` y `/pet-assets/…` responden
    200 y las del juego van a `https://api-beta.verygana.com` (ninguna a `localhost:8080`, sin
    "Unknown Error | HTTP: 500"); comprar un ítem, recargar la página: el ítem comprado y el
    progreso siguen ahí. Opcional: como diseñador, abrir la vista previa de una escena
    (`ScenePreviewModal`) y ver que carga.
