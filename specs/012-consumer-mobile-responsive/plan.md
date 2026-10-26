# 012 · Plan: vistas del consumidor usables en celular

- **Spec:** `spec.md` de esta carpeta (Puerta 1 aprobada el 2026-10-23). No hay spec de la API:
  no cambia ningún endpoint.
- **Fecha del plan:** 2026-10-23. Lecturas hechas sobre `beta-front` en `4af0956` (con cambios sin
  commitear en `docs/constitution.md` y `scripts/lint-ratchet.mjs`, ajenos a esta spec).
- **Tareas:** `tasks.md` de esta carpeta.

## 1. Resumen

Se deja usable a 360 px cada página del alcance (26 de `(consumer)`, más `/`, `/login`,
`/register` y `/verify`) con sus barras y componentes compartidos. Se aplican las 15 filas de RN-4,
se quitan los `<button>` metidos en enlaces y se ajustan áreas táctiles, teclados y tamaño de letra
de los formularios. Para comprobarlo se agregan dos capas de pruebas: un análisis estático del JSX con
Vitest (CA-3 y CA-4, sin dependencias nuevas) y pruebas de navegador con Playwright contra el build
real, con la API simulada en loopback (CA-1, CA-2, CA-4 en el DOM y CA-7). Playwright es la única
dependencia nueva (de desarrollo) y requiere una enmienda de P-13. Las dos cosas se aprueban en la
Puerta 2.

## 2. Lo que se encontró al leer el código (2026-10-23)

### 2.1 Alcance real (cierre de imports)

Se siguió el árbol de imports (`@/…` y relativos) desde las 26 `page.tsx` de `(consumer)`, sus
`layout.tsx`, `src/app/page.tsx`, las tres páginas de `(auth)` y `src/app/layout.tsx`. Salen
**115 archivos `.tsx`**: las 30 páginas, 4 layouts, `RaffleLiveClient.tsx`, 4 providers,
`CartContext` y 75 componentes. La prueba estática de la tarea T3 calcula ese mismo cierre cada vez
que corre, así que un componente que entre después queda dentro sin tocar la lista.

**Componentes del alcance que también usan otros roles o páginas fuera del alcance (RN-6, CA-8):**

| Componente | También lo usa |
|------------|----------------|
| `src/components/Footer.tsx` | `src/app/forgot-password/page.tsx`, `src/app/unlock-account/page.tsx` (fuera del alcance) |
| `src/components/LoadingSpinner.tsx` | `UnlockAccountForm.tsx` (fuera del alcance) |
| `src/components/notifications/NotificationsPanel.tsx` | `Admin/shared/Header.tsx`, `commercial/layout/Header.tsx`, `game-designer/GameDesignerPanel.tsx` |
| `src/components/pqrs/*` (`PqrsPanel`, `CreatePqrsModal`, `PqrsCard`, `PqrsDetailModal`, `PqrsEvidenceUploader`, `PqrsAssetThumbnail`, `PqrsStatusBadge`, `RefundBankDetailsForm`) | `src/app/commercial/support/page.tsx` |
| `src/components/shared/CommercialStorefrontView.tsx` | `src/app/commercial/allies/[id]/page.tsx` |
| `src/components/shared/products/ProductImageGallery.tsx`, `ProductInfoCard.tsx`, `ProductReviews.tsx` | `commercial/products/ProductDetailCommercial.tsx` |
| `src/components/consumer/products/InfiniteScroll.tsx`, `SearchBar.tsx` | `commercial/allies/AlliesDashboard.tsx` |

`src/app/layout.tsx` (raíz) monta `CartDrawer` y `Toaster` para todos los roles.

### 2.2 Páginas de servidor y de cliente

- De servidor: `/home`, `/pet`, `/register` (envuelven componentes de cliente), `/products/[id]`
  (async; llama a `getProductDetail` con `apiClient` **desde el servidor**) y `/raffles/[id]/live`
  (async; `fetch` a `API_URL` desde el servidor, sin tiempo límite: deuda P-15 ya documentada, no se
  toca aquí).
- Las otras 25 son `'use client'` (deuda P-2 y P-10). Esta spec no las migra: es responsive, no
  arquitectura. Lo que se agregue nuevo sí cumple P-2 (nada de `'use client'` nuevo en páginas).
- `params` ya se leen como promesa en las páginas de servidor (P-6). Las de cliente con `[id]` usan
  `useParams`, que no cambia.

### 2.3 Búsqueda completa de botones muertos y botones dentro de enlaces

Hecha con el compilador de TypeScript sobre los 115 archivos (el mismo análisis que automatiza T2 y
T3), más una búsqueda de `cursor-pointer` sin manejador, `onClick` en elementos que no son botón,
`href` a `#` y enlaces internos a rutas que no existen.

**A. Botones sin acción (sin `onClick`, sin `type="submit"`, sin `disabled`), fuera de un enlace:**

| Archivo:línea | Texto | Fila de RN-4 |
|---------------|-------|--------------|
| `src/components/consumer/raffles/RaffleDetail.tsx:108` | "Participar ahora" | 1 |
| `src/app/page.tsx:248` | "Empezar Ahora" | 2 |
| `src/app/page.tsx:251` | "Ver Rifas Activas" | 3 |
| `src/app/page.tsx:478` | "Participar Ahora" | 4 |
| `src/app/page.tsx:488` | "Ver Todas las Rifas" | 5 |
| `src/app/page.tsx:635` | "Agregar al Carrito" | 6 |
| `src/app/page.tsx:646` | "Ver Toda la Tienda" | 7 |
| `src/app/page.tsx:847` | "Crear Cuenta Gratis" | 8 |
| `src/app/page.tsx:850` | "Descargar App" | 9 |
| `src/components/plans/PlanCard.tsx:143` | "Contratar Plan" | 12 |
| `src/components/plans/RechargeCard.tsx:124` | "Recargar Ahora" | 13 |
| **`src/app/page.tsx:741`** | **"Empezar a Referir"** | **No está en la tabla → N-1** |

Filas 10 y 11 ("Llamar Ahora", "Chat en Vivo"): ya están **comentadas** en
`src/app/(consumer)/plans/mobile-plans/page.tsx:640-657`, así que no se ven. Se borra el bloque
comentado para que no vuelva por accidente.

**B. Enlaces a `#`:** `src/components/consumer/ads/Sidebar.tsx:91, 97, 103` (fila 14). Los
`href="#rifas"`, `#tienda` y `#como-funciona` de `NavBarNoAuth` apuntan a secciones que existen
(`src/app/page.tsx:434, 563, 497`) y no son muertos.

**C. Hallazgos nuevos, que no están en la tabla de RN-4 (decide el usuario; ninguna tarea les da
destino por defecto):**

