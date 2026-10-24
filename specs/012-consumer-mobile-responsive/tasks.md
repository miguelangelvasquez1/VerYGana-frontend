# 012 · Tareas: vistas del consumidor usables en celular

Plan: `plan.md` de esta carpeta. Spec: `spec.md`.

## Convenciones

- Todo se corre desde la raíz del repo (`/Users/nicolascastro/Desktop/VerYganar-frontend-beta`).
- **Nadie hace git salvo el usuario.** Los `git` de las verificaciones son de lectura.
- `build` y `lint:ci` necesitan las variables públicas ficticias de `CLAUDE.md`:

  ```bash
  export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
    NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
    NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
  ```

- `npm run build:e2e` reemplaza `.next`: antes de `npx tsc --noEmit` se vuelve a correr
  `npm run build`.
- "E2E de la página" = `npm run build:e2e && npx playwright test e2e/layout.spec.ts
  e2e/touch.spec.ts -g "<ruta>"`. Al arreglar una página se la saca de `e2e/support/pending.ts`;
  si sigue en la lista y ya pasa, la corrida falla (falla esperada que no falló).
- Cada arreglo de responsive sigue la regla de `plan.md` 7.4: clases de celular primero y el valor
  de escritorio restaurado con `lg:` (o el `md:` que ya hubiera). Nunca se quita una clase de
  escritorio de un componente compartido.
- Si una tarea quita avisos de lint (`<img>` → `next/image`, `any`), baja `.lint-max-warnings` al
  número que diga `npm run lint:ci` en esa misma tarea (P-19).
- "Debe fallar antes" describe cómo se comprueba que la prueba sirve: el implementer la ve en rojo
  antes del cambio (o reintroduce el defecto a mano y lo deshace editando, no con git).
- Las tareas marcadas **[espera D-n]** no empiezan sin esa decisión del usuario.

## Trazabilidad CA → tareas

| CA | Tareas | Verificación |
|----|--------|--------------|
| CA-1 | T5, T6, T7, T11-T25, T27 | `npx playwright test e2e/layout.spec.ts` |
| CA-2 | T7, T11-T25, T27 | `npx playwright test e2e/touch.spec.ts` |
| CA-3 | T2, T3, T11, T13, T17, T18, T22, T23, T24, T27 | `npx vitest run __tests__/ui/consumerInteractive.test.ts`; `npx playwright test e2e/rn4.spec.ts` |
| CA-4 | T2, T3, T7, T11, T12, T17, T19, T20, T27 | `npx vitest run __tests__/ui/consumerInteractive.test.ts`; `e2e/layout.spec.ts` |
| CA-5 | T11, T24 | `npx playwright test e2e/rn4.spec.ts -g "CA-5"` |
| CA-6 | T19, T20, T21, T23, T29, U-3 | `npx playwright test e2e/forms.spec.ts` + pasada manual |
| CA-7 | T16, T25, T29, U-3 | `npx playwright test e2e/pet.spec.ts` + pasada manual |
| CA-8 | T9, T14, T28 | `git diff --stat main -- <carpetas de otros roles>`; `--project=desktop-1280` |
| CA-9 | T3, T7, T8, T26, T30, M-1 | Jobs del CI en verde y < 10 min; `npm run lint:ci` |
| CA-10 | T29, U-3 | Tabla de resultados de `spec.md` completa |
| CA-11 | T19 | `npx playwright test e2e/purchase.spec.ts` |

## Bloque 0 · Infraestructura de pruebas y línea base

- [x] T1 · Línea base de peso y de avisos (RN-8, CA-9)
  - Archivos: specs/012-consumer-mobile-responsive/baseline.md
  - Hacer: antes de tocar código, `npm run build` (con las variables ficticias) y copiar la columna
    "First Load JS" de las 30 rutas del alcance; anotar el conteo de avisos que da `npm run lint`
    y el valor de `.lint-max-warnings`.
  - Verificar: el archivo tiene 30 filas y el conteo de avisos coincide con `.lint-max-warnings`
    (hoy 360) o explica la diferencia.
  - Hecho: `baseline.md` con las 30 rutas (Size y First Load JS antes; columna "después" en blanco para T26). `npm run lint`: 360 avisos = `.lint-max-warnings` (360).

- [x] T2 · Analizador estático de JSX interactivo (CA-3, CA-4)
  - Archivos: __tests__/ui/jsxInteractive.ts, __tests__/ui/jsxInteractive.test.ts
  - Test primero: __tests__/ui/jsxInteractive.test.ts con fragmentos TSX en cadenas. Casos:
    `<button>` sin `onClick` → violación; con `type="submit"`, con `disabled` o con `{...props}` →
    no; `onClick={() => {}}` y `onClick={() => null}` → violación; `<motion.button>` igual que
    `<button>`; `<a href="#">`, `<Link href="">` y `<a>` sin `href` → violación; `href="#rifas"` →
    no; `<Link><button/></Link>`, `<a><span><button/></span></a>` y `<button><Link/></button>` →
    violación de anidación; un `<button>` hermano de un `<Link>` → no. Cada violación trae archivo,
    línea, regla y texto. Debe fallar antes: el módulo no existe.
  - Hacer: función pura `scanJsx(fileName, sourceText)` con `typescript` (`createSourceFile` en modo
    TSX), sin leer disco.
  - Verificar: npx vitest run __tests__/ui/jsxInteractive.test.ts && npx tsc --noEmit
  - Hecho: `scanJsx` con reglas `dead-button`, `empty-onclick`, `dead-link`, `button-in-link` y `link-in-button`; 17 casos en verde. Visto en rojo antes (módulo inexistente). Nota: un botón dentro de un enlace se reporta solo como `button-in-link` (no también como `dead-button`), como pide `plan.md` 2.3; sin texto visible, `text` usa `aria-label` o la etiqueta con atributos literales sin clases.

- [x] T3 · Prueba del alcance con pendientes que solo bajan (CA-3, CA-4, CA-9)
  - Archivos: __tests__/ui/consumerScope.ts, __tests__/ui/consumerInteractive.test.ts
  - Test primero: consumerInteractive.test.ts. (1) El alcance calculado incluye al menos las 30
    páginas y `NavBar.tsx`, `NavBarNoAuth.tsx`, `Footer.tsx`, `RaffleDetail.tsx`, `PlanCard.tsx`,
    `RechargeCard.tsx`, `Sidebar.tsx`, `HomePage.tsx`, y no incluye nada de
    `src/app/{admin,commercial,compliance,game-designer}`. (2) Las violaciones de `scanJsx` sobre el
    alcance son exactamente `KNOWN_VIOLATIONS` (las de `plan.md` 2.3 A, B y D, por archivo, regla y
    texto, sin número de línea para que no se rompa al editar): falla con "violación nueva" o con
    "ya no existe, quítala de la lista". Debe fallar antes: agregar a mano un `<button>` sin acción
    en `Footer.tsx` → rojo; quitar una entrada de la lista → rojo.
  - Hacer: `consumerScope.ts` sigue imports `@/` y relativos desde las `page.tsx`/`layout.tsx` de
    `src/app/(consumer)`, `src/app/(auth)/{login,register,verify}`, `src/app/page.tsx` y
    `src/app/layout.tsx`.
  - Verificar: npx vitest run __tests__/ui && npm test
  - Hecho: el alcance calcula 115 archivos `.tsx` (30 páginas, sin nada de otros roles) y las violaciones son exactamente las 24 de `plan.md` 2.3 A, B y D. Rojo comprobado a mano: un `<button>` agregado a `Footer.tsx` ("violación nueva") y una entrada quitada de la lista ("ya no existe"). Ambos cambios deshechos.

