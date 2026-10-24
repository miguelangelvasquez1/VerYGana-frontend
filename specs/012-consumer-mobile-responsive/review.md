# 012 · Revisión

## Ronda 3: APROBADO

Revisado el 2026-10-24 sobre `beta-front` (`4af0956`) con los cambios sin commitear. Puertas corridas por
el reviewer, en este orden, con las variables públicas ficticias de `CLAUDE.md`:

| Comando | Salida | Resultado |
|---------|--------|-----------|
| `npm test` | 0 | 11 archivos, 700 pruebas |
| `npm run lint:ci` | 0 | 0 errores, 348 avisos = tope 348 (`origin/main`: 360) |
| `npm run build:e2e` | 0 | |
| `npm run test:e2e` | 0 | 252 en verde, 102 omitidas a propósito, 3,4 min (incluye `desktop-1280`, la prueba del uploader y la de paginación) |
| `npx playwright test --project=desktop-1280` ×3 | 0, 0, 0 | 10/10 las tres veces |
| `npm run build` | 0 | First Load JS igual, ruta por ruta, a la columna "después" de `baseline.md` |
| `npx tsc --noEmit` (tras `build`) | 0 | |
| `npm run audit:ci` | 0 | solo las 4 excepciones vigentes |

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · build:e2e + test:e2e ✅

### Bloqueante de la Ronda 2 (`PqrsEvidenceUploader`): resuelto

Medido con una prueba auxiliar en una copia del árbol en el directorio temporal del reviewer (su propio
`build:e2e`; el repositorio no se tocó), abriendo "Nueva solicitud", subiendo una imagen y respondiendo 500
a `prepare-upload`, en `/support` (consumidor) y `/commercial/support` (comercial):

| Ancho | Código | Miniatura | "Reintentar subida" | "Quitar archivo" | Centro de cada botón es ese botón |
|-------|--------|-----------|---------------------|------------------|-----------------------------------|
| 360 | actual | 140 px | 44×44 en `x 37, y 539` | 44×44 en `x 131, y 445` | sí / sí |
| 390 | actual | 155 px | 44×44 en `x 37, y 605` | 44×44 en `x 146, y 496` | sí / sí |
| 360 | Ronda 2 (mutación) | 66 px | 44×44 en `x 47, y 492` | 44×44 en `x 57, y 482` | **no** / sí |
| 390 | Ronda 2 (mutación) | 73,5 px | 44×44 en `x 51, y 550` | 44×44 en `x 64, y 537` | **no** / sí |

- Ya no se enciman a 360 ni a 390; las cajas quedan separadas en las dos direcciones. "Adjuntar foto o
  video" mide 288×44 (360) y 318×44 (390).
- **Escritorio (RN-6/CA-8):** a 1280 px, `HEAD` y el código actual dan las mismas cajas en consumidor y
  comercial (miniatura 96 px, "Reintentar" 16×16 centrado, círculo de "Quitar" 16×16 en la misma
  posición, "Adjuntar" 408×38: `lg:min-h-0` devuelve el alto de antes). La captura de la cuadrícula de
  `/commercial/support` a 1280 es **idéntica byte a byte** entre `HEAD` y el código actual.
- **P-17:** con el código de la Ronda 2 (`grid-cols-4` y "Reintentar" centrado, sin `absolute bottom-0
  left-0`) la prueba nueva de `e2e/touch.spec.ts` ("/support · evidencia con la subida fallida") queda en
  rojo en `expect(hit).toBe(true)` (`touch.spec.ts:126`). Sirve.
- La prueba no usa red: la ruta de `prepare-upload` se simula y el resto lo cierra `e2e/support/network.ts`.

### No bloqueantes de la Ronda 2

| Punto | Estado | Evidencia |
|-------|--------|-----------|
| `CLAUDE.md` sin `pending.ts` | ✅ | `grep pending CLAUDE.md` vacío |
| `exact: true` en "Cerrar" | ✅ | `touch.spec.ts:47`, `:82`, `:92` |
| Aviso de `settle` al agotar 5 s | ✅ | `e2e/support/measure.ts:15-20`: `console.warn` y anotación `warning`. En esta pasada salió **3 veces, todas en `/ads`** (ver sugerencias) |
| Paginación de `SurveyList` | ✅ | prueba "/surveys · paginación con varias páginas" con `page.route` solo en esa prueba; `desktop.spec.ts` no captura `/surveys`, así que ninguna captura cambia. Mutación (botones a `p-2` como en `HEAD`): rojo con "Página anterior" y "Página siguiente" a 34×34 ✅ |
| `spec.md` anota el arreglo de `NavBar` | ✅ | `spec.md:50-54`, junto al bug de la confirmación |