| Id | Dónde | Qué pasa |
|----|-------|----------|
| N-1 | Landing, sección de referidos (`src/app/page.tsx:741`) | "Empezar a Referir": botón sin acción. |
| N-2 | Lateral de anuncios (`Sidebar.tsx`, bloque "App download", tras los íconos de redes) | Tarjeta "Disponible en App Store & Google Play" con `cursor-pointer` y `hover`, sin acción: parece tocable y no hace nada. |
| N-3 | Menú de perfil del celular (`NavBar.tsx:728`) | "Mis compras" lleva a `/purchases`, que **no existe** (404). En escritorio el mismo ítem va a `/explore/purchases` (`NavBar.tsx:390`). |
| N-4 | Pie de `/login` (`src/app/(auth)/login/page.tsx:542` y `:556`) | "Privacidad" (`/privacidad`) y "Ayuda" (`/ayuda`) llevan a rutas que no existen (404). La spec no permite crear rutas. |
| N-5 | `Footer.tsx`, mostrado en la landing | Enlaces a `/raffles`, `/products`, `/plans/mobile-plans`, `/ads` y `/forum`, que exigen sesión: choca con la decisión de la landing ("el visitante no sale hacia páginas que exigen sesión"). Además muestra un teléfono "+57 (300) 123-4567" que parece de relleno, y la decisión de las filas 10-11 dice que no hay número oficial. El mismo `Footer` se ve en `/home` (con sesión) y en `/forgot-password` y `/unlock-account` (fuera del alcance). |
| N-6 | Navegación del celular (`NavBar.tsx`, barra inferior y menú de perfil) | En celular no hay forma de llegar a `/games`, `/surveys`, `/plans/mobile-plans`, `/forum`, `/explore/favorites` ni `/explore/participations` desde la barra: en escritorio sí están. No es un botón muerto; son páginas del alcance a las que el consumidor no llega en celular. |

**D. `<button>` dentro de `<Link>` o `<a>` (RN-5, CA-4), en el mismo archivo:**

| Archivo:línea | Texto |
|---------------|-------|
| `src/components/bars/NavBar.tsx:126` | los 9 ítems de la barra de escritorio (dentro de un `map`) |
| `src/components/bars/NavBarNoAuth.tsx:23` y `:28` | "Iniciar Sesión", "Crear Cuenta" |
| `src/components/consumer/home/HomePage.tsx:170, 176, 265, 327` | "Empezar a ganar", "Ver mi perfil", "Ver encuestas", "Ir al foro" |
| `src/app/(consumer)/checkout/page.tsx:73` | "Explorar productos" |
| `src/app/(consumer)/explore/favorites/page.tsx:87` | "Explorar productos" |

No hay `<Link>`/`<a>` dentro de `<button>`. La anidación entre componentes (un `<Link>` que envuelve
un componente que pinta un `<button>`) no se ve en el análisis estático: la cubre la prueba de
navegador sobre el DOM (`a button`, `button a`).

**E. Acciones en elementos que no son botón (RN-5: "una acción es un botón"):**
`plans/mobile-plans/page.tsx:568` (tarjeta de operador), `consumer/games/GameCard.tsx:18`,
`consumer/products/ConsumerProductCard.tsx:23`. Los demás `onClick` en `<div>` son fondos de modal
para cerrar (`participations/page.tsx:272`, `products/page.tsx:472`,
`raffles/[id]/results/page.tsx:388, 413`, `NavBar.tsx:667`, `CartDrawer.tsx:62`,
`AvatarPickerModal.tsx:47`, `ClaimPrizeModal.tsx:266`, `LiveRafflesCarousel.tsx:267`,
`SurveyPlayerModal.tsx:309`, `NotificationsPanel.tsx:177`) y los `stopPropagation` de su contenido:
esos se quedan como están (cerrar tocando el fondo es un atajo; cada modal ya tiene, o tendrá, su
botón de cerrar de 44 px).

**F. Otros defectos que salen al paso (no son botones muertos; se corrigen dentro de su tarea):**

- `src/app/(consumer)/home/page.tsx`: `<HomePage />;` pinta un `;` suelto en pantalla.
- `<a href>` internos en vez de `next/link` (P-7): `Footer.tsx:40-42`, `RegisterForm.tsx:563, 609,
  1269`, `login/page.tsx:528` (y 542, 556 según N-4).
- Puntos del carrusel de testimonios de la landing (`page.tsx:699`): 12 × 12 px y sin `aria-label`.
- Íconos de redes del `Sidebar`: 32 × 32 px (se van con la fila 14).

## 3. Archivos

### 3.1 Crear

| Ruta | Qué es |
|------|--------|
| `__tests__/ui/jsxInteractive.ts` | Analizador puro sobre el AST de TypeScript (`typescript` ya es dependencia de desarrollo): devuelve botones sin acción, enlaces a `#` o vacíos, `onClick` vacío y anidación botón/enlace de un archivo `.tsx`. |
| `__tests__/ui/jsxInteractive.test.ts` | Casos del analizador con fragmentos de JSX en cadenas (no archivos `.tsx` sueltos, para que `tsc` no los compile). |
| `__tests__/ui/consumerScope.ts` | Calcula el alcance: cierre de imports desde las páginas y layouts de la sección 2.1. |
| `__tests__/ui/consumerInteractive.test.ts` | CA-3 y CA-4 sobre el alcance, con una lista de pendientes que solo baja (ver 9.1). |
| `__tests__/e2e-support/mockApi.test.ts` | Prueba del enrutador de la API simulada (coincidencias, CORS, rutas sin fixture). |
| `playwright.config.ts` | Proyectos por viewport, servidores, red bloqueada. |
| `e2e/support/mockApi.mjs` | Servidor HTTP de Node (sin dependencias) en `127.0.0.1:4010` que responde con fixtures. |
| `e2e/support/mockRoutes.mjs` | Tabla y función pura de coincidencia de rutas (la prueba la importa). |
| `e2e/fixtures/api/**.json` | Datos de prueba ficticios por endpoint `GET` (y `POST /pet/session/init`). |
| `e2e/fixtures/pet-game.html` | Página mínima que hace de juego de Unity dentro del iframe. |
| `e2e/support/build.mjs` | Corre `next build` con las variables del entorno de pruebas (sección 7). |
| `e2e/support/serve.mjs` | Copia `.next/static` y `public` dentro de `.next/standalone` (igual que el `Dockerfile`) y arranca `server.js` en `127.0.0.1:3100`. |
| `e2e/support/session.ts` | Cookie de sesión de next-auth firmada con el secreto ficticio y un JWT de acceso falso que no vence. |
| `e2e/support/network.ts` | Fixture de Playwright: aborta todo lo que no sea `127.0.0.1` y cierra los WebSocket. |
| `e2e/support/pages.ts` | Lista de las 30 rutas del alcance con su URL de prueba (ids de fixture), si llevan sesión y qué endpoint simular en error. |
| `e2e/support/pending.ts` | Pendientes de las pruebas de navegador que solo bajan (ver 9.1). |
| `e2e/layout.spec.ts` | CA-1 (sin desborde a 360, 390 y 768), CA-4 en el DOM, estado de error a 360. |
| `e2e/touch.spec.ts` | CA-2 (áreas táctiles a 360). |
| `e2e/rn4.spec.ts` | CA-3 de comportamiento (cada fila de RN-4 hace lo suyo) y CA-5. |
| `e2e/forms.spec.ts` | Parte automatizable de CA-6: `type`/`inputMode`/`autocomplete` y tamaño de letra ≥ 16 px. |
| `e2e/pet.spec.ts` | CA-7. |
| `e2e/desktop.spec.ts` + `e2e/desktop.spec.ts-snapshots/` | Solo si se aprueba D-4: capturas de escritorio (1280 px) para CA-8. |
| `specs/012-consumer-mobile-responsive/baseline.md` | Línea base: "First Load JS" por ruta del alcance y avisos de lint, medidos antes de tocar nada (RN-8). |