- [x] T4 · Playwright como dependencia de desarrollo [espera D-1]
  - Archivos: package.json, package-lock.json, .gitignore
  - Hacer: `npm install --save-dev --save-exact @playwright/test@1.64.1`; scripts
    `"build:e2e": "node e2e/support/build.mjs"` y `"test:e2e": "playwright test"`; ignorar
    `/playwright-report`, `/test-results`, `/blob-report`; `npx playwright install chromium`.
  - Verificar: `npm ls @playwright/test` da 1.64.1; `npm run audit:ci` sale 0 con la misma salida
    que antes de instalar (es `--omit=dev`); npm ci && npm test
  - Hecho: `@playwright/test` 1.64.1 exacto, scripts `build:e2e`/`test:e2e`, `.gitignore`, Chromium instalado, `npm ci` OK. Nota: `npm run audit:ci` sale 1 ANTES y DESPUÉS con la misma salida (avisos sin excepción de `follow-redirects`, `next` y `zod`, ajenos a esta spec); no se agregó ninguna excepción. npm también reescribió flags `dev`/`devOptional` de 3 paquetes en el lockfile.

- [x] T5 · API simulada en loopback y fixtures (CA-1)
  - Archivos: e2e/support/mockRoutes.mjs, e2e/support/mockApi.mjs, e2e/fixtures/api/**,
    e2e/fixtures/pet-game.html, __tests__/e2e-support/mockApi.test.ts
  - Test primero: __tests__/e2e-support/mockApi.test.ts sobre la función pura de `mockRoutes.mjs`:
    coincide método + ruta con segmentos variables (`/api/raffles/:id`); query ignorada salvo que el
    fixture la pida; ruta sin fixture → 404 y queda registrada; preflight `OPTIONS` → 204 con
    `Access-Control-Allow-Origin: http://127.0.0.1:3100` y `Allow-Credentials: true`; id `999` en
    rutas de detalle → 500; SSE de notificaciones → 204; `/ws/**` → 404; `/pet-game-stub` → el
    HTML de relleno. Debe fallar antes: el módulo no existe.
  - Hacer: fixtures de los `GET` que piden al cargar las 30 páginas y la barra (perfil, nivel,
    notificaciones, carrito, etc.) y de `POST /pet/session/init` (con `url` que trae
    `session_token` y `user_hash` ficticios), armados desde los tipos de `src/types` y los servicios.
    Datos ficticios (`consumidor@example.test`, documento `1000000000`), imágenes de `public/`.
    Endpoint de control `GET /__unmatched` que devuelve y vacía el registro.
  - Verificar: npx vitest run __tests__/e2e-support && npx tsc --noEmit
  - Hecho: `mockRoutes.mjs` (enrutador puro + tabla de ~50 rutas), `mockApi.mjs`, 46 fixtures, `pet-game.html`; 20 pruebas en verde (vistas en rojo antes: módulo inexistente). Desviaciones: `/__unmatched?test=<id>` filtra por la cabecera `x-e2e-test` (con 2 workers cada prueba mira solo lo suyo; sin parámetro devuelve y vacía todo), y entre varias rutas coincidentes gana la de menos segmentos variables. Fixtures armados desde los tipos de `src/types` y verificados cargando las 30 páginas.

- [x] T6 · Configuración de Playwright, sesión y red cerrada (CA-1, CA-7) [espera D-1, D-3]
  - Archivos: playwright.config.ts, e2e/support/build.mjs, e2e/support/serve.mjs,
    e2e/support/session.ts, e2e/support/network.ts, e2e/support/pages.ts
  - Hacer: proyectos `mobile-360` (360×740, `isMobile`, `hasTouch`), `mobile-390` (390×844, igual),
    `tablet-768` (768×1024, `hasTouch`), todos Chromium; `desktop-1280` solo si D-4, con
    `grepInvert` en CI; `webServer` con el mock (4010) y `serve.mjs` (3100), `timeout` 120 s;
    `retries: process.env.CI ? 1 : 0`, `workers: 2`, `trace: 'retain-on-failure'`.
    `build.mjs` corre `next build` con las variables de `plan.md` 7.2. `serve.mjs` copia
    `.next/static` y `public` a `.next/standalone` y arranca `server.js` con `NEXTAUTH_SECRET` =
    `TEST_SECRET` (importado de `__tests__/middleware/session.ts`), `NEXTAUTH_URL`, `API_URL` y sin
    `MIDDLEWARE`. `session.ts`: cookie `next-auth.session-token` con `role: 'ROLE_CONSUMER'` (y
    parámetro de rol para D-4), `accessTokenExpires` a un año, `accessToken` = JWT falso con `exp`
    lejano. `network.ts`: fixture que aborta todo host distinto de `127.0.0.1` y cierra WebSocket
    con `routeWebSocket`, y al terminar cada prueba falla si `/__unmatched` no está vacío.
    `pages.ts`: las 30 rutas con su URL de prueba (`/raffles/1`, `/products/1`, `/commercial/<id
    del fixture>`, `/purchases/1/confirmation`, `/games/play?url=<stub>`, `/verify?email=<ficticio>`,
    etc.), si llevan sesión y qué endpoint poner en 500 para el estado de error.
  - Verificar: npm run build:e2e && npx playwright test --list (lista las pruebas sin error);
    una prueba humo que abre `/login` y `/home` y ve el nombre del consumidor del fixture en la barra.
  - Comprobar: con la red del equipo apagada, `npx playwright test -g humo` pasa igual.
  - Hecho: `playwright.config.ts` (mobile-360/390, tablet-768, desktop-1280 con `grepInvert` en CI), `build.mjs`, `serve.mjs`, `session.ts`, `network.ts`, `pages.ts` y `smoke.spec.ts` (humo: /login, /home con nombre del fixture, y las 30 páginas sin pedidos sin fixture). Desviaciones: `NEXTAUTH_SECRET` llega a `serve.mjs` por `webServer.env` desde `playwright.config.ts` (que importa `TEST_SECRET`), para no importar `.ts` desde `.mjs`; el `exp` del JWT falso es de 7 días (no "lejano": `usePetSession` programa un `setTimeout` al 80 % y un plazo > 24 días lo dispara al instante), mientras `accessTokenExpires` de la cookie es de un año. Comprobado: quitando un fixture la prueba falla nombrando la ruta; con `sandbox-exec` que niega toda red salvo loopback, `-g humo` pasa igual.

- [x] T7 · Pruebas de navegador de diseño y áreas táctiles, con pendientes (CA-1, CA-2, CA-4)
  - Archivos: e2e/layout.spec.ts, e2e/touch.spec.ts, e2e/support/pending.ts
  - Test primero: las dos especificaciones como en `plan.md` 7.3. Primera corrida sin
    `pending.ts`: anotar qué páginas fallan en cada prueba y viewport, y pasarlas a `pending.ts`
    (marcadas `test.fail()`). Debe fallar antes: `NavBarNoAuth` hoy oculta "Iniciar sesión" pero
    mide 40 px de alto el de "Crear Cuenta"; `/` a 360 debe salir en `touch.spec.ts`; agregar a mano
    `w-[500px]` a un `div` de `/home` → `layout.spec.ts` rojo a 360 con el selector del `div`.
  - Verificar: npm run build:e2e && npm run test:e2e (verde con los pendientes); anotar el tiempo.
  - Hecho: `layout.spec.ts`, `touch.spec.ts`, `measure.ts`, `pending.ts`. Primera corrida: 0 fallos de desborde en 360/390/768 ni en el estado de error de 19 páginas; fallan CA-4 en el DOM en 27 páginas (todas las de barra del consumidor y `/`) y CA-2 en las 30 a 360. Ojo: en emulación móvil `innerWidth` se ensancha con el contenido, así que el ancho visible se mide con `documentElement.clientWidth`; comprobado con un `w-[500px]` agregado a un `h2` de /home (rojo con el selector del `h2`, deshecho). Un `w-[500px]` dentro del hero de /home no desborda el documento (el hero recorta). Pendiente falso verificado ("Expected to fail, but passed"). `npm run test:e2e` en verde; 2 min 45 s tras un `build:e2e` de 24 s (en local, con caché).

- [x] T8 · Job del CI [espera D-2]
  - Archivos: .github/workflows/ci.yml
  - Hacer: el job de `plan.md` 12 (opción a) o los pasos dentro de `Pruebas` (opción b). No cambiar
    los nombres de los tres jobs existentes. Actualizar el comentario de la cabecera que lista los
    checks obligatorios.
  - Verificar: sin herramientas nuevas para validar YAML; `git diff .github/workflows/ci.yml`
    muestra solo el bloque nuevo y los tres `name:` existentes intactos. La prueba real es el PR:
    el job corre, pasa y tarda menos de 10 min (el usuario lo confirma en U-2).
  - Hecho: job `e2e` "Pruebas en navegador" (plan 12 a), cabecera actualizada; los tres `name:` existentes intactos (YAML parseado: 4 jobs). Pendiente: la prueba real es el PR (U-2) y que Miguel lo agregue a la protección (M-1).

- [x] T9 · Capturas de escritorio de referencia, antes de tocar compartidos (CA-8) [espera D-4]
  - Archivos: e2e/desktop.spec.ts, e2e/desktop.spec.ts-snapshots/*
  - Hacer: proyecto `desktop-1280` (1280×800) con las páginas de `plan.md` 7.4; las de otros roles
    con la cookie del rol (`ROLE_COMMERCIAL`, `ROLE_ADMIN`, `ROLE_GAME_DESIGNER`) y fixtures de sus
    `GET` de carga. `toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: 0.001, animations:
    'disabled' })`. Generar con `--update-snapshots` sobre el código sin cambios.
  - Verificar: npx playwright test --project=desktop-1280 (verde dos veces seguidas: estable).
  - Hecho: `desktop.spec.ts` con 10 páginas (5 de consumidor, `/commercial/support`, `/commercial/allies/<id>`, `/commercial/products/1`, `/admin`, `/game-designer`) y 10 capturas; verde 3 veces seguidas sin `--update-snapshots`. Desviaciones: `/products` se captura sin `fullPage` (la captura completa agranda la ventana, dispara otra carga del scroll infinito y la captura cambia entre corridas) y las páginas de admin usan una espera de red acotada (precargan las vecinas y la red nunca queda inactiva).

- [x] T10 · Enmienda de P-13 y `CLAUDE.md` [espera D-3]
  - Archivos: docs/constitution.md, CLAUDE.md
  - Hacer: el texto de `plan.md` 13. Antes de citar la URL de la guía de Playwright de Next 15,
    comprobar que existe y dice lo que se afirma; si no, citar solo la de Playwright.
  - Verificar: `grep -n "e2e/" docs/constitution.md CLAUDE.md` muestra la regla y los comandos;
    los ids P-n no cambian (`grep -c "^### P-" docs/constitution.md` sigue en 20).
  - Hecho: P-13 enmendada con el texto de `plan.md` 13 (URL de la guía de Next 15 comprobada el 2026-10-23: existe y recomienda probar contra producción y usar `webServer`), ids intactos (20 `### P-`); `CLAUDE.md` con requisitos, comandos, cuarto check y nota de red.

## Bloque 1 · Barras, layout y componentes compartidos

- [x] T11 · Barra sin sesión (fila 15, CA-5, CA-4, CA-2)
  - Archivos: src/components/bars/NavBarNoAuth.tsx, __tests__/ui/consumerInteractive.test.ts,
    e2e/support/pending.ts
  - Hacer: "Iniciar Sesión" visible en todos los anchos; los dos `Link` con las clases del botón
    (sin `<button>` dentro), `min-h-11`, `active:` visible. A 360 caben logo y los dos enlaces
    (reducir `px` en celular, no el texto). Sacar sus dos entradas de `KNOWN_VIOLATIONS`.
  - Verificar: npx vitest run __tests__/ui && E2E de la página `/`
  - Comprobar: en `/` a 360 px (DevTools, iPhone SE) se ven "Iniciar Sesión" y "Crear Cuenta" sin
    abrir nada; a 1280 px la barra se ve igual que antes.
  - Hecho: `NavBarNoAuth` con dos `Link` con las clases del botón (`min-h-11`, `active:`), "Iniciar Sesión" visible en todos los anchos; a 360 caben logo y los dos enlaces (`px-3` en celular, `sm:px-6`; el alto vuelve a 40 px desde `md:`). Salen 2 entradas de `KNOWN_VIOLATIONS`. `/` sigue en `pending.ts` solo por los puntos del carrusel (T24).

- [x] T12 · Barra del consumidor (CA-4, CA-2; N-3 y N-6) [N-3 espera D-10; N-6 espera D-13]
  - Archivos: src/components/bars/NavBar.tsx
  - Hacer: en escritorio, cada `Link` lleva las clases de `getNavClass` y el `title`, sin
    `<button>` dentro (mismo aspecto). En celular: los 6 botones de la barra inferior con área ≥ 44 ×
    44; el desplegable de llaves cabe a 360; los ítems del menú de perfil ya miden 56 px. Aplicar
    D-10 a "Mis compras" y D-13 al menú. Sacar la entrada de `KNOWN_VIOLATIONS`.
  - Verificar: npx vitest run __tests__/ui && E2E de `/home` (la barra sale en todas las páginas
    con sesión: revisar que no aparezcan fallos nuevos en otras)
  - Comprobar: a 360 px en `/home`, tocar "Perfil": el menú sube, "Mis compras" lleva a donde dice
    D-10; a 1280 px la barra superior se ve igual que antes (comparar con la captura de T9).
  - Hecho: en escritorio cada ítem es un `Link` con las clases de `getNavClass` y el `title` (la captura de la barra a 1280 px no cambió). En celular: cajón de llaves con `invisible` al cerrarse y alto acotado (`max-h-[calc(100dvh-9rem)]`), barra inferior con `active:`, y el menú de perfil con D-10 ("Mis compras" -> `/explore/purchases`) y D-13 (se agregan favoritos, participaciones, juegos, encuestas, recargas y foro; el menú se desplaza con `max-h-[90dvh]`), ahora como lista `mobileMenuItems`. Sale 1 entrada de `KNOWN_VIOLATIONS`. Campana y carrito de la barra: 44 px en celular (`lg:` restaura). Panel de notificaciones abierto en la captura de `/home` y `/products` a 360: no era un fallo de la app sino el panel cerrado, que quedaba como hoja fija trasladada justo bajo la primera pantalla y `fullPage` la capturaba; ahora los paneles cerrados del celular son `invisible` (con transición de `visibility`, sin cambiar la animación) y desaparecen de la captura y del orden de tabulación. Antes también contaban para la prueba táctil.

- [x] T13 · Pie de página (P-7, CA-2; N-5) [N-5 espera D-12]
  - Archivos: src/components/Footer.tsx (y `src/app/page.tsx`, `forgot-password/page.tsx`,
    `unlock-account/page.tsx` solo si D-12 pide pasar una prop)
  - Hacer: `<a href>` internos → `Link`; enlaces con `py` para 44 px en celular y el mismo aspecto
    desde `md:`; aplicar D-12.
  - Verificar: npx vitest run __tests__/ui && E2E de `/` y `/home` && npx playwright test
    --project=desktop-1280 -g "home"
  - Comprobar: en `/` a 360 px, sin sesión, los enlaces del pie hacen lo que decidió D-12.
  - Hecho: `Footer` con `Link` en todos los enlaces internos, `py-3`/`min-h-11` en celular y el mismo aspecto desde `md:`; prop `guest` (D-12): oculta los enlaces que piden sesión y se pasa en `/`, `/login`, `/register`, `/verify`, `/forgot-password` y `/unlock-account`; el teléfono se quitó en todas. Nota: la captura de escritorio `consumer-home` se regeneró con `--update-snapshots` porque el pie perdió la línea del teléfono (decisión D-12); la barra y el resto no cambian. Tocó una línea (`<Footer guest />`) en las páginas de login, register y verify (T23 no necesita repetirla).

- [x] T14 · Compartidos con otros roles (RN-6, CA-8, CA-1, CA-2)
  - Archivos: src/components/notifications/NotificationsPanel.tsx, src/components/pqrs/*,
    src/components/shared/CommercialStorefrontView.tsx, src/components/shared/products/*,
    src/components/consumer/products/InfiniteScroll.tsx, SearchBar.tsx,
    src/components/LoadingSpinner.tsx (solo los que marque `pending.ts` o la revisión a 360)
  - Hacer: arreglos de celular con la regla de 7.4 (`lg:` restaura escritorio). El panel de
    notificaciones a 360 ocupa el ancho disponible sin salirse.
  - Verificar: E2E de `/home`, `/support`, `/products/1`, `/commercial/<id>`, `/products` &&
    npx playwright test --project=desktop-1280 (todas las capturas iguales, incluidas las de
    comercial, admin y diseñador)
  - Comprobar: a 1280 px, `/commercial/support` y la campana de `/admin` se ven igual que antes.
  - Hecho: `NotificationsPanel` (campana y cerrar de 44 px en celular con `lg:` que restaura, `aria-label`, hojas cerradas `invisible`, `pb-16` para que la barra inferior no tape la última notificación), `CommercialStorefrontView` ("Volver"), `ProductInfoCard` (enlace del comercial), `SearchBar` (campo y botón, letra de 16 px en celular). `InfiniteScroll`, `LoadingSpinner` y `ProductImageGallery` no marcaron nada. `src/components/pqrs/*` ("Nueva solicitud" 173x40) se deja para T21 como dice esa tarea. Capturas de escritorio de comercial, admin y diseñador iguales (3 corridas seguidas; una corrida suelta de `consumer-products` falló una vez y no se repitió: ese scroll infinito ya era inestable).

- [x] T15 · Carrito y avisos globales (CA-1, CA-2)
  - Archivos: src/components/consumer/cart/CartDrawer.tsx, CartButton.tsx, CartItem.tsx,
    src/components/levels/XpRewardToast.tsx
  - Hacer: el cajón del carrito ocupa el ancho a 360 y sus botones (cerrar, cantidad, quitar) miden
    44 px; el aviso de XP cabe. `CartDrawer` está en el layout raíz: con el carrito cerrado no debe
    afectar a otros roles.
  - Verificar: E2E de `/products` y una prueba en `layout.spec.ts` que abre el carrito a 360.
  - Comprobar: a 360 px en `/products`, agregar un producto y abrir el carrito: todo cabe.
  - Hecho: `CartButton`, cabecera, vacío y pie de `CartDrawer`, y botones de `CartItem` a 44 px en celular (`lg:` restaura). Ya ocupaba el ancho a 360 (`w-full max-w-md`). `XpRewardToast` ya cabe (`min(360px, 100vw - 24px)`, no interactivo): sin cambios. Prueba nueva en `layout.spec.ts` ("carrito abierto a 360 px": siembra `shopping_cart`, abre el cajón y mide que cabe y que sus botones miden 44).

- [x] T16 · Layout del consumidor y `/home` (CA-1, CA-7)
  - Archivos: src/app/(consumer)/layout.tsx, src/app/(consumer)/home/page.tsx
  - Hacer: quitar el `;` suelto de `/home`; el `main` reserva el alto de la barra inferior fija
    (`pb-16` + `env(safe-area-inset-bottom)`) y deja a sus hijos un alto definido (`min-h-0`, flex)
    para que `/pet` llene sin scroll. Sin `'use client'` (P-2).
  - Verificar: E2E de `/home` y `npx playwright test e2e/pet.spec.ts` si ya existe; npx tsc --noEmit
  - Comprobar: en `/home` a 360 px no aparece un `;` entre el contenido y el pie, y el pie no queda
    tapado por la barra inferior.
  - Hecho: `;` suelto de `/home` quitado; `main` reserva `calc(4rem + env(safe-area-inset-bottom))` en celular. Desviación: no se convirtió `main` en `flex` ni se le puso `min-h-0` (el fondo gris de `main` se cortaría en páginas largas, y los márgenes de los hijos dejarían de colapsar); `/pet` ya llena el alto con `h-full` sobre `flex-1` y se comprobó: documento 740x740 en vertical y 360x360 en horizontal, sin scroll. T25 lo vuelve a comprobar.

## Bloque 2 · Páginas del consumidor

Cada tarea: arreglar lo que marquen `layout.spec.ts`, `touch.spec.ts` (y el estado de error a 360)
para sus páginas, quitar `<img>` → `next/image` donde aplique (`plan.md` 8, RN-8) bajando
`.lint-max-warnings`, sacar sus páginas de `pending.ts` y sus entradas de `KNOWN_VIOLATIONS`.

- [x] T17 · Inicio y anuncios: `/home`, `/ads` (fila 14, N-2, CA-3, CA-4) [N-2 espera D-9]
  - Archivos: src/components/consumer/home/HomePage.tsx, src/components/consumer/ads/Sidebar.tsx,
    VideoAdPlayer.tsx, VideoControls.tsx, src/app/(consumer)/ads/page.tsx
  - Hacer: 4 `Link` con `<button>` dentro → `Link` con estilo de botón; quitar el bloque "Síguenos"
    (fila 14); aplicar D-9 a la tarjeta de app; controles de video de 44 px.
  - Verificar: npx vitest run __tests__/ui && E2E de `/home` y `/ads`
  - Comprobar: a 360 px en `/ads`, se ve y controla el video; no hay íconos de redes.
  - Hecho: 4 `Link` de `HomePage` con las clases del botón (`min-h-11`, `active:`); `Sidebar` sin el bloque "Síguenos" (fila 14) ni la tarjeta de App Store / Google Play (D-9), con cerrar de 44 px; controles de video y "Ver más" de 44 px. Salen 7 entradas de `KNOWN_VIOLATIONS` (4 de `HomePage`, 3 de `Sidebar`). `/home` y `/ads` salen de `pending.ts` (nested).

- [x] T18 · Rifas: `/raffles`, `/raffles/[id]`, `/raffles/[id]/live`, `/raffles/[id]/results` (fila 1)
  - Archivos: src/app/(consumer)/raffles/**, src/components/consumer/raffles/** (incluye `draw/*` y
    `ClaimPrizeModal.tsx`)
  - Hacer: quitar "Participar ahora" de `RaffleDetail` (sin dejar un hueco raro); modales de
    `results` con botón de cerrar de 44 px; `ClaimPrizeModal`: teléfono `type="tel"`,
    `inputMode="tel"`, correo `type="email"`, OTP `inputMode="numeric"`, letra 16 px en celular.
    Averiguar si `RaffleLiveClient` puede arrancar en otro estado según la respuesta del servidor
    (para probar `draw/*`); si no, quedan para la pasada manual.
  - Verificar: npx vitest run __tests__/ui && E2E de las 4 rutas
  - Comprobar: a 360 px en `/raffles/1` no aparece "Participar ahora" y el resto del detalle cabe.
  - Hecho: "Participar ahora" quitado de `RaffleDetail` (fila 1; sin hueco: el bloque contenedor queda con la barra de progreso); cerrar/ampliar de `results`, de `LiveRafflesCarousel` y del modal de reclamo a 44 px; `ClaimPrizeModal` con `inputMode`/`autoComplete` (correo, teléfono, OTP `one-time-code`) y 16 px en celular; paginador, filtros, "Ver" y "Ver detalles" a 44 px; puntos del carrusel de premios de `WaitingRoomScreen` con área de 44 px. Nota: `RaffleLiveClient` no arranca en otro estado según la respuesta del servidor con el fixture actual, así que `draw/*` (salvo `WaitingRoomScreen`, que se ve) queda para la pasada manual (U-3).

- [x] T19 · Tienda: `/products`, `/products/[id]`, `/commercial/[id]`, `/checkout`,
  `/purchases/[id]/confirmation` (CA-4, CA-6)
  - Archivos: las 5 páginas, src/components/consumer/products/ConsumerProductCard.tsx,
    AddToCartButton.tsx, ProductDetailConsumer.tsx (los compartidos de `shared/products` ya en T14)
  - Hacer: "Explorar productos" del checkout sin `<button>` dentro del `Link`; tarjeta de producto
    navega con `Link` y la acción de agregar queda en su `<button>` (RN-5); campos del checkout con
    su `type`/`inputMode`/`autoComplete` y 16 px.
  - Test primero (CA-6): e2e/forms.spec.ts con el caso del checkout. Debe fallar antes: hoy un
    campo del checkout es `text-sm` (14 px).
  - Verificar: npx vitest run __tests__/ui && E2E de las 5 rutas && npx playwright test
    e2e/forms.spec.ts -g checkout
  - Comprobar: a 360 px, de `/products` a un producto, al carrito y al checkout sin scroll lateral.
  - Hecho: CA-11 arreglado (`useParams().id`; prueba `e2e/purchase.spec.ts`, vista en rojo antes: no hay pedido a `GET /purchases/1`, y en verde después); sus botones de acción pasan a `Link`. "Explorar productos" del checkout sin `<button>` en el `Link`, campos con `inputMode`/`autoComplete` y 16 px (`e2e/forms.spec.ts -g checkout`, visto en rojo con la letra a 14 px). `ConsumerProductCard` navega con un `Link` extendido (enlace vacío con `aria-label` sobre toda la tarjeta; favorito, comercio y agregar quedan por encima, el comercio ahora es `Link`); el rango y la cantidad de `/products/[id]` y los chips, filtros y estrellas de valoración de `/products` a 44 px (estrellas como `button` con `aria-label`). Salen 1 entrada de `KNOWN_VIOLATIONS` (checkout). Los `<img>` de `checkout` (2) y de la confirmación (1) pasan a `next/image`.

- [x] T20 · Explorar: `favorites`, `gamification`, `participations`, `profile`, `profile/edit`,
  `purchases`, `referrals`, `transactions` (CA-4, CA-6)
  - Archivos: src/app/(consumer)/explore/**, src/components/purchases/**,
    src/components/referrals/**, src/components/transactions/**, src/components/reviews/**,
    src/components/consumer/profile/AvatarPickerModal.tsx, src/components/AvatarSelector.tsx
  - Hacer: "Explorar productos" de favoritos sin `<button>` en el `Link`; modal de participaciones
    con cerrar de 44 px; filtros de transacciones que quepan a 360; `profile/edit` con `type`,
    `inputMode` y 16 px (ya usa react-hook-form: no se cambia su esquema).
  - Test primero (CA-6): caso de `profile/edit` en e2e/forms.spec.ts.
  - Verificar: npx vitest run __tests__/ui && E2E de las 8 rutas && npx playwright test
    e2e/forms.spec.ts -g perfil
  - Hecho: "Explorar productos" de favoritos sin `<button>` en el `Link`; modal de boletos, pestañas, filtros y botones de participaciones a 44 px; `profile/edit` con `type="tel"`/`inputMode`/`autoComplete` y 16 px (`e2e/forms.spec.ts -g perfil`, visto en rojo antes); filtros y paginador de transacciones, botones de compras (reseña, reporte, código) y modales de compras y reseñas a 44 px y 16 px. Salen 1 entrada de `KNOWN_VIOLATIONS`. Nota: el avatar de `profile/edit` se queda en `<img>` (host no controlado).

- [x] T21 · Juegos, encuestas, foro y soporte: `/games`, `/games/play`, `/surveys`, `/forum`,
  `/support` (CA-6)
  - Archivos: las 5 páginas, src/components/consumer/games/**, src/components/consumer/surveys/**,
    src/components/consumer/forum/CharityPost.tsx, src/components/pqrs/** (con la regla de 7.4: los
    usa `/commercial/support`)
  - Hacer: `GameCard` con su acción en `<button>`/`Link`; el botón grande de `/games` (`px-14`)
    cabe a 360; en `/games/play` los botones fijos no tapan la barra inferior; respuestas de
    encuesta de 44 px; `CreatePqrsModal` y `RefundBankDetailsForm` con `inputMode="numeric"` en
    cuenta y documento y 16 px en celular, sin registrar sus valores en ningún lado.
  - Test primero (CA-6): caso de soporte en e2e/forms.spec.ts.
  - Verificar: E2E de las 5 rutas && npx playwright test e2e/forms.spec.ts -g soporte &&
    npx playwright test --project=desktop-1280 -g commercial/support
  - Hecho: `GameCard` pasa a `<button type="button">` (o `div` informativo si no es seleccionable) y a `next/image`; botón grande de `/games` con `px-6 sm:px-14`; en `/games/play` los botones fijos de 44 px quedan sobre la barra inferior (`bottom-[calc(5rem+env(safe-area-inset-bottom))]`); "Ver encuesta", "Nueva solicitud", `CreatePqrsModal` y `RefundBankDetailsForm` (`inputMode="numeric"` en cuenta y documento, 16 px, sin registrar valores) con la regla de 7.4 (`lg:` restaura; las capturas de `/commercial/support` no cambian). Prueba `e2e/forms.spec.ts -g soporte` vista en rojo antes. Nota: `RefundBankDetailsForm` solo aparece en el detalle de una solicitud de reembolso, que no tiene fixture: queda para la pasada manual. `CharityPost` no marcó nada.

- [x] T22 · Planes móviles: `/plans/mobile-plans` (filas 10-13, CA-3)
  - Archivos: src/app/(consumer)/plans/mobile-plans/page.tsx, src/components/plans/PlanCard.tsx,
    RechargeCard.tsx
  - Hacer: borrar el bloque comentado de "Llamar Ahora"/"Chat en Vivo" y los imports que queden sin
    uso; "Contratar Plan" y "Recargar Ahora" pasan a "Próximamente", `disabled`, `aria-disabled`,
    colores apagados, sin `hover:`/`cursor-pointer`; tarjeta de operador como
    `<button type="button">` con el mismo aspecto. Sacar sus entradas de `KNOWN_VIOLATIONS`.
  - Verificar: npx vitest run __tests__/ui && E2E de `/plans/mobile-plans`
  - Comprobar: a 360 px, las tarjetas dicen "Próximamente", no responden al toque y no parecen
    tocables.
  - Hecho: bloque comentado de "Llamar Ahora"/"Chat en Vivo" borrado con los imports sin uso (`Phone`, `MessageSquare`, `Wifi`, `Star`, `Clock`, `ShoppingCart`); "Contratar Plan" y "Recargar Ahora" pasan a "Próximamente" (`disabled`, `aria-disabled`, apagados, `cursor-default`); filtros a 44 px y 16 px. Salen 2 entradas de `KNOWN_VIOLATIONS`. Nota: la tarjeta de operador con `onClick` en un `div` está dentro de un bloque ya comentado (`Sección informativa`), no se renderiza, así que no hay nada que convertir en `<button>`; el bloque comentado se dejó como estaba.

- [x] T23 · Acceso: `/login`, `/register`, `/verify` (N-4, CA-6, P-7) [N-4 espera D-11]
  - Archivos: src/app/(auth)/login/page.tsx, src/app/(auth)/register/page.tsx,
    src/app/(auth)/verify/page.tsx, src/components/auth/LoginForm.tsx, RegisterForm.tsx,
    VerificationForm.tsx, RecaptchaProvider.tsx (solo si R-5 lo exige en la prueba, no en la app)
  - Test primero (CA-6): casos de login, registro y verificación en e2e/forms.spec.ts: correo con
    `type="email"`, teléfono `type="tel"`, cédula y código `inputMode="numeric"`, código con
    `autoComplete="one-time-code"`, todos con `font-size` ≥ 16 px a 360.
  - Hacer: lo anterior; botón de mostrar contraseña con `aria-label` y 44 px; `<a href>` internos →
    `Link`; aplicar D-11 a "Privacidad" y "Ayuda". Sin tocar el `?email=` (deuda P-16 (d)).
  - Verificar: npx vitest run __tests__/ui && E2E de las 3 rutas && npx playwright test
    e2e/forms.spec.ts
  - Comprobar: a 360 px en `/register`, se llega al final del formulario sin scroll lateral; el
    reCAPTCHA de Google no carga en la prueba y la página pinta igual.
  - Hecho: `LoginForm` (identificador con `inputMode="email"`, 16 px, mostrar contraseña de 44 px, enlaces de 44 px), `RegisterForm` (16 px, `autoComplete` por campo, `inputMode="numeric"` en el documento salvo pasaporte, `next/link`, chips y botones de 44 px), `VerificationForm` (botones de 44 px) y las páginas de `login` (D-11: "Privacidad" y "Ayuda" ocultos, "Términos" con `Link`) y `verify`. `<Footer guest />` de T13 intacto. `e2e/forms.spec.ts` (login, registro, verificación, perfil, checkout, soporte) visto en rojo antes (login, registro, perfil, soporte; checkout con la letra a 14 px). No se tocó el `?email=`. Nota: el enlace "Términos y Condiciones" dentro de la casilla de aceptación mide 44 px de alto con `inline-flex`.

## Bloque 3 · Landing

- [x] T24 · Landing `/` (filas 2-9, N-1, CA-3, CA-5, RN-8) [N-1 espera D-8]
  - Archivos: src/app/page.tsx, e2e/rn4.spec.ts
  - Test primero: e2e/rn4.spec.ts a 360 sin sesión: "Empezar Ahora" y "Crear Cuenta Gratis" →
    `/register`; "Participar Ahora", "Ver Todas las Rifas", "Agregar al Carrito", "Ver Toda la
    Tienda" → `/login`; "Ver Rifas Activas" → la sección `#rifas` queda en pantalla y la URL sigue
    en `/`; "Descargar App" no existe; "Empezar a Referir" según D-8; CA-5 (enlace "Iniciar sesión"
    visible y lleva a `/login`). Con sesión: fila 1 ("Participar ahora" no existe en `/raffles/1`),
    filas 10, 11 y 14 (no existen), 12 y 13 ("Próximamente", `disabled`), N-2 a N-4 según D-9 a
    D-11. Debe fallar antes: los botones de la landing no navegan.
  - Hacer: los 7 botones "Conectar" pasan a `Link` con las mismas clases y textos; quitar
    "Descargar App"; D-8; puntos del carrusel con área de 44 px y `aria-label` ("Ver testimonio 2");
    los dos `<img>` → `next/image` (imágenes de `public/`) y bajar `.lint-max-warnings`.
  - Verificar: npx vitest run __tests__/ui && npx playwright test e2e/rn4.spec.ts && E2E de `/` &&
    npm run lint:ci
  - Comprobar: a 360 px en `/` sin sesión, tocar "Ver Rifas Activas" baja a las rifas; tocar
    "Participar Ahora" abre `/login`.
  - Hecho: 7 botones "Conectar" a `Link` (con `active:opacity-80`), "Descargar App" quitado, D-8 = `/register`, puntos del carrusel de 44 px con `aria-label` y `aria-current`, `<img>` a `next/image` con `fill` y `sizes`. `e2e/rn4.spec.ts` nuevo (no existía): landing, CA-5 y fila 1; visto en rojo (10 de 12 fallaban) antes del cambio. No se cubren con prueba de navegador las filas 10-14 ni N-2 a N-4 (se hicieron en los bloques 1-2). `.lint-max-warnings` 360 -> 348.

## Bloque 4 · Mascotas

- [x] T25 · `/pet` (RN-7, CA-7) [la variante (b) espera D-7]
  - Archivos: src/components/PetGame.tsx, src/app/(consumer)/pet/page.tsx, e2e/pet.spec.ts
  - Test primero: e2e/pet.spec.ts como en `plan.md` 7.3 (vertical 360×740, horizontal 740×360,
    cargando con respuesta retrasada, error con 500). Primero comprueba con `matchMedia` que
    `(pointer: coarse)` y `(orientation: landscape)` responden como se espera (R-3). Debe fallar
    antes: hoy "Reintentar" mide ~36 px de alto.
  - Hacer: "Reintentar" de 44 px con `active:`; textos de cargando y error con `px` para 360; el
    marco llena el alto que deja el layout (T16) sin scroll; si D-7 = (b), ocultar las barras en
    `/pet` en horizontal táctil solo con CSS (sin `matchMedia` en estado de React, por la nota de
    `RotateHint`).
  - Verificar: npm run build:e2e && npx playwright test e2e/pet.spec.ts && E2E de `/pet`
  - Comprobar: en DevTools con un iPhone en vertical se ve "Gira tu teléfono"; al girar, el juego
    (o su relleno) sin barras de scroll.
  - Hecho: `e2e/pet.spec.ts` nuevo (R-3 con `matchMedia`, vertical, cargando, error, horizontal); solo "Reintentar" fallaba (36 px). `PetGame`: "Reintentar" de 44 px con `type="button"` y `active:`, `px-6` en cargando. D-7 = (a): barras intactas. Confirmado: el marco llena el alto sin scroll en 360x740 y 740x360.

## Bloque 5 · Cierre

- [x] T26 · Peso de las páginas y tope de lint (RN-8, CA-9)
  - Archivos: specs/012-consumer-mobile-responsive/baseline.md
  - Hacer: `npm run build` con las variables ficticias y comparar "First Load JS" de las 30 rutas
    con la línea base de T1; anotar la columna "después". Si una sube, arreglarlo (un import que
    arrastra un módulo de cliente) antes de seguir.
  - Verificar: ninguna ruta sube; `npm run lint:ci` en verde y `.lint-max-warnings` ≤ el de T1.
  - Nota: `baseline.md` tiene la columna "después". Suben 5 rutas, todas explicadas (ver `baseline.md`): `next/image` (RN-8) en `/checkout`, `/games` y la confirmación; `next/link` (RN-5, T19) en `/products`, `/commercial/[id]` y la confirmación. Son chunks que el layout ya carga vía `NavBar`, así que no es peso real descargado. La bajada de `/explore/profile/edit` es de Next 15.5.28. RN-8 ya está precisada en `spec.md`. `lint:ci` en verde con tope 348.

- [x] T27 · Pendientes vacíos (CA-1, CA-2, CA-3, CA-4)
  - Archivos: __tests__/ui/consumerInteractive.test.ts, e2e/support/pending.ts
  - Hacer: `KNOWN_VIOLATIONS` y `pending.ts` quedan vacíos (si queda algo es una tarea sin
    terminar, no se esconde). Quitar el mecanismo de `test.fail()` si ya no hay pendientes.
  - Verificar: npx vitest run __tests__/ui && npm run build:e2e && npm run test:e2e
  - Hecho: `KNOWN_VIOLATIONS` vacío; `e2e/support/pending.ts` borrado junto con el mecanismo `test.fail()` de `layout.spec.ts` y `touch.spec.ts`.

- [x] T28 · Otros roles sin cambios (CA-8, RN-6)
  - Verificar: `git diff --stat main -- src/app/admin src/app/commercial src/app/compliance
    src/app/game-designer src/components/Admin src/components/commercial src/components/compliance
    src/components/game-designer` sale vacío; `npx playwright test --project=desktop-1280` en verde
    sin `--update-snapshots` (si D-4). Si D-4 no se aprobó: abrir a 1280 px `/commercial/support`,
    `/commercial/allies/<id>`, `/commercial/products/<id>`, `/admin` y `/game-designer` antes y
    después y anotar en `review.md` que se ven igual.
  - Hecho: `git diff --stat HEAD` en las carpetas de otros roles sale vacío (esta spec no las tocó). Contra `main` salen 36 archivos, pero son cambios ya commiteados en `beta-front` ajenos a la 012. `desktop-1280` en verde (una corrida suelta falló una vez `consumer-products` por captura y pasó en las cuatro siguientes, ver T30).

- [x] T29 · Lista de comprobación en celulares (CA-6, CA-7, CA-10)
  - Archivos: specs/012-consumer-mobile-responsive/spec.md
  - Hacer: agregar al final de `spec.md` la sección "Resultados de la pasada en celulares" con la
    lista de `plan.md` 17 y la tabla `Página | Android | iPhone | Notas` con las 30 páginas en
    blanco, más una fila de cabecera para modelo y versión de cada equipo.
  - Verificar: la tabla tiene 30 filas y nombra las 30 rutas del alcance.
  - Hecho: sección "Resultados de la pasada en celulares" al final de `spec.md`, con la lista y 30 filas más la fila "Equipo".

- [x] T30 · Puertas completas (CA-9)
  - Verificar, en este orden y con las variables ficticias:
    `npm test && npm run lint:ci && npm run build:e2e && npm run test:e2e && npm run build &&
    npx tsc --noEmit && npm run audit:ci`
  - Hecho: todo en verde (ver el reporte). Nota: `consumer-products` de `desktop-1280` falló 1 vez de 5 corridas (28 702 px de diferencia) y pasó en las otras 4: captura inestable, no se actualizaron capturas.

## Pasos del usuario y de Miguel

- [ ] U-1 · Decidir D-1 a D-13 de `plan.md` 20 (Puerta 2).
- [ ] U-2 · Abrir el PR y confirmar que los checks (incluido "Pruebas en navegador" si D-2 = a)
  pasan y que cada job tarda menos de 10 minutos.
- [ ] M-1 · Si D-2 = (a): Miguel agrega "Pruebas en navegador" a los checks obligatorios de `main`.
- [ ] U-3 · Pasada manual en el Android y el iPhone con la lista de `plan.md` 17; anotar los
  resultados en la tabla de `spec.md` (T29). Un defecto encontrado vuelve como tarea nueva antes
  del cierre.

## Ronda 1 de revisión

- [x] B-1 · Pruebas de comportamiento de RN-4 (CA-3, P-17): `e2e/rn4.spec.ts` suma filas 10-11, 12-13, 14 y N-2 (D-9), N-3 (D-10), D-13, D-12 (con sesión y en las seis páginas sin sesión) y N-4 (D-11). Vistas en rojo por aserción con cada defecto: "Mis compras" a `/purchases` (N-3 y D-13), `Footer` ignorando `guest` (6 pruebas), fila 12 diciendo "Contratar Plan", "Privacidad" a `/privacidad` como `<a>` (N-4). `settle` ahora acota la espera de `networkidle` a 5 s: antes, un enlace a una ruta 404 hacía que la prueba muriera por *timeout* en la espera y no en la aserción.
  - Nota: al escribir N-3 apareció un defecto real de la hoja del menú de perfil del celular: el `mousedown` global de `NavBar` (clic fuera) la cerraba antes del clic y el enlace no navegaba (la prueba con clic real quedó en rojo). Se arregló con una referencia a la hoja en `handleClickOutside` (`src/components/bars/NavBar.tsx`); fuera de lo que listaba `review.md`, pero sin él N-3 y D-13 no funcionan con el puntero.
- [x] B-2 · `aria-label` en español: "Cerrar filtros" (`products/page.tsx`), "Ampliar imagen" (`results/page.tsx`), "Página anterior"/"Página siguiente" (`KeyTransactionList`, `SurveyList`), "Cerrar" (`AvatarPickerModal`, `SurveyPlayerModal` ×2, `PqrsDetailModal`), "Reintentar subida" y "Quitar archivo" (`PqrsEvidenceUploader`).
- [x] B-3 · 44 px en modales y estados de error: `AvatarPickerModal`, `SurveyList` (paginación), `SurveyPlayerModal` (cerrar ×2, "Cancelar", "Iniciar encuesta"), `explore/referrals` ("Reintentar", ya medía 44 px por el texto; se fijó `min-h-11`), `commercial/[id]` ("Volver"). Compartidos con comercial restauran escritorio con `lg:`: `PqrsDetailModal` y `PqrsEvidenceUploader`. `touch.spec.ts` ahora mide los estados de error de las 20 páginas con error y abre tres modales (encuesta, detalle de PQRS, avatar); fixtures nuevos `surveys/detail.json`, `pqrs/detail.json` y sus rutas. Rojo visto con el arreglo deshecho: "Volver" 49x20, "Cerrar" 32x32 y "Cancelar" 102x42 (encuesta), "Cerrar" 20x20 (PQRS) y 28x28 (avatar). No se vio en rojo "Reintentar" de referidos (ya medía 44 px) ni `PqrsEvidenceUploader` ni la paginación de encuestas (sin fixture con archivos ni con más de una página).
- [x] B-4 · `baseline.md` y T26: causa explicada (chunk de `next/link` por `ConsumerProductCard`, ya cargado por el layout; la confirmación suma `next/image` y `next/link`; la bajada de `/explore/profile/edit` es de Next 15.5.28). T26 marcada hecha.
- [x] S-1 · `CLAUDE.md`: quitada la mención a `e2e/support/pending.ts` y "o `CI`" de la detección de CI del lint.
- [x] S-2 · `docs/constitution.md` P-19: cuatro checks, con "Pruebas en navegador" y Miguel agregándolo a la protección de `main`. Solo ese bloque.
- [x] S-3 · `aria-label` del carrito en español (`CartButton`, `CartDrawer`, `CartItem`); `layout.spec.ts` busca "Carrito de compras".
- [x] S-4 · `GameCard.tsx`: `<h3>` y `<div>` dentro del `<button>` pasan a `<span>` con `block` (mismo aspecto).
- [x] S-5 · `desktop.spec.ts`: la captura espera a que las `img` visibles terminen de cargar; ninguna captura regenerada.
- Sin tocar, como se pidió: `inputMode` del login (U-3) y `PurchaseItemsPreview` (U-3).

## Ronda 2 de revisión

- [x] R2-B1 · `PqrsEvidenceUploader`: "Reintentar subida" y "Quitar archivo" ya no se cruzan por debajo de `lg`. La cuadrícula pasa a `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (a 360 px cada miniatura mide ~136 px), "Reintentar" va abajo a la izquierda (`absolute bottom-0 left-0`) y "Quitar" sigue arriba a la derecha; con `lg:` vuelve a `static`/4 columnas como antes (comercial igual). Prueba nueva en `e2e/touch.spec.ts` ("evidencia con la subida fallida": `/support` → "Nueva solicitud" → `setInputFiles` → `prepare-upload` simulado con 500): ambos botones miden 44 px y `elementFromPoint` en su centro devuelve ese botón. Vista en rojo con el código anterior (`hit` falso). Al correrla apareció otro hallazgo de la misma pantalla: "Adjuntar foto o video" medía 288x38 cuando ya hay un archivo; se fijó `min-h-11 lg:min-h-0`.
- [x] R2-N1 · `CLAUDE.md`: quitada la frase sobre `e2e/support/pending.ts` (solo esa).
- [x] R2-N2 · `e2e/touch.spec.ts`: los tres `getByRole('button', { name: 'Cerrar' })` pasan a `exact: true`.
- [x] R2-N3 · `e2e/support/measure.ts` (`settle`): si se agota el tope de 5 s de `networkidle`, hace `console.warn` y agrega una anotación `warning` a la prueba de Playwright (con la URL).
- [x] R2-N4 · Paginación de `SurveyList`: fixture `e2e/fixtures/api/surveys/available-paged.json` (3 páginas) y prueba "paginación con varias páginas" que lo sirve por `page.route` solo en esa prueba (así la captura de escritorio de `/surveys` no cambia). Vista en rojo con "Página anterior" a 32x32 (`h-8 w-8`); deshecho después.