### Cumplimiento

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ local | `e2e/layout.spec.ts` (30 páginas × 360/390/768 y errores a 360) |
| CA-2 | ✅ local | `e2e/touch.spec.ts`: estado inicial, 20 estados de error, 3 modales, paginación de encuestas y uploader con subida fallida; mutaciones en rojo |
| CA-3 | ✅ local | `__tests__/ui/consumerInteractive.test.ts` y `e2e/rn4.spec.ts` (mutaciones de la Ronda 2) |
| CA-4 | ✅ local | `consumerInteractive.test.ts` y `layout.spec.ts` "CA-4 · DOM" |
| CA-5 | ✅ local | `rn4.spec.ts` "CA-5" |
| CA-6 | ✅ parte automática | `e2e/forms.spec.ts`; teclado real y zoom dependen de U-3 |
| CA-7 | ✅ parte automática | `e2e/pet.spec.ts`; orientación real depende de U-3 |
| CA-8 | ✅ local | sin cambios en `src/app/{admin,commercial,game-designer,compliance}`, `middleware`, `services`, `hooks`, `types`; compartidos restauran con `lg:`; `desktop-1280` 4/4 en esta ronda; uploader idéntico a 1280 |
| CA-9 | ✅ local | job "Pruebas en navegador" y tope 348 ≤ 360; que corra en el CI en menos de 10 min depende de U-2; que sea obligatorio, de M-1 |
| CA-10 | pendiente (U-3) | tabla en `spec.md`; pasada en Android e iPhone reales |
| CA-11 | ✅ local | `e2e/purchase.spec.ts` |

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

- `/ads` agota el tope de 5 s de `settle` (3 avisos en la pasada completa: "CA-4 · DOM", una de
  `rn4.spec.ts` y "CA-2 · áreas táctiles"; "CA-1" a 360 y 390 tardó 4,7 s, al borde). Probable causa: el
  fixture `e2e/fixtures/api/ads/next.json` tiene `contentUrl: "/ads/ad1.mp4"`, que el navegador pide al
  front (`/ads/...`) y no a la API simulada, y el `<video>` no termina de cargar. La medición de `/ads`
  puede ser de un estado de carga; las pruebas pasan. Servir un video mínimo desde la API simulada o
  responder esa ruta con `page.route`. El aviso nuevo hizo su trabajo.
- `e2e/touch.spec.ts:53`: el fixture se lee con `process.cwd()`; desde otra carpeta la prueba falla con
  `ENOENT` y no por el tamaño. Mejor una ruta relativa al archivo de la prueba.
- `e2e/touch.spec.ts:54`: `/\/surveys\?/` también casa `http://127.0.0.1:3100/surveys?_rsc=…` (prefetch
  del front) y le respondería JSON. Hoy no afecta (no se navega en cliente), pero conviene acotarlo a
  `MOCK_API_ORIGIN`.
- Entre 640 y 1023 px el uploader pasa de 4 a 3 columnas también en comercial. Es la convención `lg:`
  aceptada para los compartidos; el escritorio (≥ 1024) queda igual.
- Siguen vigentes de rondas anteriores: `inputMode="email"` del login y el botón de llave de
  `PurchaseItemsPreview` (U-3); hosts de `next/image` remotos (U-3); capturas `-darwin`.

### Lo que se comprobó y está bien

- Sin `any`, `@ts-ignore`, `eslint-disable` ni `console.*` nuevos en `src`; lint igual al tope (348).
- Textos y `aria-label` nuevos en español.
- P-16: sin datos personales nuevos en URL ni en logs; las pruebas usan datos ficticios.
- P-1/P-14: dependencias (`@playwright/test`, `next` 15.5.28, `zod`) sin cambios desde la Ronda 2;
  `security/audit-exceptions.json` sin cambios.
- RN-8: First Load JS de las 30 rutas igual a la columna "después" de `baseline.md`.

### Lo que queda fuera del reviewer

- U-2: abrir el PR y ver los cuatro checks en verde, cada uno en menos de 10 minutos (CA-9).
- M-1: Miguel agrega "Pruebas en navegador" a los checks obligatorios de `main` (CA-9).
- U-3: pasada en Android e iPhone reales y anotarla en `spec.md` (CA-10, y la parte manual de CA-6 y
  CA-7).

## Ronda 2: CAMBIOS

Revisado el 2026-10-24 sobre `beta-front` (`4af0956`) con los cambios sin commitear. Puertas corridas por
el reviewer, en este orden, con las variables públicas ficticias de `CLAUDE.md`:

| Comando | Salida | Resultado |
|---------|--------|-----------|
| `npm test` | 0 | 11 archivos, 700 pruebas |
| `npm run lint:ci` | 0 | 0 errores, 348 avisos = tope 348 (`origin/main`: 360) |
| `npm run build:e2e` | 0 | |
| `npm run test:e2e` | 0 | 250 en verde, 102 omitidas a propósito, 3,3 min (incluye `desktop-1280`) |
| `npx playwright test --project=desktop-1280` ×3 | 0, 0, 0 | 10/10 las tres veces; `consumer-products` estable |
| `npm run build` | 0 | First Load JS igual a la columna "después" de `baseline.md` |
| `npx tsc --noEmit` (tras `build`) | 0 | |
| `npm run audit:ci` | 0 | solo las 4 excepciones vigentes |

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · build:e2e + test:e2e ✅

### Estado de la Ronda 1