### 3.2 Modificar

| Ruta | Qué cambia |
|------|------------|
| `package.json`, `package-lock.json` | `@playwright/test` `1.64.1` en `devDependencies` (D-1); scripts `build:e2e` y `test:e2e`. |
| `.gitignore` | `/playwright-report`, `/test-results`, `/blob-report`. |
| `.github/workflows/ci.yml` | Job nuevo de pruebas de navegador (D-2). |
| `docs/constitution.md` | Enmienda de P-13 (D-3). |
| `CLAUDE.md` | Comandos `build:e2e` / `test:e2e`, el cuarto check (si D-2 sale así), y carpeta `e2e/`. |
| `.lint-max-warnings` | Baja al nuevo conteo cada vez que una tarea quita avisos (`<img>` → `next/image`, `any`). Nunca sube (P-19). |
| `src/components/bars/NavBarNoAuth.tsx` | Fila 15 (CA-5), `Link` con estilo de botón (RN-5), 44 px. |
| `src/components/bars/NavBar.tsx` | `Link` sin `<button>` dentro en escritorio (mismo aspecto); áreas táctiles de la barra inferior; N-3 y N-6 según decisión. |
| `src/components/Footer.tsx` | `next/link` en vez de `<a>`; áreas táctiles; N-5 según decisión. Escritorio igual. |
| `src/app/(consumer)/layout.tsx` | Alto y relleno inferior para que la barra fija no tape contenido y `/pet` no tenga scroll. |
| `src/app/(consumer)/home/page.tsx` | Quita el `;` suelto. |
| `src/app/page.tsx` | Filas 2-9 y N-1; `<img>` → `next/image` (RN-8); puntos del carrusel. |
| `src/components/consumer/raffles/RaffleDetail.tsx` | Fila 1 (quitar "Participar ahora"). |
| `src/components/plans/PlanCard.tsx`, `RechargeCard.tsx` | Filas 12 y 13: "Próximamente", `disabled`, `aria-disabled`, sin `hover` ni `cursor-pointer`. |
| `src/app/(consumer)/plans/mobile-plans/page.tsx` | Borra el bloque comentado de filas 10-11 (y los imports `Phone`, `MessageSquare` si quedan sin uso); tarjeta de operador como `<button>`. |
| `src/components/consumer/ads/Sidebar.tsx` | Fila 14 (quitar redes); N-2 según decisión. |
| `src/components/consumer/home/HomePage.tsx` | 4 `Link` con `<button>` dentro → `Link` con estilo de botón. |
| `src/app/(consumer)/checkout/page.tsx`, `explore/favorites/page.tsx` | "Explorar productos" sin `<button>` dentro del `Link`; campos del checkout (RN-3). |
| `src/app/(auth)/login/page.tsx` | N-4 según decisión; `next/link` para `/terminos`. |
| `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`, `VerificationForm.tsx` | RN-3: `type`, `inputMode`, `autoComplete`, letra de 16 px en celular; botón de mostrar contraseña con `aria-label` y 44 px; `next/link` a `/login` y `/terminos`. |
| `src/app/(consumer)/explore/profile/edit/page.tsx`, `src/components/pqrs/CreatePqrsModal.tsx`, `RefundBankDetailsForm.tsx`, `src/components/consumer/raffles/ClaimPrizeModal.tsx` | RN-3 en sus campos. |
| `src/components/consumer/games/GameCard.tsx`, `src/components/consumer/products/ConsumerProductCard.tsx` | Acción en `<button>`/`<Link>` en vez de `<div onClick>` (RN-5). |
| `src/components/PetGame.tsx`, `src/app/(consumer)/pet/page.tsx` | RN-7: marco sin scroll, "Reintentar" de 44 px, estados legibles a 360. |
| Resto de los 115 archivos del alcance | Solo lo que las pruebas de navegador marquen (desborde, áreas táctiles), con clases de Tailwind de celular primero y las de escritorio intactas. La lista exacta sale de la primera corrida de T7 (`e2e/support/pending.ts`). |

No se toca nada de `src/app/{admin,commercial,compliance,game-designer}`, `src/components/{Admin,
commercial,compliance,game-designer}`, `src/middleware.ts`, `src/services`, `src/hooks` ni
`src/types`.

## 4. Rutas y acceso

- **Ninguna ruta nueva**, ningún route handler nuevo. `src/middleware.ts` y
  `__tests__/middleware/routeAccess.ts` no cambian; `routeProtection.test.ts` y
  `routeInventory.test.ts` siguen en verde sin tocarlos.
- Las páginas siguen siendo de servidor o de cliente como hoy; no se agrega `'use client'` a
  ninguna página ni layout (P-2). Los botones que pasan a `Link` no necesitan cliente.
- Los enlaces de la landing apuntan a `/login`, `/register` y `#rifas`, que ya existen y son
  públicas (`PUBLIC` en `routeAccess.ts`).
- **Páginas con sesión en Playwright (punto 3 del encargo):** el servidor de pruebas arranca con
  `MIDDLEWARE` sin definir, así que el middleware deja pasar todo (P-4, modo desarrollo). La sesión
  es real para next-auth: `e2e/support/session.ts` firma con `encode` de `next-auth/jwt` y el
  secreto ficticio `TEST_SECRET` (el de `__tests__/middleware/session.ts`, importado de ahí) un token
  con `role: 'ROLE_CONSUMER'`, `publicId` ficticio, `accessTokenExpires` dentro de un año y un
  `accessToken` que es un JWT **sin firma válida** con `exp` lejano (el front no verifica la firma,
  P-12, y aquí eso es lo que permite probar sin la API). Se pone como cookie
  `next-auth.session-token` en el contexto del navegador. El servidor se arranca con
  `NEXTAUTH_SECRET=TEST_SECRET` y `NEXTAUTH_URL=http://127.0.0.1:3100`. Así `useSession`,
  `<AuthProvider>`, `tokenStore` y el interceptor de `apiClient` funcionan como en producción, y el
  `Authorization: Bearer …` llega a la API simulada. No se usa el helper de las pruebas del
  middleware tal cual porque pone `accessTokenExpires: 0`, y eso dispara `RefreshAccessTokenError`
  en el callback `jwt` y un refresco en el cliente.
- Las páginas públicas (`/`, `/login`, `/register`, `/verify`) se prueban **sin** cookie: la landing
  redirige a quien tiene sesión.
- P-5 no cambia: la UI oculta o deshabilita cosas, pero la API sigue autorizando los datos.

## 5. Contrato con la API

No se consume ningún endpoint nuevo ni cambia ninguno. **Dependencias de la API: ninguna.** Las
filas "Conectar" de RN-4 son todas navegación interna de la landing. Las de "Próximamente" no
llaman a nada.

Para las pruebas, la API simulada responde los `GET` que piden las páginas del alcance al cargar
(perfil del consumidor, nivel, notificaciones, carrito, listas de rifas, productos, juegos,
encuestas, historias, PQRS, compras, transacciones, referidos, detalle de rifa y de producto,
tienda del comercial) y `POST /pet/session/init`. La forma de cada respuesta sale de los tipos de
`src/types/` que ya usan los servicios: un fixture que no case con el tipo rompe la pantalla en la
prueba, no en `tsc`, así que T5 los arma leyendo cada servicio. Un pedido sin fixture responde 404 y
**queda registrado**: la prueba de esa página falla diciendo qué ruta falta (así "con datos de
prueba" de CA-1 no se cumple por accidente con pantallas vacías).

## 6. Datos y estado

Sin servicios, hooks ni `queryKey` nuevos. Ninguna mutación cambia. Lo que se toca es marcado y
clases. Si una tarea quisiera mover una página a TanStack Query para arreglar un estado, se sale
del alcance: se anota como pendiente, no se hace.

## 7. Pruebas: diseño

### 7.1 Por qué Playwright (P-1) y qué versión

- **Qué resuelve que no se pueda ya:** CA-1, CA-2 y CA-7 se definen sobre lo que el navegador
  pinta (ancho del documento contra el viewport, tamaño de cada caja, `orientation` y
  `pointer: coarse` en CSS). Vitest corre en `node`, sin motor de diseño. `jsdom` (que la guía de
  Next usa para componentes) **no calcula diseño**: todas las cajas miden 0, así que tampoco sirve.
  Hace falta un navegador real.
- **No duplica nada:** el repo no tiene ningún ejecutor de navegador (ni Cypress, ni Puppeteer, ni
  Testing Library). Es lo que la propia spec 010 dejó para "pruebas de punta a punta" (su CA-7) y lo
  que nombra la spec 012.
- **Por qué Playwright y no Puppeteer o Cypress:** emulación de dispositivo de primera clase
  (`viewport`, `isMobile`, `hasTouch`, `deviceScaleFactor`), interceptación de red y de WebSocket
  (`page.route`, `page.routeWebSocket`), servidores de prueba declarados en la configuración
  (`webServer`) y ejecutor propio con reintentos y reportes. Puppeteer no trae ejecutor ni
  `webServer`; Cypress no emula `hasTouch`/`isMobile` ni media `pointer`.
- **Versión:** `@playwright/test` **`1.64.1`** fija (sin `^`, igual que `vitest`), la `latest` del
  registro el 2026-10-23. Pide Node ≥ 20 (el CI usa 22). Trae `playwright` y `playwright-core`; los
  navegadores no van en `node_modules`, se descargan con `npx playwright install`.
- **Auditoría:** es de desarrollo. `npm run audit:ci` corre `npm audit --omit=dev`, así que no la
  ve y no puede cambiar su resultado. T4 lo comprueba: misma salida antes y después.
- **Solo Chromium en el CI.** Safari para iOS se cubre con el iPhone real de CA-10. WebKit queda
  como proyecto opcional local (`npx playwright test --project=webkit-390`) si el usuario lo quiere;
  no entra al CI por tiempo (D-2).

### 7.2 Cómo se sirve la app sin la API ni secretos reales (P-13)

1. **Build propio de pruebas** (`npm run build:e2e`, `e2e/support/build.mjs`): `next build` con
   `NEXT_PUBLIC_API_URL=http://127.0.0.1:4010`, `NEXT_PUBLIC_WS_URL=http://127.0.0.1:4010/ws`,
   `NEXT_PUBLIC_PET_GAME_URL=http://127.0.0.1:4010/pet-game-stub`,
   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-pruebas` y `NEXT_TELEMETRY_DISABLED=1`. Hace
   falta un build aparte porque las `NEXT_PUBLIC_*` quedan fijas al compilar (P-3) y el build del job
   `Lint, tipos y build` apunta a `api.example.test`. Escribe en `.next` (el mismo directorio que
   `npm run build`): quien lo corre en local vuelve a correr `npm run build` antes de `tsc`.
2. **API simulada en loopback** (`e2e/support/mockApi.mjs`, `node:http`, sin dependencias):
   responde fixtures de `e2e/fixtures/api`, con CORS para `http://127.0.0.1:3100` y credenciales.
   La usan el navegador **y** el servidor de Next (`API_URL=http://127.0.0.1:4010` para
   `/raffles/[id]/live`; `/products/[id]` llama a `NEXT_PUBLIC_API_URL` desde el servidor). Por eso
   no basta con `page.route`: el servidor de Next no pasa por el navegador. El SSE de notificaciones
   recibe `204` (el `EventSource` no reintenta), `/ws/**` (SockJS) recibe `404`, y
   `/pet-game-stub` sirve `e2e/fixtures/pet-game.html`.
3. **Servidor del front** (`e2e/support/serve.mjs`): el build `standalone` igual que en la imagen,
   en `127.0.0.1:3100`, con `NEXTAUTH_SECRET=<TEST_SECRET>`, `NEXTAUTH_URL`, `API_URL` y **sin**
   `MIDDLEWARE`. `playwright.config.ts` levanta los dos servidores con `webServer` y espera a que
   respondan.
4. **Red cerrada:** la fixture de `e2e/support/network.ts` aborta en el contexto cualquier pedido
   cuyo host no sea `127.0.0.1` (Google reCAPTCHA, CDNs, fuentes) y cierra todo WebSocket con
   `routeWebSocket`. Las pruebas no tocan internet: solo loopback. Las fuentes de `next/font/google`
   se bajan al **compilar** (como ya pasa en `npm run build`), no al probar.
5. **Estados de error y vacío:** por página, `page.route` sobre `http://127.0.0.1:4010/...` cambia
   la respuesta de un endpoint a `500` o a lista vacía (el navegador sí pasa por `route`). Para las
   dos páginas que piden desde el servidor, el servidor simulado responde `500` a un id reservado
   (`999`).
6. **Datos ficticios:** nombres, correos y documentos inventados (`consumidor@example.test`,
   `1000000000`), imágenes de `public/`. Ningún dato real (P-16).

### 7.3 Qué mide cada prueba

- **CA-1** (`e2e/layout.spec.ts`): por cada página de `e2e/support/pages.ts` y por proyecto (360 ×
  740, 390 × 844 y 768 × 1024; `isMobile` y `hasTouch` en los dos primeros), espera a que no haya
  pedidos pendientes y comprueba `document.documentElement.scrollWidth <= window.innerWidth` (y lo
  mismo con `body`). Falla con el selector de los elementos cuyo borde derecho pasa el viewport, para
  que el mensaje diga qué arreglar. A 360 se repite con el endpoint principal en `500`.
- **CA-4 en el DOM** (mismo archivo): `a button`, `a [role=button]`, `button a` y `button button`
  cuentan 0.
- **CA-2** (`e2e/touch.spec.ts`), a 360: todo `a[href]`, `button`, `input` (menos `hidden`),
  `select`, `textarea`, `[role=button]` y `[tabindex]:not([tabindex="-1"])` **visible** mide ≥ 44 ×
  44 en `boundingBox()`. Para `checkbox` y `radio` cuenta la caja de su `<label>` si es mayor ("o
  tienen esa área táctil"). Se ignora lo que está dentro de un `iframe` (el juego) y lo que es
  `aria-hidden`. No hay más excepciones: si aparece una que se justifique (por ejemplo, un enlace
  dentro de un párrafo), se propone al usuario (D-5) y queda escrita con su motivo en la prueba.
- **CA-3, comportamiento** (`e2e/rn4.spec.ts`): una prueba por fila de RN-4 y por hallazgo N-n
  decidido: la landing lleva a `/register`, `/login` o baja a `#rifas`; los ocultos no existen; los
  "Próximamente" están `disabled`, con ese texto y `cursor: default`.
- **CA-5** (en `rn4.spec.ts`): a 360 y sin sesión, el enlace "Iniciar sesión" de la barra es visible
  sin tocar nada y lleva a `/login`.
- **CA-6, parte automática** (`e2e/forms.spec.ts`): en login, registro, verificación, perfil,
  checkout y soporte, cada campo tiene el `type`/`inputMode`/`autoComplete` esperado y
  `font-size` calculado ≥ 16 px a 360. Lo que no se puede automatizar (aparece el teclado correcto,
  el campo queda visible encima del teclado) va a la pasada manual de CA-10.
- **CA-7** (`e2e/pet.spec.ts`): a 360 × 740 vertical, el aviso "Gira tu teléfono" es visible y el
  documento no tiene scroll; a 740 × 360 horizontal, el aviso no se ve, el `iframe` es visible y
  ni el documento ni el marco tienen scroll; con `POST /pet/session/init` retrasado se lee
  "Preparando tu mascota…" entero, y con `500` se lee el error entero y "Reintentar" mide ≥ 44 px.
  Si `pointer: coarse` no se emula como se espera (ver riesgo R-3), la prueba lo comprueba primero
  con `matchMedia` y falla con ese mensaje.
- **CA-3 y CA-4 estáticos** (`__tests__/ui/consumerInteractive.test.ts`, Vitest, `node`): sobre los
  archivos del alcance, falla si hay un `<button>`/`<motion.button>` sin `onClick`, sin
  `type="submit"`, sin `disabled` y sin props esparcidas; un `onClick` vacío (`() => {}`, `() =>
  null`); un `<a>`/`<Link>` con `href` `#`, vacío o sin `href`; un `<button>` dentro de `<a>`/
  `<Link>` o al revés. Los `<button>` de envío deben llevar `type="submit"` explícito (hoy todos los
  del alcance lo hacen o están fuera de un `<form>`; si alguno no, se le agrega). **Sin regla de lint
  nueva:** no hay una regla de `eslint-config-next` que detecte botón-dentro-de-enlace, y una regla
  propia exigiría un plugin; la prueba estática no cambia `.lint-max-warnings`.

### 7.4 CA-8 y RN-6: los otros roles

1. **Sin cambios en sus carpetas.** Comprobación: `git diff --stat main -- src/app/admin
   src/app/commercial src/app/compliance src/app/game-designer src/components/Admin
   src/components/commercial src/components/compliance src/components/game-designer` sale vacío.
2. **Regla de edición de los compartidos** (tabla de 2.1, más `layout.tsx` raíz): se cambian solo
   con clases de celular primero que **restauran el valor de escritorio con `lg:`** (o `md:` si ya lo
   usaba), nunca quitando una clase de escritorio. Ejemplo: `p-6` pasa a `p-4 lg:p-6`, no a `p-4`.
3. **Capturas de escritorio** (si se aprueba D-4): antes de tocar ningún compartido (T9) se sacan
   capturas a 1280 × 800 de las páginas que los usan: `/home`, `/support`, `/products/[id]`,
   `/commercial/[id]`, `/products`, y las de otros roles `/commercial/support`,
   `/commercial/allies/[id]`, `/commercial/products/[id]`, `/admin`, `/game-designer` (con la cookie
   del rol que toque). Al final (T28) `npx playwright test --project=desktop-1280` las compara con
   `toHaveScreenshot` (tolerancia de 0,1 % de píxeles). Las capturas dependen del sistema operativo,
   por eso ese proyecto **no corre en el CI**: se corre en la misma máquina antes y después.

## 8. UI

- **Estados** (tabla de la spec): cargando, vacío y error se mantienen como hoy; solo se ajusta que
  quepan a 360. Sin permiso: como hoy (spec 011).
- **RN-5:** navegar es `<Link>` con las clases del botón que había (mismo aspecto); acción es
  `<button type="button">`. Estado al tocar: `active:` (por ejemplo `active:scale-95` o
  `active:bg-…`) en los que no lo tengan; el `hover:` se queda pero nada depende de él (RN-2).
- **RN-2:** mínimo `min-h-11 min-w-11` (44 px) en lo tocable; separación con `gap-2` como mínimo
  entre vecinos tocables.
- **RN-3:** `type="email"` + `autoComplete="email"` en correo; `type="tel"` + `inputMode="tel"` en
  teléfono; `inputMode="numeric"` + `pattern="[0-9]*"` en cédula y código OTP (`autoComplete=
  "one-time-code"` en el OTP); letra `text-base` (16 px) en celular y la de hoy desde `lg:` (por
  ejemplo `text-base lg:text-sm`), **por componente**, no con una regla global (D-6). Que el campo
  enfocado quede visible: el layout usa `h-dvh`, y se evita que la barra inferior fija lo tape
  (`scroll-padding-bottom` en el contenedor con scroll).
- **Formularios:** los del alcance no usan react-hook-form (deuda P-11). Esta spec solo cambia
  atributos y clases; no los migra (sería alcance nuevo y sin pruebas de componentes). No se agrega
  ningún formulario. El doble envío no cambia.
- **Accesibilidad:** `aria-label` en botones solo-ícono que se toquen (contraseña, cerrar,
  carrusel), foco visible (`focus-visible:ring`), contraste sin cambios.
- **Textos:** no cambian (decisión del 2026-10-23), salvo "Próximamente" en filas 12 y 13.
- **RN-8:** en cada archivo tocado, los `<img>` con origen en `public/` o en un host de
  `images.remotePatterns` pasan a `next/image` con `sizes` acorde a la columna que ocupan. Las
  vistas previas de archivos locales (`blob:`/`data:`, en `PqrsEvidenceUploader`, `ReportIssueModal`,
  avatares por subir) se quedan en `<img>`: `next/image` no optimiza esas URL. Cada `<img>` quitado
  baja un aviso de lint: se baja `.lint-max-warnings` en la misma tarea (P-19). Peso: T26 compara la
  columna "First Load JS" de `next build` por ruta con `baseline.md`; ninguna sube.

## 9. Orden de trabajo y pendientes que solo bajan

### 9.1 Listas de pendientes

Las pruebas nuevas fallarían hoy en casi todo el alcance, y el CI no puede quedar rojo mientras se
trabaja por bloques. Por eso:

- `consumerInteractive.test.ts` tiene `KNOWN_VIOLATIONS` con las entradas de 2.3 (A, B, D). Falla si
  aparece una violación que no esté en la lista **y** si una de la lista ya no existe ("quítala de la
  lista"), igual que el tope de lint.
- `e2e/support/pending.ts` tiene, por prueba de navegador, las páginas que fallan en la primera
  corrida (T7). Esas pruebas se marcan `test.fail()` (falla esperada): si una empieza a pasar, la
  corrida falla y obliga a sacarla de la lista.
- La última tarea exige las dos listas **vacías**.

### 9.2 Bloques

0. Infraestructura de pruebas y línea base (T1-T10).
1. Barras, layout y componentes compartidos (T11-T16).
2. Páginas del consumidor por grupo (T17-T23).
3. Landing (T24).
4. `/pet` (T25).
5. Peso, pendientes vacíos, CA-8, checklist y cierre (T26-T30), más pasos del usuario.

## 10. Configuración

- **Variables de entorno nuevas de la app: ninguna.** Las de 7.2 son solo del entorno de pruebas
  (las fija `e2e/support/build.mjs` / `playwright.config.ts`, con valores ficticios y públicos), no
  se agregan a la tabla de variables de la app. `NEXTAUTH_SECRET` de pruebas es el secreto ficticio
  ya versionado en `__tests__/middleware/session.ts`, no un secreto real (P-3, P-16).
- **`images.remotePatterns`:** sin hosts nuevos. Los fixtures usan imágenes de `public/`.
- **CI:** ver 12.

## 11. Dependencias

- **Nueva, de desarrollo:** `@playwright/test@1.64.1` (D-1). Navegador: Chromium de Playwright,
  instalado en el CI con `npx playwright install --with-deps chromium`.
- Ninguna de producción. El análisis estático usa `typescript`, ya instalado.

## 12. CI (`.github/workflows/ci.yml`)

**Propuesta (D-2, recomendada): un job nuevo `e2e`, nombre "Pruebas en navegador"**, sin tocar los
tres existentes ni sus nombres:

```yaml
  e2e:
    name: Pruebas en navegador
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      NEXT_TELEMETRY_DISABLED: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - name: Caché de .next/cache (build de pruebas)
        uses: actions/cache@v4
        with:
          path: .next/cache
          key: nextjs-e2e-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**') }}
          restore-keys: nextjs-e2e-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-
      - name: Caché de navegadores de Playwright
        id: pw-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - name: Instalar dependencias
        run: npm ci
      - name: Instalar Chromium
        if: steps.pw-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium
      - name: Dependencias del sistema de Chromium
        if: steps.pw-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps chromium
      - name: Build de pruebas
        run: npm run build:e2e
      - name: Pruebas en navegador
        run: npm run test:e2e
      - name: Reporte (solo si falla)
        if: failure()
        uses: actions/upload-artifact@v4
        with: { name: playwright-report, path: playwright-report, retention-days: 7 }
```

- **Tiempo estimado:** `npm ci` ~1 min, Chromium ~1 min sin caché (~30 s con caché, solo
  dependencias del sistema), build ~1-2 min, pruebas ~3-4 min (≈ 30 páginas × 3 viewports + 30 de
  áreas táctiles + 30 de error + formularios, RN-4 y mascota; 2 workers, `retries: 1` en CI). Total
  ~6-8 min dentro de los 10. Si se pasa, primero se sube a 4 workers y se agrupan las mediciones de
  una página en una sola navegación; nunca se sube el límite.
- **Protección de `main`:** un cuarto check obligatorio lo tiene que agregar Miguel en GitHub
  (paso M-1). Mientras no lo agregue, avisa pero no bloquea (igual que P-19 hoy).
- **Alternativa (si el usuario no quiere un cuarto check):** los mismos pasos dentro del job
  `Pruebas`, después de `npm test`. Contra: el job pasa de ~1 a ~7-8 min, y un fallo de navegador
  esconde el resultado de Vitest en el mismo check.
- El reporte subido solo contiene datos ficticios y el JWT falso de pruebas.

## 13. Enmienda propuesta a P-13 y a `CLAUDE.md` (D-3)

Texto propuesto para `docs/constitution.md`, P-13 (lo aprueba el usuario en la Puerta 2; T10 lo
escribe):

- **Regla:** las pruebas de lógica viven en `__tests__/` y corren con Vitest en entorno `node`. Las
  pruebas de navegador (diseño, viewport, áreas táctiles) viven en `e2e/` (`*.spec.ts`) y corren con
  Playwright contra el build `standalone` de la app. El middleware real se prueba sin
  refactorizarlo, con las utilidades de pruebas de Next. Ninguna prueba toca la red externa ni usa
  secretos reales: las de navegador hablan solo con servidores en `127.0.0.1` (la app y una API
  simulada con datos ficticios) y bloquean todo lo demás.
- **Fuente:** se agrega la guía de Next.js 15 "Setting up Playwright with Next.js"
  (<https://nextjs.org/docs/15/app/guides/testing/playwright>; T10 la comprueba antes de citarla) y
  la documentación de Playwright de emulación (`https://playwright.dev/docs/emulation`) y de
  `webServer` (`https://playwright.dev/docs/test-webserver`).
- **Versión:** se agrega `@playwright/test` 1.64.1.
- **Excepción (d), nueva:** el CI solo corre Chromium; Safari se comprueba a mano (CA-10 de la spec
  012).

`CLAUDE.md`: filas `npm run build:e2e` y `npm run test:e2e` en la tabla de comandos (con la nota de
que `build:e2e` reemplaza `.next` y hay que volver a correr `npm run build` antes de `tsc`), el
cuarto check en "Puertas de CI" (si D-2 sale así), "Ninguna prueba toca la red" pasa a "Ninguna
prueba toca la red externa", y `npx playwright install chromium` en "Requisitos" como paso único
para quien corra las pruebas de navegador.

## 14. Seguridad y PII

- **Sin cambios en datos personales** (requisito de la spec). Ningún dato nuevo en URL,
  `localStorage` ni `console.*`. Los enlaces nuevos de la landing no llevan parámetros.
- `RefundBankDetailsForm.tsx` (datos bancarios) y los formularios de registro y verificación solo
  cambian atributos de campos. `autoComplete` no envía nada a ningún lado. El código de verificación
  ya viaja como hoy.
- Deuda P-16 que no se toca: `RegisterForm.tsx` y `VerificationForm.tsx` siguen con `?email=` en la
  URL (deuda (d)). P-16 (c) dice "se quita en cuanto alguien toque ese archivo": de los archivos
  de (c), esta spec **no** toca `adService.ts` ni `useImpactStory.ts`. Si una tarea toca un archivo
  del alcance con un `console.*` que imprime un objeto de error de axios, lo quita en la misma tarea.
- **Pruebas:** la cookie de sesión y el JWT de acceso son falsos y viven solo en el navegador de la
  prueba; nunca en una URL. Los fixtures no tienen datos reales.
- Tokens: no se toca el flujo de auth (P-12).

## 15. Llamadas salientes del servidor

El plan no agrega rutas en `src/app/api` ni `fetch` de servidor. Los servidores de `e2e/support`
son herramientas de pruebas, no código de la app; aun así `serve.mjs` y `build.mjs` terminan con
código distinto de cero si el proceso hijo falla, y `playwright.config.ts` fija `webServer.timeout`
(120 s) para no colgar el job.

## 16. Efectos colaterales

- **Otras pantallas con los mismos componentes:** tabla de 2.1. `NotificationsPanel` cambia en la
  barra del consumidor y también en las cabeceras de admin, comercial y diseñador: por eso la regla
  de 7.4 y las capturas de D-4.
- **`Footer`** se ve en `/forgot-password` y `/unlock-account` (fuera del alcance): verán los
  cambios de `next/link` y de N-5; en escritorio, igual.
- **Fila 1:** al quitar "Participar ahora", el detalle de la rifa queda sin llamada a la acción; el
  consumidor obtiene tickets por los caminos que ya existen (anuncios, compras, juegos). No se llama
  a la API en ningún caso.
- **Filas 12-13:** quien hoy tocaba "Contratar Plan"/"Recargar Ahora" no veía nada; ahora ve que no
  está disponible.
- **Tiempo real:** STOMP y SSE no cambian. En las pruebas quedan cerrados (sin socket), así que
  `/raffles/[id]/live` se prueba en su pantalla de sala de espera; las de sorteo, ganador y
  terminado (`draw/*`) se revisan en la pasada manual (CA-10) o con un estado inicial del fixture si
  el componente lo toma de la respuesta del servidor (T18 lo averigua).
- **Juego de Unity:** en las pruebas es una página de relleno. El tamaño del juego dentro del
  iframe lo decide el build (RN-7): fuera.

## 17. Lista de comprobación manual (CA-10)

Se hace en el Android y en el iPhone reales, con la beta o con `next start` en la red local y la
API levantada, con una cuenta de consumidor de pruebas. Por cada página del alcance, en vertical
(y en horizontal en `/pet` y `/games/play`):

1. **RN-1:** no hay scroll de lado; ningún texto ni botón cortado o encimado; cargando, vacío y error
   (si se pueden provocar) caben.
2. **RN-2:** cada botón y enlace se toca con el pulgar sin pegarle al vecino; nada necesita `hover`
   (menús, tooltips, botones que solo aparecen al pasar el ratón); al tocar, cambia de estado.
3. **RN-3** (login, registro, verificación, perfil, checkout, soporte y el reclamo de premio): el
   teclado que aparece es el del campo (correo, numérico, teléfono); la página no hace zoom al
   enfocar; el campo enfocado queda visible encima del teclado; se puede enviar.
4. **RN-4:** las filas de la tabla y los N-n decididos hacen lo que dicen.
5. **RN-7 (`/pet`):** en vertical, el aviso de girar; en horizontal, el juego sin barras de scroll;
   "Preparando tu mascota…" y el error (modo avión) se leen completos.
6. Barra inferior y menú de perfil: se llega a cada página del alcance (según N-6).

**Dónde se anota:** T29 agrega a `spec.md` la sección "Resultados de la pasada en celulares" con
una tabla `Página | Android (modelo, Chrome N) | iPhone (modelo, iOS N) | Notas`, una fila por cada
una de las 30 páginas. El usuario la llena (paso U-3) con "Cumple" o el defecto encontrado.

## 18. Trazabilidad

| CA | Tareas | Cómo se verifica |
|----|--------|------------------|
| CA-1 | T5, T6, T7, T11-T25, T27 | `npx playwright test e2e/layout.spec.ts` (360, 390, 768; `pending.ts` vacío) |
| CA-2 | T7, T11-T25, T27 | `npx playwright test e2e/touch.spec.ts` |
| CA-3 | T2, T3, T11, T13, T17, T18, T22, T23, T24, T27 | `npx vitest run __tests__/ui/consumerInteractive.test.ts` (lista vacía) y `npx playwright test e2e/rn4.spec.ts` |
| CA-4 | T2, T3, T7, T11, T12, T17, T19, T20, T27 | `npx vitest run __tests__/ui/consumerInteractive.test.ts` y `e2e/layout.spec.ts` (consulta en el DOM) |
| CA-5 | T11, T24 | `npx playwright test e2e/rn4.spec.ts -g "CA-5"` |
| CA-6 | T19, T20, T21, T23, T29, U-3 | `npx playwright test e2e/forms.spec.ts` + pasada manual (teclado, zoom, campo visible) |
| CA-7 | T16, T25, T29, U-3 | `npx playwright test e2e/pet.spec.ts` + pasada manual |
| CA-8 | T9, T14, T28 | `git diff --stat main -- <carpetas de otros roles>` vacío; `npx playwright test --project=desktop-1280` (si D-4) |
| CA-9 | T3, T7, T8, T26, T30, M-1 | Job "Pruebas en navegador" y job "Pruebas" en verde en el PR, cada uno < 10 min; `npm run lint:ci` en verde con `.lint-max-warnings` ≤ 360 |
| CA-10 | T29, U-3 | Tabla de resultados en `spec.md` completa para las 30 páginas en los dos celulares |

## 19. Riesgos

- **R-1 · Tiempo del job.** Build + Chromium + ~200 pruebas puede rondar los 10 min. Mitigación:
  cachés, 2-4 workers, una navegación por página para varias mediciones. T8 mide la primera corrida
  y lo anota.
- **R-2 · Fixtures frágiles.** ~150 llamadas a la API en los servicios del alcance; las páginas
  piden decenas al cargar. Un fixture con forma equivocada rompe la página en la prueba. Mitigación:
  el registro de rutas sin fixture y armar cada fixture desde el tipo de `src/types`.
- **R-3 · Emulación de `pointer: coarse` y orientación.** El aviso de girar depende de
  `pointer-fine:hidden` y `landscape:hidden`. Si Chromium con `hasTouch` no reporta `pointer:
  coarse`, CA-7 se apoya en la pasada manual para esa parte; la prueba lo detecta y lo dice.
- **R-4 · `/raffles/[id]/live`:** su `fetch` de servidor no tiene tiempo límite ni mira `res.ok`
  (deuda P-15). Con la API simulada responde; con el id de error la página se rompe con un error de
  Next: no se prueba su estado de error (deuda ya documentada, spec futura).
- **R-5 · reCAPTCHA en `/register`:** con el script de Google bloqueado, la página debe pintar igual.
  Si el proveedor lanza un error y rompe la página, T23 lo resuelve en la prueba (fixture que simula
  `grecaptcha` desde loopback), no en el código de la app.
- **R-6 · Compartidos con otros roles:** un cambio de clase base cambia el escritorio. Mitigación:
  regla de 7.4 y capturas (D-4).
- **R-7 · `build:e2e` reemplaza `.next`:** en local, quien corre `tsc` después de `build:e2e` ve los
  tipos de ese build, que son los mismos (las rutas no cambian). Documentado en `CLAUDE.md`.
- **R-8 · `/pet` en horizontal con las dos barras del celular** (arriba ~64 px y abajo 64 px) deja
  ~230 px de alto en un teléfono de 360 px. Cumple "sin barras de scroll", pero el juego se ve
  chico (D-7).

## 20. Decisiones para el usuario (Puerta 2)

| Id | Decisión | Recomendación |
|----|----------|---------------|
| D-1 | Agregar `@playwright/test@1.64.1` como dependencia de desarrollo (P-1). | **Sí.** Justificación en 7.1; no afecta `audit:ci` (`--omit=dev`). |
| D-2 | Dónde corren las pruebas de navegador en el CI: **(a)** job nuevo "Pruebas en navegador" (cuarto check; Miguel lo agrega a la protección de `main`), o **(b)** dentro del job `Pruebas`. Solo Chromium. | **(a).** Cada job tiene su límite de 10 min, y un fallo de navegador no tapa el de Vitest. Los tres nombres actuales no cambian. |
| D-3 | Enmendar P-13 y `CLAUDE.md` con el texto de la sección 13 (carpeta `e2e/`, Playwright, red solo loopback). | **Sí**, con ese texto. |
| D-4 | CA-8 con capturas de escritorio automáticas (`toHaveScreenshot`, 1280 px, solo en local, antes y después) además de la comparación de carpetas con `git diff`. Alternativa: solo `git diff` + revisión manual de las páginas de 7.4. | **Capturas en local**: el riesgo real está en `NotificationsPanel` y los `Pqrs*`, que se ven en admin y comercial. |
| D-5 | Excepciones de CA-2 (44 × 44): hoy solo `iframe`, `aria-hidden` y `checkbox`/`radio` medidos por su `label`. ¿Se admiten enlaces en línea dentro de un párrafo (los exime WCAG 2.5.8)? | **No por defecto**; si aparece un caso, se trae al usuario con su motivo. |
| D-6 | Letra de 16 px en campos (RN-3): por componente (`text-base lg:text-sm`) o con una regla global en `globals.css` para pantallas táctiles. | **Por componente:** la global también cambiaría admin y comercial en tablets (RN-6). |
| D-7 | `/pet` en horizontal: **(a)** mantener las barras del consumidor y que el marco ocupe el resto (cumple RN-7 tal como está escrito), o **(b)** ocultar las barras en `/pet` en horizontal en pantallas táctiles para que el juego tenga toda la pantalla. | **(a)** en esta spec (es lo que dice RN-7); (b) es un cambio de diseño que conviene ver en el iPhone primero. |
| D-8 · N-1 | Landing, "Empezar a Referir" sin acción. Opciones: conectar (¿a dónde?), ocultar o "Próximamente". | Para ser coherente con la decisión de la landing, **conectar a `/register`**; el usuario decide. |
| D-9 · N-2 | Lateral de anuncios, tarjeta "Disponible en App Store & Google Play" con apariencia tocable y sin acción. | **Ocultar**, igual que la fila 9 ("Descargar App"): no hay app publicada. |
| D-10 · N-3 | Menú de perfil del celular, "Mis compras" → `/purchases` (404). | **Conectar a `/explore/purchases`**, el mismo destino que en escritorio. |
| D-11 · N-4 | Pie de `/login`, "Privacidad" y "Ayuda" → rutas que no existen; no se pueden crear rutas. | **Ocultar** los dos (queda "Términos", que sí existe). Alternativa: "Ayuda" a `mailto:` del soporte. |
| D-12 · N-5 | `Footer` en la landing: enlaces a páginas con sesión y teléfono de relleno. Opciones: (a) en la landing, los enlaces de páginas con sesión llevan a `/login` (con una prop `guest` del `Footer`); (b) en la landing se ocultan esos enlaces; (c) no tocarlo. Y el teléfono: ¿se oculta? | **(b)** en la landing (y en `/forgot-password` y `/unlock-account`, que también son sin sesión), y **ocultar el teléfono** en todas mientras no haya número oficial, coherente con la fila 10. |
| D-13 · N-6 | En celular no se llega a `/games`, `/surveys`, `/plans/mobile-plans`, `/forum`, `/explore/favorites` ni `/explore/participations`. ¿Se agregan al menú de perfil del celular (ya es una hoja que sube desde abajo)? | **Sí, en el menú de perfil**, sin cambiar los 6 botones de la barra inferior. |

## 21. Bloqueos

Ninguno. La spec está aprobada, no choca con `CLAUDE.md` ni con la constitución (la ampliación de
P-13 se propone, no se asume: D-3), no depende de la API y no crea rutas.

Mientras D-1, D-2 y D-3 no estén aprobadas, solo se pueden hacer T1-T3 (Vitest, sin dependencias).
Las tareas que aplican N-1 a N-6 esperan su decisión (D-8 a D-13); el resto del bloque no.