| Punto | Estado | Evidencia |
|-------|--------|-----------|
| B-1 (pruebas de RN-4) | ✅ | `e2e/rn4.spec.ts` cubre filas 10-14, N-2, N-3, N-4, D-12 (con y sin sesión) y D-13. Mutaciones abajo |
| B-2 (`aria-label`) | ✅ | los 9 botones citados llevan nombre en español; `PqrsEvidenceUploader` también |
| B-3 (44 px en modales y errores) | ⚠️ | los botones miden 44 px y `touch.spec.ts` abre tres modales y mide 20 estados de error; **pero** en `PqrsEvidenceUploader` los dos botones de 44 px quedan encimados (bloqueante 1) |
| B-4 (`baseline.md`, T26) | ✅ | nota corregida; la medición de esta ronda coincide |
| `CLAUDE.md` sin "o `CI`" | ✅ | |
| `CLAUDE.md` sin `pending.ts` | ❌ | `CLAUDE.md:121` sigue diciendo "`e2e/support/pending.ts` lista lo que hoy falla y solo baja"; el archivo no existe. `tasks.md` (S-1) lo da por hecho |
| P-19 con cuatro checks | ✅ | regla y excepción de `docs/constitution.md` |
| `aria-label` del carrito en español | ✅ | `CartButton`, `CartDrawer`, `CartItem`; `layout.spec.ts` busca "Carrito de compras" |
| `GameCard` sin bloques en `<button>` | ✅ | solo `<span>`; sin acción queda `div` |
| Captura `consumer-products` estable | ✅ | 4 corridas de `desktop-1280` en verde (la de `test:e2e` y 3 sueltas) |

### Mutaciones (P-17)

Hechas en una copia del árbol en el directorio temporal del reviewer, con su propio `build:e2e` (el
repositorio no se tocó):

| Mutación | Prueba | Resultado |
|----------|--------|-----------|
| Vuelve un botón "Llamar Ahora" a `/plans/mobile-plans` (fila 10) | `rn4` filas 10 y 11 | ❌ rojo: `getByText('Llamar Ahora')` 1 ≠ 0 ✅ |
| Vuelve un botón "Chat en Vivo" (fila 11) | `rn4` filas 10 y 11 | ❌ rojo: `getByText('Chat en Vivo')` 1 ≠ 0 ✅ |
| Vuelve un ícono de red `<a href="#">` al `Sidebar` (fila 14) | `rn4` fila 14 y N-2 | ❌ rojo: `a[href="#"]` 1 ≠ 0 ✅ (el `Sidebar` está oculto con `hidden md:block` a 360, pero el localizador cuenta nodos ocultos) |
| Vuelve la tarjeta "App Store & Google Play" al `Sidebar` (N-2) | `rn4` fila 14 y N-2 | ❌ rojo: `getByText(/App Store\|Google Play/)` 1 ≠ 0 ✅ |
| `NavBar` sin la guarda de `mobileProfileSheetRef` (con las clases actuales) | `rn4` N-3 | ❌ rojo: la URL se queda en `/home` ✅ |
| `NavBar` sin la guarda **y** con la capa de `HEAD` (sin `invisible`) | `rn4` N-3 | ❌ rojo igual: el defecto ya existía antes de la spec, no lo trajo `invisible` ✅ |

Las cuatro de RN-4 que el implementer no vio en rojo quedan atrapadas. Nota: D-13 solo comprueba
`href` y visibilidad, sin tocar; el clic real lo prueba N-3, que basta porque los once enlaces comparten
el mismo mecanismo.

### Desviación: arreglo del menú de perfil del celular (`NavBar.tsx`)

- **Correcto.** En `HEAD`, el `mousedown` global de "clic fuera" comprobaba solo `profileMenuRef` (el menú
  de escritorio, en la barra `hidden lg:block`). Un toque en la hoja del celular disparaba `mousedown`,
  cerraba la hoja (`pointer-events-none`) y el `click` caía en la página de abajo: **ningún** enlace de esa
  hoja navegaba con el puntero (tampoco "Mi Perfil", "Soporte" ni "Cerrar Sesión"). La guarda
  `!mobileProfileSheetRef.current?.contains(target)` (`NavBar.tsx:104-108`) lo corrige.
- **Mínimo.** Una referencia y una condición; no cambia el comportamiento de escritorio (la hoja está
  fuera del árbol de `profileMenuRef` y es `lg:hidden`). Los otros cambios del archivo (`invisible` en la
  capa cerrada, `max-h` con scroll, lista `mobileMenuItems`) son de T13/D-13 y ya estaban en la Ronda 1.
- **Dentro de la spec.** Sin él, N-3/D-10 y D-13 no se cumplen ("cuando se toca cada elemento, hace lo
  que su fila dice", CA-3).
- **P-17.** La prueba N-3 de `rn4.spec.ts` falla sin el arreglo (mutaciones de arriba).
- **Anotarlo en `spec.md`:** sí, como se hizo con el bug de `purchases/[id]/confirmation` (Decisiones de
  la Puerta 2): un defecto previo encontrado en la implementación, arreglado aquí, con su prueba. Lo
  decide el coordinator con el usuario; el reviewer no toca `spec.md`.

### `settle` con `networkidle` acotado a 5 s (`e2e/support/measure.ts:15`)

- En una copia con un aviso en el `catch`, la pasada completa de `mobile-360` (175 pruebas) **no llegó
  nunca** al tope de 5 s: todas las páginas quedan inactivas antes. Hoy no esconde nada.
- Riesgo: `measureOverflow` y `smallTouchTargets` miden una sola vez; si una página futura no queda
  inactiva (una consulta que reintenta, SSE), se mediría el estado de carga sin aviso. Las aserciones de
  `expect` de `rn4.spec.ts` sí esperan solas. No bloquea (ver sugerencias).

### Cumplimiento

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `e2e/layout.spec.ts` (30 páginas × 360/390/768 y errores a 360) |
| CA-2 | ⚠️ | `e2e/touch.spec.ts`: estado inicial, 20 estados de error y 3 modales en verde; el uploader de evidencias no se mide abierto y sus botones se enciman (bloqueante 1) |
| CA-3 | ✅ | `__tests__/ui/consumerInteractive.test.ts` y `e2e/rn4.spec.ts` (todas las filas de RN-4, N-1 a N-4, D-12, D-13; mutaciones en rojo) |
| CA-4 | ✅ | `consumerInteractive.test.ts` y `layout.spec.ts` "CA-4 · DOM" |
| CA-5 | ✅ | `rn4.spec.ts` "CA-5" |
| CA-6 | ✅ (parte automática) | `e2e/forms.spec.ts`; teclado real y zoom en U-3 |
| CA-7 | ✅ (parte automática) | `e2e/pet.spec.ts`; pasada real en U-3 |
| CA-8 | ✅ | `git diff --stat HEAD` vacío en carpetas de otros roles, `middleware`, `services`, `hooks`, `types`; compartidos nuevos de esta ronda (`PqrsDetailModal`, `PqrsEvidenceUploader`, `CreatePqrsModal`, `KeyTransactionList`) restauran con `lg:`; `desktop-1280` 4/4 |
| CA-9 | ✅ local | job "Pruebas en navegador"; tope 348 ≤ 360. CI real en U-2, check obligatorio en M-1 |
| CA-10 | pendiente (U-3) | tabla en `spec.md`; no bloquea |
| CA-11 | ✅ | `e2e/purchase.spec.ts` |

### Bloqueantes

1. `src/components/pqrs/PqrsEvidenceUploader.tsx:51-59` y `:63-72` (RN-2, CA-2; regresión de la corrección
   de B-3): en el estado de error de una evidencia, "Reintentar subida" (44×44, centrado en la miniatura)
   y "Quitar archivo" (44×44, esquina superior derecha) se enciman. Medido en `/support` → "Nueva
   solicitud" a 360 px con una imagen cuya subida falla: Reintentar en `x 47-91, y 495-539`, Quitar en
   `x 57-101, y 485-529`; `document.elementFromPoint` en el centro de "Reintentar" devuelve **"Quitar
   archivo"**. El usuario que toca el ícono de reintentar borra el archivo. La miniatura mide ~64 px
   (`grid-cols-4`), donde no caben dos cuadros de 44 px sin cruzarse. Afecta a `CreatePqrsModal`
   (`/support`) y a `ReportIssueModal` (compras). En `HEAD` no pasaba (botones de ~16 px separados).
   → Que no se crucen por debajo de `lg`: por ejemplo `grid-cols-3 lg:grid-cols-4` (miniatura de ~90 px)
   con "Reintentar" en la esquina inferior izquierda y "Quitar" en la superior derecha, o "Reintentar"
   fuera de la miniatura; escritorio igual que hoy con `lg:`. Agregar a `touch.spec.ts` una prueba que abra
   el uploader con una subida fallida (`setInputFiles` + ruta de la API que responda 500) y compruebe 44 px
   **y** que el centro de cada botón es ese mismo botón (`elementFromPoint`); verla en rojo con el código
   actual.

### Sugerencias (no bloquean)

- `CLAUDE.md:121`: quitar "`e2e/support/pending.ts` lista lo que hoy falla y solo baja." Se pidió en la
  Ronda 1 y `tasks.md` (S-1) lo marca hecho, pero sigue ahí.
- `spec.md`: anotar el arreglo del menú de perfil del celular junto al bug de la confirmación (ver arriba).
- `e2e/touch.spec.ts:45`, `:55`, `:65`: `getByRole('button', { name: 'Cerrar' })` sin `exact: true`
  también casa "Cerrar Sesión" de la hoja del perfil. Hoy pasa porque la hoja cerrada es `invisible` (sale
  del árbol de accesibilidad); si esa clase se quita, las tres pruebas fallan por modo estricto y no por el
  tamaño. Usar `exact: true`.
- `e2e/support/measure.ts:15`: escribir un aviso (`test.info().annotations` o `console.warn`) cuando se
  agota el tope de 5 s, para que una página que nunca queda inactiva no se mida en silencio en su estado
  de carga.
- `touch.spec.ts` no ve en rojo la paginación de `SurveyList` ni el "Reintentar" de referidos (lo dice el
  implementer: sin fixture de varias páginas; el segundo ya medía 44 px). Con el bloqueante 1 se cubre el
  uploader; la paginación queda para cuando haya fixture.
- Siguen vigentes de la Ronda 1: `inputMode="email"` del login y el botón de llave de
  `PurchaseItemsPreview` (U-3); hosts de `next/image` remotos (U-3); capturas `-darwin`.

### Lo que se comprobó y está bien

- Sin `any`, `@ts-ignore`, `eslint-disable` ni `console.*` nuevos en `src`; lint igual al tope (348).
- Textos nuevos al usuario y `aria-label` en español; ninguno en inglés en lo tocado.
- P-16: sin datos personales nuevos en URL ni en logs; las pruebas usan datos ficticios.
- RN-6/CA-8: `PqrsDetailModal` (`lg:m-0 lg:h-auto lg:w-auto`) y `PqrsEvidenceUploader` (`lg:top-1
  lg:right-1 lg:h-auto lg:w-auto`, mismo fondo y tamaño en el `span`) se ven igual en escritorio;
  `CreatePqrsModal` y `PqrsPanel` (compartidos con `/commercial/support`) con `lg:min-h-0`;
  `KeyTransactionList` solo lo usa `/explore/transactions`.
- RN-8: First Load JS de esta ronda igual a la columna "después" de `baseline.md`.

## Ronda 1: CAMBIOS

Revisado el 2026-10-24 sobre `beta-front` (`4af0956`) con los cambios sin commitear del árbol de
trabajo. Puertas corridas por el reviewer, en este orden y con las variables públicas ficticias de
`CLAUDE.md`:

| Comando | Salida | Resultado |
|---------|--------|-----------|
| `npm test` | 0 | 11 archivos, 700 pruebas en verde |
| `npm run lint:ci` | 0 | 0 errores, 348 avisos = tope 348 (tope de `origin/main`: 360) |
| `npm run build:e2e` | 0 | 24 s |
| `npm run test:e2e` | 0 | 214 en verde, 102 omitidas a propósito (pruebas atadas a un proyecto), 2,9 min; incluye las 10 capturas de `desktop-1280` en verde |
| `npm run build` | 0 | |
| `npx tsc --noEmit` (tras `build`) | 0 | |
| `npm run audit:ci` | 0 | sin avisos altos fuera de excepción; las 4 excepciones vigentes (`postcss` ×2, `xlsx` ×2) |

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · build:e2e + test:e2e ✅

### Mutaciones (P-17)

Hechas en una copia del árbol en el directorio temporal del reviewer (el repositorio no se tocó). Cada
mutación se aplicó y se corrió la prueba que debería atraparla:

| Mutación | Prueba | Resultado |
|----------|--------|-----------|
| `<button>` dentro del `Link` "Empezar a ganar" (`HomePage.tsx`) | `consumerInteractive.test.ts` | ❌ rojo: `button-in-link` ✅ |
| `PlanCard` sin `disabled` (botón muerto) | `consumerInteractive.test.ts` | ❌ rojo: `dead-button` ✅ |
| `<a href="#">` en `Sidebar.tsx` | `consumerInteractive.test.ts` | ❌ rojo: `dead-link` ✅ |
| "Iniciar Sesión" de `NavBarNoAuth` a 40 px (`min-h-10`) | `touch.spec.ts` `/` | ❌ rojo: `"Iniciar Sesión" 141x40` ✅ |
| Volver a `useParams().purchaseId` en la confirmación (CA-11) | `purchase.spec.ts` | ❌ rojo: no hay pedido a `/purchases/1` ✅ |
| Quitar `inputMode="numeric"` del campo de llaves del checkout | `forms.spec.ts` checkout | ❌ rojo: `Expected "numeric", Received ""` ✅ |
| "Mis compras" del menú del celular otra vez a `/purchases` (N-3, D-10) | ninguna | verde: **no se atrapa** |
| `Footer` ignora `guest` (D-12: enlaces con sesión en la landing) | ninguna | verde: **no se atrapa** |
| Fila 12 vuelve a decir "Contratar Plan" (con `disabled`) | ninguna | verde: **no se atrapa** |
| Enlace "Privacidad" a `/privacidad` otra vez en `/login` (N-4, D-11), como `Link` de 44 px | `layout`/`touch`/`forms` de `/login` | rojo solo por *timeout* de `networkidle` (el prefetch de Next de una ruta 404), no por una aserción; como `<a>` pasaría |

### Cumplimiento

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `e2e/layout.spec.ts` (30 páginas × 360/390/768, y estado de error a 360 en las que lo tienen) |
| CA-2 | ⚠️ | `e2e/touch.spec.ts` a 360 mide solo el estado inicial de cada página; modales y estados de error del alcance siguen con botones de menos de 44 px (bloqueante 3) |
| CA-3 | ⚠️ | Parte estática: `__tests__/ui/consumerInteractive.test.ts` (`KNOWN_VIOLATIONS` vacío; mutaciones en rojo). Comportamiento: `e2e/rn4.spec.ts` cubre filas 1-9, N-1 (D-8), carrusel y CA-5; **faltan** filas 10-14, N-2 a N-4 (D-9 a D-11), D-12 y D-13 (bloqueante 1) |
| CA-4 | ✅ | `consumerInteractive.test.ts` (estático) y `layout.spec.ts` "CA-4 · DOM" (`a button`, `button a`…) |
| CA-5 | ✅ | `rn4.spec.ts` "CA-5" (visible en viewport a 360 y lleva a `/login`) |
| CA-6 | ✅ (parte automática) | `e2e/forms.spec.ts` (login, registro, verificación, perfil, checkout, soporte); teclado real, zoom y campo visible quedan para U-3 |
| CA-7 | ✅ (parte automática) | `e2e/pet.spec.ts` (R-3 con `matchMedia`, vertical, cargando, error, horizontal); pasada real en U-3 |
| CA-8 | ✅ | `git diff --stat HEAD` vacío en `src/app/{admin,commercial,compliance,game-designer}`, `src/components/{Admin,commercial,compliance,game-designer}`, `src/middleware.ts`, `src/services`, `src/hooks`, `src/types`; `desktop-1280` 10/10 en verde en esta corrida. Compartidos revisados en el diff: `NotificationsPanel`, `CommercialStorefrontView`, `ProductInfoCard`, `SearchBar`, `Pqrs*` restauran escritorio con `lg:`; `Footer` y `NavBarNoAuth` con `md:`; `NavBar` de escritorio con las mismas clases de `getNavClass` |
| CA-9 | ✅ local | Job `e2e` "Pruebas en navegador" (10 min, sin secretos, tres nombres previos intactos); tope de lint 360 → 348. La prueba real en el CI es U-2 y el check obligatorio es M-1 |
| CA-10 | pendiente (U-3) | Tabla de `spec.md` creada con las 30 rutas; la llena el usuario. No bloquea esta ronda |
| CA-11 | ✅ | `e2e/purchase.spec.ts` (mutación en rojo) |

Tabla de RN-4: filas 1-9 y 15 con prueba de navegador; filas 10-11 (bloque comentado borrado), 12-13
("Próximamente", `disabled`, `aria-disabled`, `cursor-default`, sin `hover`), 14 (redes quitadas), N-2
(tarjeta de tiendas quitada), N-3 ("Mis compras" → `/explore/purchases`), N-4 ("Privacidad" y "Ayuda"
quitadas), D-12 (`Footer guest` en `/`, `/login`, `/register`, `/verify`, `/forgot-password`,
`/unlock-account`; teléfono quitado) y D-13 (menú de perfil con las 6 páginas) están bien en el código,
pero sin prueba de comportamiento. La prueba estática de CA-3 solo atrapa que vuelvan como botón sin
acción o enlace a `#`; no atrapa un enlace a una ruta 404 (N-3, N-4), la tarjeta de tiendas (era un
`div`), los enlaces con sesión del pie, ni que "Próximamente" cambie de texto.

### T26 · RN-8 (peso de las páginas)

Comparé `next build` de `HEAD` (exportado con `git archive` a un directorio temporal, con los mismos
`node_modules`, Next 15.5.28) contra el árbol actual, ruta por ruta, con
`.next/app-build-manifest.json`:

| Ruta | HEAD | Ahora | Chunks nuevos en la entrada de la página (gzip) |
|------|------|-------|-------------------------------------------------|
| `/checkout` | 147 kB | 152 kB | `1356` = runtime de `next/image` (5,2 kB) |
| `/games` | 142 kB | 147 kB | `1356` = `next/image` (5,2 kB) |
| `/purchases/[id]/confirmation` | 155 kB | 164 kB | `1356` = `next/image` (5,2 kB) **y** `2619` = runtime de `next/link` (3,4 kB) |
| `/products` | 154 kB | 158 kB | `2619` = runtime de `next/link` (3,4 kB) |
| `/commercial/[id]` | 154 kB | 157 kB | `2619` = `next/link` (3,4 kB); además `637` (3,9 kB) se reparte en `3641` (3,7 kB) |

- **Causa de `/products` y `/commercial/[id]`:** `ConsumerProductCard.tsx` dejó `useRouter` +
  `<div onClick>` y pasó a `import Link from "next/link"` (enlace extendido de la tarjeta y enlace al
  comercio), que es lo que pide RN-5 en T19. Ninguna de las dos páginas importaba `next/link` antes;
  ahora su entrada arrastra el chunk `2619` (se reconoce por `useLinkStatus`, `isLocalURL`,
  `prefetch`). El tamaño propio de las páginas no cambia (`/products` 6,8 → 6,77 kB).
- **No es peso real descargado:** `2619` (`next/link`) y `1356` (`next/image`) ya están en la lista de
  chunks de `src/app/(consumer)/layout.tsx` (los usa `NavBar`), así que el navegador ya los tiene al
  entrar a cualquiera de estas páginas. "First Load JS" de `next build` los cuenta otra vez por página.
  Lo único que sí crece es el chunk propio de cada página (< 0,7 kB).
- **Otras correcciones a `baseline.md`:** `/purchases/[id]/confirmation` sube +9 por `next/image`
  **y** `next/link` (la página pasó sus botones a `Link`, también por RN-5), no solo por `next/image`.
  La bajada de `/explore/profile/edit` (186 → 182) **no** es de esta spec: `HEAD` con Next 15.5.28 ya da
  182; es efecto de la actualización de seguridad. `/ads` (-1) sí es de la spec (bloque del `Sidebar`).
- **Veredicto:** subida explicada y justificada por la propia spec (RN-5 en T19, RN-8 para
  `next/image`); no hay que corregir código. T26 se puede marcar hecha cuando `baseline.md` cambie la
  nota (bloqueante 4).

### Bloqueantes

1. `e2e/rn4.spec.ts:68-77` (CA-3, P-17): solo hay prueba de comportamiento con sesión para la fila 1.
   Faltan las que pedían `plan.md` 7.3 ("una prueba por fila de RN-4 y por hallazgo N-n decidido") y la
   propia T24: filas 10 y 11 (no existen en `/plans/mobile-plans`), 12 y 13 (dicen "Próximamente",
   `disabled`, `cursor: default`), 14 (no hay enlaces de redes en `/ads`), N-2/D-9 (no hay "App Store" en
   `/ads`), N-3/D-10 ("Mis compras" del menú de perfil lleva a `/explore/purchases`), N-4/D-11 (no hay
   "Privacidad" ni "Ayuda" en `/login`), D-12 (sin sesión, el pie de `/` no enlaza a `/raffles`,
   `/products`, `/plans/mobile-plans`, `/ads`, `/forum`; no hay teléfono) y D-13 (el menú de perfil a 360
   tiene las seis páginas nuevas). N-3 y N-4 eran enlaces a 404 que se arreglaron sin la prueba que falla
   sin el arreglo (P-17); las mutaciones de N-3, D-12 y fila 12 pasan en verde. → Agregar esas pruebas
   en `rn4.spec.ts` (cada una abre la página, toca o busca el elemento y comprueba destino, ausencia o
   estado) y verlas en rojo con el defecto reintroducido.

2. Botones de solo ícono sin nombre accesible (requisito no funcional "botones con texto o
   `aria-label`"; `plan.md` 8; RN-5). Tocados por el diff: `src/app/(consumer)/products/page.tsx:490`
   (cerrar filtros), `src/app/(consumer)/raffles/[id]/results/page.tsx:113` (ampliar imagen del premio),
   `src/components/transactions/KeyTransactionList.tsx:104` y `:114` (página anterior/siguiente). Del
   alcance y sin tocar: `src/components/consumer/profile/AvatarPickerModal.tsx:56`,
   `src/components/consumer/surveys/SurveyList.tsx:75` y `:85`,
   `src/components/consumer/surveys/SurveyPlayerModal.tsx:232` y `:376`. → `aria-label` en español
   ("Cerrar filtros", "Ampliar imagen", "Página anterior", "Página siguiente", "Cerrar").

3. RN-2 sin cumplir fuera del estado inicial (CA-2; `plan.md` 2.3 E promete "cada modal … su botón de
   cerrar de 44 px"). `touch.spec.ts` solo mide la página recién cargada, así que no ve modales ni
   estados de error: `AvatarPickerModal.tsx:56` (≈28 px), `SurveyList.tsx:75`/`:85` (≈32 px),
   `SurveyPlayerModal.tsx:232`/`:376` (≈32-36 px) y `:467`/`:473` (≈40 px; el modal es la acción
   principal de `/surveys`), `src/components/pqrs/PqrsDetailModal.tsx:46` (ícono de 20 px sin relleno;
   compartido con comercial: restaurar con `lg:`), `src/components/pqrs/PqrsEvidenceUploader.tsx:62`
   (≈18 px; compartido), `src/app/(consumer)/explore/referrals/page.tsx:137` ("Reintentar" del estado de
   error, ≈40 px) y `src/app/(consumer)/commercial/[id]/page.tsx:75` ("Volver" del estado de error).
   → Llevarlos a 44 px (con `lg:` en los compartidos) y extender `touch.spec.ts` para abrir al menos el
   modal de encuesta, el de detalle de PQRS, el selector de avatar y medir el estado de error a 360,
   de modo que la prueba falle si vuelven a bajar.

4. `specs/012-consumer-mobile-responsive/baseline.md:49-56` y `tasks.md:376-382` (RN-8, T26): la nota dice
   que para `/products` y `/commercial/[id]` "no hay un import nuevo que lo explique" y atribuye +9 de la
   confirmación solo a `next/image`. → Reemplazar con la causa de la sección T26 de arriba (chunk de
   `next/link` por `ConsumerProductCard`, ya cargado por el layout; la confirmación suma `next/image` y
   `next/link`; `/explore/profile/edit` baja por Next 15.5.28) y marcar T26 hecha. Sin cambios de código.

### Sugerencias (no bloquean)

- `CLAUDE.md:121`: dice "`e2e/support/pending.ts` lista lo que hoy falla
  y solo baja", pero T27 borró ese archivo. Quitar la frase.
- `docs/constitution.md`, P-19: la regla y la excepción siguen diciendo "tres checks"; `ci.yml` y
  `CLAUDE.md` ya dicen cuatro. Alinear P-19 con D-2.
- `aria-label` en inglés en archivos que el diff tocó (P-18, textos al usuario): `CartButton.tsx`
  ("Shopping cart"), `CartDrawer.tsx` ("Close cart"), `CartItem.tsx` ("Decrease quantity", "Increase
  quantity", "Remove item"). Eran previos; si se traducen, `layout.spec.ts` busca "Shopping cart".
- `src/components/consumer/games/GameCard.tsx:33` y `:48`: el `<button>` envuelve un `<h3>` y `<div>`;
  el modelo de contenido de `<button>` es solo texto de frase (RN-5, "bien formados"). Usar `<span>`.
- `src/components/auth/LoginForm.tsx:472`: el campo es "Correo electrónico o teléfono" y ahora abre el
  teclado de correo (`inputMode="email"`), que en iOS no trae la fila de números. Confirmarlo en U-3;
  si molesta, volver a `text`.
- `next/image` nuevo con URL remotas de la API (`GameCard` `frontPageUrl`, imágenes de compra en
  checkout y confirmación): en el e2e salen de `public/`, así que no se probó que sus hosts estén en
  `images.remotePatterns`. Revisarlo en U-3 con datos reales (si un host falta, la imagen no carga).
- `e2e/desktop.spec.ts` `consumer-products` (falló 1 de 5 según T30; aquí pasó): es un problema de la
  prueba, no de la app. La página tiene scroll infinito e imágenes `next/image` perezosas servidas por
  el optimizador recién arrancado, y la espera es `networkidle` acotado + 800 ms. Esperar a que las
  `img` visibles tengan `complete && naturalWidth > 0` antes de capturar, o enmascarar las imágenes de
  producto con `mask`. Solo corre en local, así que no afecta al CI.
- Foco visible: `plan.md` 8 pedía `focus-visible:ring`; no se agregó, pero los `Link` y botones nuevos
  conservan el contorno por defecto del navegador (ninguno lleva `outline-none`). Aceptable.
- `src/components/purchases/PurchaseItemsPreview.tsx:42-48`: el botón de la llave pasó de 28 a 44 px en la esquina de una
  miniatura; comprobar en U-3 que no tape el producto.
- `e2e/desktop.spec.ts-snapshots/` suma 3 MB de PNG solo de macOS (`-darwin`); quien regenere en otro
  sistema obtendrá otros nombres. Documentado en la prueba; solo tenerlo presente.

### Lo que se comprobó y está bien

- P-2: ninguna página ni layout nuevo con `'use client'`; `/home` y `/pet` siguen de servidor.
- P-6: sin cambios en `params` (las páginas de cliente usan `useParams`).
- P-7: los `<a>` internos pasaron a `Link`; quedan `href="#rifas"`/`#tienda` de la landing (anclas) y
  `mailto:`; 6 `<img>` pasaron a `next/image` (12 avisos menos con los 6 imports sin uso de
  `mobile-plans`), tope 360 → 348.
- P-9: sin `any`, `@ts-ignore` ni `eslint-disable` nuevos en `src`, `e2e` ni `__tests__/ui`.
- P-10/P-11: sin hooks, servicios, `queryKey` ni formularios nuevos; solo atributos y clases.
- P-16: sin `console.*`, `localStorage` ni datos personales nuevos en URL. Los únicos datos en URL de las
  pruebas son ficticios (`/verify?email=consumidor%40example.test`, `session_token` de juego ficticio).
- P-13 enmendada y su aplicación: Playwright solo habla con `127.0.0.1` (`network.ts` aborta el resto y
  cierra WebSocket), `mockApi.mjs` escucha solo en `127.0.0.1`, la cookie de sesión se firma con
  `TEST_SECRET` (el ficticio de `__tests__/middleware/session.ts`) y el JWT de acceso es falso
  (`alg: none`, firma "firma-ficticia"); `serve.mjs` arranca sin `MIDDLEWARE`.
- `ci.yml`: job `e2e` "Pruebas en navegador", `timeout-minutes: 10`, sin secretos de GitHub, Chromium
  solo, reporte subido solo si falla; los nombres "Lint, tipos y build", "Pruebas" y "Auditoría de
  dependencias" intactos; las capturas no corren en CI (`grepInvert` con `CI`).
- P-1: `@playwright/test` 1.64.1 exacto en `devDependencies`, aprobado en la Puerta 2 (D-1); no entra
  en `audit:ci` (`--omit=dev`).
- RN-6: sin cambios en carpetas de otros roles; compartidos con `lg:`/`md:` que restauran escritorio.
- "Próximamente" (filas 12-13): `disabled`, `aria-disabled`, gris apagado, `cursor-default`, sin
  `hover`: no parece tocable.

### Cambios ajenos a la 012 (no cuentan para el veredicto)

**Actualización de seguridad** (`next` y `eslint-config-next` 15.5.27 → 15.5.28, `zod` ^4.3.6 →
^4.6.6, `follow-redirects` 1.16.0 → 1.16.1 en el lockfile, versiones en la constitución y
`CLAUDE.md`):

- Instalado coincide con lo declarado (`next` 15.5.28, `zod` 4.6.6, `follow-redirects` 1.16.1,
  `eslint-config-next` 15.5.28). `audit:ci` pasa sin excepciones nuevas; las cuatro vigentes siguen
  correspondiendo a avisos reales. Sin dependencias nuevas de producción (P-1).
- Efecto en RN-8 de la 012: con 15.5.28, `/explore/profile/edit` baja 4 kB y `/checkout`/`/login` se
  mueven 1 kB respecto de `baseline.md` (medida con 15.5.27). Conviene que `baseline.md` lo diga
  (bloqueante 4).
- Sin problemas.

**Spec 010, `scripts/lint-ratchet.mjs` y su prueba** (`CI` ya no cuenta como modo CI; solo
`GITHUB_ACTIONS`):

- El código y la prueba son coherentes (`__tests__/scripts/lintRatchet.test.ts` comprueba que con
  `CI=1` y `LINT_BASE_CAP` se usa el tope forzado). En GitHub Actions `GITHUB_ACTIONS` siempre está
  definida, así que el CI sigue en modo cerrado.
- **Problema:** `CLAUDE.md`, sección "Lint: el tope de avisos solo baja", sigue diciendo "En GitHub
  Actions (`GITHUB_ACTIONS` definida, aunque vacía, o `CI`) `LINT_BASE_CAP` y `LINT_BASE_REF` se
  ignoran". Quitar "o `CI`" para que coincida con el script.
