# 016 · Revisión

## Ronda 1: CAMBIOS

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ✅ (equivalente) · navegador ❌ (26 fallos ajenos en lo que corre el CI; 3 de la 016 en `desktop.spec.ts`, que solo corre en local)

Revisado el 2026-10-29 sobre `dev` (`a911175`) más el árbol sin commitear de la 014, la 015 y la 016. Puertas
corridas por el revisor con las `NEXT_PUBLIC_*` ficticias de `CLAUDE.md`.

| Puerta | Resultado | Detalle |
|---|---|---|
| `npm test` | ✅ | 42 archivos, 1136 pruebas en verde (incluidas `__tests__/middleware` y `__tests__/ui`). |
| `lint:ci` | ✅ equivalente | En Windows el script sale con 3 (ajeno, ver 015). `npx next lint --format json`: 0 errores y **348 avisos** = tope. `.lint-max-warnings` = 348 en el árbol, en `HEAD` y en `origin/main`: no sube (P-19). Los únicos avisos de archivos del diff son ajenos: `Sidebar.tsx:163` (`<img>`, antes línea 154), `CreateAdForm.tsx:852` y `CommercialProfileSeller.tsx:113,132` (`any` previos). Ningún archivo nuevo de la 016 tiene avisos. |
| `npm run build` | ✅ | First Load JS: `/commercial-onboarding` 245 kB (antes 239), `/commercial/profile/documents` 187 kB, `/commercial/profile/information-requests` 183 kB, `…/[requestPublicId]` 200 kB (ƒ), `/commercial/profile/tax-info` 214 kB. |
| `npx tsc --noEmit` | ✅ | Tras el `build`, y de nuevo tras el segundo `build` posterior a `build:e2e`. |
| `audit:ci` | ✅ equivalente | `npm audit --omit=dev --json` + `evaluateAudit` con `security/audit-exceptions.json` (`.exceptions`) y la fecha de hoy: `ok`, código 0; las 4 altas (2 `postcss`, 2 `xlsx`) con excepción vigente hasta el 2026-11-30; 2 moderadas que la puerta no bloquea. Sin cambios en `security/`, `package.json` ni `package-lock.json`. |
| `build:e2e` + `test:e2e` | ❌ | Chromium instalado con `npx playwright install chromium` (en `AppData/Local/ms-playwright`, fuera del repo). 241 pasan, 102 omitidas, **36 fallan**. Ver "Pruebas en navegador". |

### Pruebas en navegador

- **26 fallos ajenos a la 016**, en pruebas que sí corre el CI (`layout`, `touch`, `smoke`, `ads`, `forms`):
  58 pedidos `GET /key-promotions/active` y 1 `POST /purchases/quote` sin fixture (código ya commiteado en
  `dev`: `useKeyPromotions`, `PurchaseService`; no están en el diff); `ads.spec.ts:66` (video sin
  `<video>` y el "Me gusta" que no se deja tocar) y `forms.spec.ts:105` (checkout sin "campo de llaves"),
  páginas que el diff no toca. **El check "Pruebas en navegador" del CI fallará por ellos** con o sin la 016.
- **10 fallos de `desktop.spec.ts`** (solo local): no hay capturas de referencia `win32`. Además, en tres
  (`commercial-support`, `commercial-ally`, `commercial-product`) hay un pedido sin fixture que **sí es de la
  016**: `GET /commercials/information-requests` (bloqueante 3).
- La corrida escribió 10 capturas `e2e/desktop.spec.ts-snapshots/*-win32.png` que no existían; las borré para
  dejar el árbol como estaba. `test-results/` está en `.gitignore`.
- Los paneles de notificaciones del consumidor (`navbar.spec.ts`, `layout` y `touch` en `/home`) no fallan por
  el cambio de `NotificationsPanel`.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `expediente.test.ts` (`groupExpediente`: orden del diccionario, vigente arriba, historial por `supersededAt`, sin `PENDING`/`ORPHANED`); `ExpedienteDocumentGroup.tsx` pinta todo lo pedido; manual T14.1 pendiente. |
| CA-2 | ✅ | `uploadFlow.test.ts` (`replacesDocumentId` = id y mismo tipo), `expedienteTexts.test.ts` (aviso); `ExpedienteUploadDialog.tsx:119`; manual T14.2 pendiente. |
| CA-3 | ✅ | `expediente.test.ts` (`addableDocumentTypes`), `uploadFlow.test.ts` (sin la clave); `ExpedienteScreen.tsx:86-91` no pinta el botón sin tipos; manual T14.3 pendiente. |
| CA-4 | ✅ | `uploadFlow.test.ts` (validación antes de `prepare`, que no se llama; textos de RN-3; esquema con `mode: 'onChange'`); manual T13.1 pendiente. |
| CA-5 | ✅ | `uploadFlow.test.ts` (fallo en `put`/`confirm`, reintento desde `prepare`, `uploadErrorMessage`, `shouldRefetchExpedienteAfterError`); el diálogo no hace `reset` tras el error; manual T13.2 pendiente. |
| CA-6 | ❌ | `openDocument.test.ts` prueba la función pura, pero el adaptador de `refetch` de `ExpedienteScreen.tsx:56` nunca rechaza: con la lista caída abre la URL vencida (bloqueante 1). Barrido de `downloadUrl` en `expedienteStatic.test.ts` ✅. |
| CA-7 | ✅ | `expedienteServices.test.ts` (solo cuatro métodos), `expedienteStatic.test.ts` (`hasDeleteOrEdit`); manual T14.5 pendiente. |
| CA-8 | ✅ | `requests.test.ts` (`splitRequestsByTab` y orden); `InformationRequestsList.tsx`; manual T15 pendiente. |
| CA-9 | ✅ | `requests.test.ts` (`buildTimeline`), `expedienteTexts.test.ts`; manual T17.1 pendiente. |
| CA-10 | ✅ | `respond.test.ts` (`buildRespondBody` sin claves vacías), `expedienteServices.test.ts`, `expedienteKeys.test.ts`; `justResponded` en el detalle; manual T16.2 y T17.3 pendientes. |
| CA-11 | ✅ | `respond.test.ts` (vacío, espacios, 2000 / 2001); `maxLength` en el área; manual T16.1 pendiente. |
| CA-12 | ⚠️ | El caso del criterio se cumple (`currentDocumentOfType` probado; botón dentro del ítem `DOCUMENT`), pero volver a cargar el mismo tipo deja en la respuesta un documento ya reemplazado y el envío falla (bloqueante 2). |
| CA-13 | ✅ | `requests.test.ts` (`canRespond`), `expedienteTexts.test.ts`; `InformationRequestDetail.tsx:239-260`; manual T17.4 pendiente. |
| CA-14 | ✅ | `requests.test.ts` (`needsToneBanner` en los diez triggers), `expedienteTexts.test.ts` y `expedienteStatic.test.ts` ("sanción"); banner azul `role="note"`; manual T17.5 pendiente. |
| CA-15 | ✅ | `respond.test.ts` (`respondErrorOutcome`), `expedienteKeys.test.ts` (`respondRejected`); el formulario no se reinicia. Ver sugerencia sobre el mensaje que desaparece. Manual T16.4 pendiente. |
| CA-16 | ✅ | `expedienteStatic.test.ts` (`guardsDoubleSubmit` sobre `RespondForm.tsx`) + botón `disabled`; manual T16.3 pendiente. |
| CA-17 | ✅ | `requests.test.ts` (`isUuid`); `enabled: isUuid(...)` y la vista "No encontramos" antes de mirar `isPending`; 404 → misma vista; manual T19.2 pendiente. |
| CA-18 | ✅ | `expedienteTexts.test.ts` (`requestsNotice`), `requests.test.ts` (`countAwaitingResponse`); el aviso va en un `Dialog` sobre el asistente, que no se desmonta; `canUploadDocuments={false}` → nota de RN-9; manual T22 pendiente. |
| CA-19 | ✅ | `expedienteKeys.test.ts` (responder invalida `list`); las tres insignias leen la misma clave; manual T20 pendiente. |
| CA-20 | ✅ | `informationRequestNotifications.test.ts` (títulos exactos), `expedienteStatic.test.ts` (literal con un solo dueño); solo el `Header` comercial pasa la prop; manual T21 pendiente. |
| CA-21 | ✅ | `expedienteStatic.test.ts` (`linksToRequests` sobre `CommitmentBlock.tsx`); manual T24 pendiente. |
| CA-22 | ✅ | `expediente.test.ts` (`supportSelectorState` en éxito), `taxProfileSchema.test.ts`; fila nueva con `null`; manual T23.1 pendiente. |
| CA-23 | ✅ | `expediente.test.ts` ("Documento ya no vigente", "Documento guardado" en carga y error, D-5), `taxProfileSchema.test.ts` (no vigente bloquea; `null` no comprueba); `vigentIdsRef` solo con la consulta en éxito; manual T23.2-T23.4 pendientes. |
| CA-24 | ✅ | `noPiiLeaks.test.ts` (17 destinos nuevos) y `expedienteStatic.test.ts` (`downloadUrl`, `uploadUrl`, `holderIdentification`); ningún `console.*`, almacenamiento ni query en los archivos de la 016; manual T25 pendiente. |
| CA-25 | ⚠️ | `npm test`, lint (equivalente), build, tsc y audit (equivalente) como antes o mejor; sin dependencias nuevas; las tres páginas clasificadas por el prefijo `/commercial`. La 016 agrega un pedido sin fixture a `desktop.spec.ts` (bloqueante 3). |

### Bloqueantes

1. `src/components/commercial/expediente/ExpedienteScreen.tsx:56` (RN-5, CA-6, P-17): el adaptador
   `refetch: async () => (await query.refetch()).data` nunca rechaza. TanStack Query v5 traga el error de
   `refetch()` (`queryObserver.js`: sin `throwOnError`, `promise.catch(noop)`) y el resultado conserva el
   `data` anterior, con la `downloadUrl` vencida. Con la lista caída, `openExpedienteDocument` redirige la
   pestaña a la URL vieja (R2 responde "expirada") en vez de cerrarla y mostrar "No pudimos abrir el
   documento". El caso 4 de `openDocument.test.ts` usa un `refetch` que rechaza, así que no lo atrapa.
   → Que el adaptador lance si la lectura falla (`query.refetch({ throwOnError: true })`, o comprobar
   `result.isError`), sacarlo a una función pura (por ejemplo, en `openDocument.ts`) y probarla con un
   resultado `{ isError: true, data: [docVieja] }` que hoy pasaría.
2. `src/components/commercial/information-requests/InformationRequestDetail.tsx:143-148` (RN-8, CA-12):
   `onUploaded` agrega el documento nuevo pero no quita de la respuesta el que acaba de reemplazar. Si el
   empresario vuelve a usar "Cargar documento" en el mismo ítem (se equivocó de archivo) o hay dos ítems
   `DOCUMENT` del mismo tipo, `replaces` es el documento que ya está en la lista: queda `SUPERSEDED` y
   "Enviar respuesta" falla con el 400 "El documento N no está vigente en su expediente.", con un id
   interno que el usuario no puede relacionar con el nombre de la lista. → Al subir, quitar de `documents`
   el `id` de `uploadTarget.replaces` (es la lógica de RN-8: llevarla a una función pura con su prueba).
3. `e2e/support/mockRoutes.mjs` (P-13, CA-25): el Sidebar comercial ahora monta `PendingRequestsBadge`, que
   pide `GET /commercials/information-requests` en todas las páginas comerciales. En `desktop.spec.ts`
   (`commercial-support`, `commercial-ally`, `commercial-product`) ese pedido no tiene fixture y la prueba
   falla con "pedidos a la API simulada sin fixture". El nuevo ítem del menú cambia además esas tres
   capturas. → Agregar el fixture (lista vacía, `e2e/fixtures/api`) y regenerar las tres capturas de
   referencia en el sistema donde se generaron las actuales. No bloquea el CI (esa prueba solo corre en
   local), pero rompe una prueba existente.

### Desviaciones que reportó el implementer

1. **Barridos solo sobre los archivos de la 016.** Aceptada. `OnboardingWizard.tsx` (contrato, 015) y
   `5-DocumentsStep.tsx` usaban `downloadUrl`/`uploadUrl` desde antes y CA-24 habla de estas pantallas.
   Consecuencia: un uso nuevo de `downloadUrl` en otra carpeta de `src/components/commercial` no lo atrapa
   ningún barrido.
2. **`uploadUrl` → `url` en `useExpediente.ts:26`.** Aceptada: solo cambia el nombre del parámetro.
3. **T5: sin causa en la etapa `upload`.** Aceptada y correcta para P-16: el error del `fetch` del navegador
   puede arrastrar la URL firmada, y `uploadErrorMessage` da el texto genérico en esa etapa de todos modos.
4. **T6: `null` de `window.open` con `noopener`.** Aceptada: con `noopener` el navegador siempre devuelve
   `null`, así que tratarlo como fallo rompería todos los "Ver". Consecuencia: si un bloqueador impide la
   pestaña de una URL fresca, no hay aviso (ver sugerencias).

### Comprobaciones pedidas

- **Contrato con la API** (`../VerYGanaAPI`, solo lectura): `CommercialExpedienteController` (GET lista,
  `prepare-upload` con `@Valid`, `{documentId}/confirm`, `hasRole('COMMERCIAL')`),
  `CommercialInformationRequestController` (`@PathVariable UUID`, `RespondRequest` con `@Valid`),
  `InformationRequestDTOs` (`RequestView`, `ItemView`, `ResponseView`, `ReviewView`; `issuedAt` es
  `ZonedDateTime`, `dueDate` `LocalDate`), `ExpedienteDocumentDTO` y `DocumentUploadPermissionDTO`
  coinciden campo a campo con `src/types` (nombres, nulabilidad y fechas). `respond` recorta, quita
  repetidos y exige mensaje o documento como el front; `@Size(max = 2000)` es sobre el texto sin recortar,
  igual que `respondSchema`. `TaxProfileServiceImpl:357-358` valida cada `supportDocumentId` con
  `requireOwnedValidatedDocument(id, commercialId, null)`: cualquier tipo, propio y `VALIDATED`, lo mismo que
  `vigentSupportIds`.
- **Rutas (P-4, P-5):** las tres `page.tsx` cuelgan de `/commercial` (`ROLE_COMMERCIAL`) y
  `routeProtection.test.ts` las clasifica y prueba con las seis identidades. `src/middleware.ts`,
  `next.config.ts` y `package*.json` sin diff. El diff de `__tests__/middleware/routeAccess.ts`
  (`/explore/recognitions`) no es de la 016: el archivo es de las 09:44, antes de la spec (10:49), y solo
  alinea la tabla con el middleware de `HEAD`, que ya tenía esa ruta. No cambia ningún rol. Sin route handlers
  nuevos.
- **P-2 / P-6:** las tres páginas son de servidor; el detalle hace `await params`. `RequestTimeline` sin
  `'use client'`; `TaxAndEstablishmentsLinks` sigue de servidor.
- **P-9:** ningún `any`, `@ts-ignore` ni `eslint-disable` nuevo.
- **P-10:** claves únicas (`commercial-expediente`, `commercial-information-requests`); confirmar invalida el
  expediente y `onboardingDocuments`; responder hace `setQueryData` del detalle e invalida lista y detalle; un
  400 invalida los dos (D-3). La insignia y la lista comparten la consulta (`select`).
- **P-11:** los dos formularios nuevos usan react-hook-form + `zodResolver`, con guarda `useRef` y botón
  deshabilitado; el selector de soporte usa `Controller` dentro del formulario de la 014.
- **P-16:** `downloadUrl` solo en `openDocument.ts`, `uploadUrl` solo en `uploadFlow.ts`,
  `holderIdentification` en ningún componente; errores leídos con `readApiError` (sin `config`); pestañas en
  estado local (sin `?tab=`); ningún `console.*` ni almacenamiento. La única URL del front con un dato es
  `/commercial/profile/information-requests/{UUID}`.
- **`NotificationsPanel`:** admin (`admin/shared/Header.tsx`), consumidor (`NavBar.tsx`, dos usos) y
  diseñador (`GameDesignerPanel.tsx`) no pasan `getNotificationHref`; sin la prop, `content` es el mismo
  marcado de antes dentro del mismo `div`. `__tests__/ui` en verde y `navbar.spec.ts` sin fallos.
- **`Dialog` con `dismissible`:** los siete usos previos (sedes, cierre de sede, rechazo del contrato, texto
  del compromiso, resumen de sedes, `TaxInfoScreen` y el aviso del onboarding) no pasan la prop; con el valor
  por defecto `true`, Escape, el fondo y la X cierran como antes. Solo `ExpedienteUploadDialog` pasa
  `dismissible={!isPending}`.
- **Ficha de la 014:** el perfil y el paso del onboarding usan el mismo `TaxProfileForm`; el selector no
  bloquea (deshabilitado solo en carga, sin comprobación con la lista en carga o error) y
  `GET /commercials/documents` no exige `COMPLETED`. `__tests__/taxProfile` en verde. Falta la comprobación
  a mano (T23).

### Sugerencias (no bloquean)

- `src/components/commercial/information-requests/RespondForm.tsx:143-149`: la spec ("Enviando") pide
  "Enviar respuesta" deshabilitado **con indicador**; hoy solo se deshabilita. El diálogo de carga sí usa
  `Loader2`.
- `src/components/commercial/information-requests/RespondForm.tsx:136-140` (CA-15): tras un 400 por estado,
  la relectura cambia el estado, el formulario se desmonta y el `message` de la API desaparece casi al
  instante. Conviene mostrar ese mensaje en el detalle o comprobarlo bien en T16.4.
- `src/components/commercial/information-requests/InformationRequestDetail.tsx:77`: `documents` no se vacía
  al responder; si la solicitud vuelve a `OBSERVED` sin salir de la página, el formulario nuevo arranca con
  los documentos de la respuesta anterior.
- `src/components/commercial/expediente/ExpedienteScreen.tsx:68`: en v5, un `refetch` fallido con datos ya
  cargados pone `isError` y reemplaza toda la lista por el error. `query.isError && !query.data` conservaría
  la lista.
- `src/components/commercial/expediente/ExpedienteScreen.tsx:57-58`: con URL fresca, un bloqueador de
  ventanas deja el clic sin respuesta y sin aviso (desviación 4).
- `src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx:27`: usar `INFORMATION_REQUESTS_PATH`
  en vez del literal, como el Sidebar.
- `src/components/commercial/information-requests/RequestTimeline.tsx:26,45`: las claves
  (`response-${at}-${receivedAt}` repite la fecha; `review-${at}-${result}`) pueden chocar con dos entradas
  iguales en el mismo instante; mejor usar el índice de `buildTimeline`.
- Ajeno a la 016, para el CI: el check "Pruebas en navegador" fallará por los fixtures que faltan
  (`/key-promotions/active`, `/purchases/quote`) y por `ads.spec.ts:66` y `forms.spec.ts:105`, que vienen de
  commits de `dev`.

### Comprobaciones manuales pendientes (las hace el usuario)

T12 (regresión de "Agregar sede": Escape, fondo y X), T13 (4 puntos del diálogo de carga), T14 (6 puntos de
la pantalla del expediente, incluido "Ver" pasados 4 minutos y con la red caída tras corregir el bloqueante
1), T15 (pestañas, orden, vacíos y teclado), T16 (4 puntos del formulario: vacío, claves del cuerpo, doble
clic y 400/red), T17 (6 puntos del detalle, más volver a cargar el mismo tipo tras corregir el bloqueante 2),
T19 (2 puntos con `MIDDLEWARE=ACTIVE`), T20 (insignias), T21 (notificaciones en escritorio y en la hoja
móvil; el panel del consumidor sin cambios), T22 (4 puntos del onboarding), T23 (4 puntos del selector de
soporte, en el perfil y en el onboarding), T24 (enlace de la aclaración pendiente) y T25 (DevTools: consola,
almacenamiento y barra de direcciones). Safari para "Ver" (R-2).

## Ronda 2: APROBADO

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ❌ ajeno (aviso nuevo de `follow-redirects`, sin cambios en dependencias) · navegador ❌ ajeno (0 fallos de la 016 en lo que corre el CI)

Revisado el 2026-11-02 sobre `dev` (`a911175`) más el árbol sin commitear de la 014, la 015 y la 016. Puertas
corridas por el revisor con las `NEXT_PUBLIC_*` ficticias de `CLAUDE.md`.

| Puerta | Resultado | Detalle |
|---|---|---|
| `npm test` | ✅ | 42 archivos, 1145 pruebas en verde (antes 1136: +9 de B1 y B2). |
| `lint:ci` | ✅ equivalente | En Windows el script sigue saliendo con 3 ("`next lint` no produjo reporte", ajeno). `npx next lint --format json`: 0 errores y **348 avisos** = tope. `.lint-max-warnings` = 348 en el árbol, en `HEAD` y en `origin/main`: no sube (P-19). Ningún archivo nuevo o corregido de la 016 tiene avisos; el único del diff comercial sigue siendo `Sidebar.tsx:163` (`<img>`, previo). |
| `npm run build` | ✅ | First Load JS sin cambios relevantes: `/commercial-onboarding` 245 kB, `/commercial/profile/documents` 187 kB, `/commercial/profile/information-requests` 183 kB, `…/[requestPublicId]` 201 kB (ƒ, antes 200), `/commercial/profile/tax-info` 214 kB. |
| `npx tsc --noEmit` | ✅ | Tras el `build`, y de nuevo tras el segundo `build` posterior a `build:e2e`. `documentsFromRefetch(await query.refetch())` tipa contra el `QueryObserverResult` real. |
| `audit:ci` | ❌ ajeno | En Windows el script sale con 3 (`spawnSync npm ENOENT`, ajeno). Equivalente (`npm audit --omit=dev --json` + `evaluateAudit` con la fecha de hoy): **código 1** por un aviso alto **publicado después de la ronda 1**: `GHSA-mrwp-f3q8-3g9p` en `follow-redirects@1.16.1` (vía `axios@1.20.0`), con corrección disponible. `package.json`, `package-lock.json` y `security/` sin diff: afecta igual a `HEAD` y a `main`, no lo introduce la 016. Las 4 excepciones (`postcss`, `xlsx`) siguen vigentes hasta el 2026-11-30. **El check "Auditoría de dependencias" del CI fallará** con o sin la 016 hasta que alguien actualice `follow-redirects` (≥ 1.16.2) en su propio PR. |
| `build:e2e` + `test:e2e` | ❌ ajeno | 243 pasan, 102 omitidas, **34 fallan** (ronda 1: 36). Ver abajo. |

### Pruebas en navegador

- **24 fallos ajenos en pruebas que corre el CI** (`layout`, `touch`, `smoke`, `forms`): los mismos de la ronda 1,
  58 pedidos `GET /key-promotions/active` y 1 `POST /purchases/quote` sin fixture, y `forms.spec.ts:105`
  (checkout). `ads.spec.ts:66` pasó esta vez (inestable, ajeno).
- **Ningún pedido a `/commercials/information-requests` sin fixture** (0 apariciones en la salida): B3 resuelto.
- **10 fallos de `desktop.spec.ts`** (solo local), todos por "A snapshot doesn't exist … `-win32.png`": no hay
  referencias `win32`, solo `darwin`. Las tres comerciales ya no fallan por fixture. Siguen pendientes de
  regenerar en la plataforma original (darwin) porque el Sidebar tiene un ítem nuevo: queda para el usuario
  (ver abajo), no bloquea la 016.
- La corrida escribió 10 capturas `*-win32.png`; las borré y la carpeta de capturas quedó igual que antes.

### Verificación de los bloqueantes de la ronda 1

1. **B1 resuelto.** `src/lib/expediente/openDocument.ts:42-47` (`documentsFromRefetch`) lanza si el resultado trae
   `isError` o `status 'error'`; `ExpedienteScreen.tsx:56` lo usa en el adaptador. P-17: con la condición
   sustituida por `if (false)` (en el archivo, restaurado después y comprobado con `cmp`) `openDocument.test.ts`
   da **3 fallos** (los dos de rechazo y el que comprueba que la pestaña se cierra sin abrir la URL vencida).
2. **B2 resuelto.** `src/lib/informationRequests/respond.ts:40-48` (`addUploadedDocument`) quita el `replacedId`;
   `InformationRequestDetail.tsx:146-151` lo usa con `uploadTarget.replaces?.id`. P-17: con el filtro quitado
   (`const kept = [...prev]`, restaurado y comprobado) `respond.test.ts` da **2 fallos** (mismo tipo dos veces y
   dos ítems del mismo tipo). Si el empresario abre "Cargar documento" antes de que termine la relectura del
   expediente, `replaces` puede ser el documento anterior: la API (`CommercialExpedienteDocumentServiceImpl`,
   `requireReplaceable`) rechaza la carga por no estar `VALIDATED`, así que el caso acaba en un error visible
   del diálogo, nunca en un `SUPERSEDED` dentro de la respuesta.
3. **B3 resuelto** en lo que toca al código: `e2e/fixtures/api/commercials/information-requests.json` (`[]`, la
   forma de la lista que consume `InformationRequestService`) y la ruta en `e2e/support/mockRoutes.mjs:78`.
   Las tres capturas de referencia se regeneran a mano (ver pendientes).

### Sugerencias aplicadas (S4–S7)

- **S4** (`RespondForm.tsx:155`): `Loader2` con `aria-hidden` mientras `busy`; el botón sigue `disabled`. Sin regresión.
- **S5** (`InformationRequestDetail.tsx:270`): `setDocuments([])` en `onResponded`. Correcto: el formulario se
  desmonta al pasar a `RESPONDED` y, si vuelve a `OBSERVED`, arranca vacío.
- **S6** (`TaxAndEstablishmentsLinks.tsx:3,28`): usa `INFORMATION_REQUESTS_PATH`; sigue siendo de servidor (P-2).
- **S7** (`RespondForm.tsx:82,89`; `InformationRequestDetail.tsx:80,242-246`): el 400 con `message` sube al
  detalle por `onRejected` y se pinta con `role="alert"` aunque el formulario se desmonte; se limpia al enviar,
  al responder y al cargar un documento. El formulario ya no lo duplica (`!refetch` en la línea 143). El texto
  es el `message` de la API leído con `readApiError` (sin `config` ni cabeceras, P-16).
- Constitución en lo corregido: sin `any`, `@ts-ignore` ni `eslint-disable` (P-9); las claves y las
  invalidaciones no cambian, la relectura tras el 400 sigue en `onError` del hook (P-10); react-hook-form +
  `zodResolver` y guarda `useRef` intactos (P-11); ningún `console.*`, almacenamiento ni dato en URL (P-16).

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | Sin cambios desde la ronda 1: `expediente.test.ts`; manual T14.1 pendiente. |
| CA-2 | ✅ | Sin cambios: `uploadFlow.test.ts`, `expedienteTexts.test.ts`; manual T14.2 pendiente. |
| CA-3 | ✅ | Sin cambios: `expediente.test.ts`, `uploadFlow.test.ts`; manual T14.3 pendiente. |
| CA-4 | ✅ | Sin cambios: `uploadFlow.test.ts`; manual T13.1 pendiente. |
| CA-5 | ✅ | Sin cambios: `uploadFlow.test.ts`; manual T13.2 pendiente. |
| CA-6 | ✅ | `openDocument.test.ts` (`documentsFromRefetch` con `{ data: anterior, isError: true }` y el flujo completo: pestaña cerrada, URL vencida no abierta), en rojo con el arreglo revertido; `ExpedienteScreen.tsx:56` lo usa. Barrido de `downloadUrl` en `expedienteStatic.test.ts`. Manual T14.4 (pasados 4 minutos y con la red caída) pendiente. |
| CA-7 | ✅ | Sin cambios: `expedienteServices.test.ts`, `expedienteStatic.test.ts`; manual T14.5 pendiente. |
| CA-8 | ✅ | Sin cambios: `requests.test.ts`; manual T15 pendiente. |
| CA-9 | ✅ | Sin cambios: `requests.test.ts`, `expedienteTexts.test.ts`; manual T17.1 pendiente. |
| CA-10 | ✅ | `respond.test.ts`, `expedienteServices.test.ts`, `expedienteKeys.test.ts`; documentos vaciados al responder (S5); manual T16.2 y T17.3 pendientes. |
| CA-11 | ✅ | Sin cambios: `respond.test.ts`; manual T16.1 pendiente. |
| CA-12 | ✅ | `respond.test.ts` (`addUploadedDocument`: mismo tipo dos veces, dos ítems del mismo tipo, sin duplicar), en rojo con el arreglo revertido; `currentDocumentOfType` en `expediente.test.ts`. Manual T17.2 (volver a cargar el mismo tipo y enviar) pendiente. |
| CA-13 | ✅ | Sin cambios: `requests.test.ts`, `expedienteTexts.test.ts`; manual T17.4 pendiente. |
| CA-14 | ✅ | Sin cambios: `requests.test.ts`, `expedienteTexts.test.ts`, `expedienteStatic.test.ts`; manual T17.5 pendiente. |
| CA-15 | ✅ | `respond.test.ts` (`respondErrorOutcome`), `expedienteKeys.test.ts`; el mensaje del 400 ya se conserva en el detalle (S7, sin prueba automática: interfaz); manual T16.4 pendiente. |
| CA-16 | ✅ | `expedienteStatic.test.ts` (`guardsDoubleSubmit`) + botón `disabled` con indicador (S4); manual T16.3 pendiente. |
| CA-17 | ✅ | Sin cambios: `requests.test.ts`; manual T19.2 pendiente. |
| CA-18 | ✅ | Sin cambios: `expedienteTexts.test.ts`, `requests.test.ts`; manual T22 pendiente. |
| CA-19 | ✅ | Sin cambios: `expedienteKeys.test.ts`; manual T20 pendiente. |
| CA-20 | ✅ | Sin cambios: `informationRequestNotifications.test.ts`, `expedienteStatic.test.ts`; manual T21 pendiente. |
| CA-21 | ✅ | Sin cambios: `expedienteStatic.test.ts`; manual T24 pendiente. |
| CA-22 | ✅ | Sin cambios: `expediente.test.ts`, `taxProfileSchema.test.ts`; manual T23.1 pendiente. |
| CA-23 | ✅ | Sin cambios: `expediente.test.ts`, `taxProfileSchema.test.ts`; manual T23.2-T23.4 pendientes. |
| CA-24 | ✅ | Sin cambios: `noPiiLeaks.test.ts`, `expedienteStatic.test.ts`; manual T25 pendiente. |
| CA-25 | ✅ | `npm test`, lint (equivalente, 348 = tope), build y tsc en verde; sin dependencias ni excepciones nuevas; la 016 ya no agrega pedidos sin fixture. Los fallos de auditoría (`follow-redirects`) y de navegador (`/key-promotions/active`, `/purchases/quote`, `forms.spec.ts:105`, capturas `win32`) existen sin la 016. |

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

- `__tests__/expediente/expedienteStatic.test.ts`: ninguna prueba ata `ExpedienteScreen.tsx` a
  `documentsFromRefetch` ni `InformationRequestDetail.tsx` a `addUploadedDocument`; si alguien vuelve a escribir
  `(await query.refetch()).data` en el componente, las pruebas siguen en verde. Un barrido estático de una línea
  por cada uno (como `guardsDoubleSubmit`) lo cubriría hasta que haya pruebas de componentes.
- Siguen abiertas de la ronda 1: `ExpedienteScreen.tsx:68` (`query.isError && !query.data` para no tapar la lista
  con un `refetch` fallido), `ExpedienteScreen.tsx:56-58` (sin aviso si un bloqueador impide la pestaña con URL
  fresca) y `RequestTimeline.tsx:26,45` (claves que pueden chocar; mejor el índice).
- Ajeno a la 016, para el CI: actualizar `follow-redirects` a ≥ 1.16.2 (`GHSA-mrwp-f3q8-3g9p`) en un PR propio,
  y los fixtures `/key-promotions/active` y `/purchases/quote` y `forms.spec.ts:105`, que vienen de commits de `dev`.

### Comprobaciones manuales pendientes (las hace el usuario)

- **Capturas de referencia:** regenerar en la plataforma de las actuales (darwin) `commercial-support`,
  `commercial-ally` y `commercial-product` con
  `npx playwright test --project=desktop-1280 --update-snapshots`, porque el Sidebar comercial tiene el ítem
  "Solicitudes de información".
- T12 (regresión de "Agregar sede": Escape, fondo y X), T13 (4 puntos del diálogo de carga), T14 (6 puntos de
  la pantalla del expediente, incluido "Ver" pasados 4 minutos y con la red caída), T15 (pestañas, orden, vacíos
  y teclado), T16 (4 puntos del formulario: vacío, claves del cuerpo, doble clic con el indicador, y 400/red con
  el aviso que se queda en el detalle), T17 (6 puntos del detalle, más volver a cargar el mismo tipo y enviar sin
  el 400 de "no vigente"), T19 (2 puntos con `MIDDLEWARE=ACTIVE`), T20 (insignias), T21 (notificaciones en
  escritorio y en la hoja móvil; el panel del consumidor sin cambios), T22 (4 puntos del onboarding), T23 (4
  puntos del selector de soporte, en el perfil y en el onboarding), T24 (enlace de la aclaración pendiente) y T25
  (DevTools: consola, almacenamiento y barra de direcciones). Safari para "Ver" (R-2).

## Ronda 3: APROBADO

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ❌ (ya existía, ajeno a la 016)

- `npm test`: 42 archivos, 1151 pruebas en verde.
- Lint: `npx next lint --format json` → 0 errores, 348 avisos = `.lint-max-warnings` (348) = `origin/main` (348).
  `npm run lint:ci` en esta máquina sale con **3** ("`next lint` no produjo reporte"), no con 0 (ver abajo).
- `npm run build` y, después, `npx tsc --noEmit`: salida 0.
- Auditoría: `npm run audit:ci` sale con 3 aquí (`spawnSync npm ENOENT`, misma causa que el lint). El
  equivalente (`npm audit --omit=dev --json`) solo da los avisos altos ya conocidos: `follow-redirects`
  (`GHSA-mrwp-f3q8-3g9p`, sin excepción, ya existía en la ronda 2) y `postcss`/`xlsx` (con excepción). Sin
  cambios en `package.json`, `package-lock.json`, `security/` ni `.lint-max-warnings`.
- e2e no se repitió: ninguna prueba de `e2e/` visita `/commercial/profile/documents` ni el detalle de
  solicitudes (solo el fixture de la lista en `mockRoutes.mjs`), así que S9 y S11 no tocan lo que cubre.

### Verificación de los cambios desde la ronda 2

- **S8** (`__tests__/expediente/expedienteStatic.test.ts:218-232`): con el adaptador de
  `ExpedienteScreen.tsx:56` cambiado a `(await query.refetch()).data` la prueba nueva se pone en rojo (1 fallo);
  restaurado y comprobado con `cmp`. Cumple la sugerencia.
- **S9** (`src/lib/expediente/expediente.ts:114-116`, `ExpedienteScreen.tsx:68,95-99`): la vista de error solo
  sin datos; con lista cargada y refetch fallido (incluido el que provoca "Ver" con B1) se conserva la lista con
  el aviso `refreshFailed` (español, `role="status"`). Pruebas puras en `expediente.test.ts:175-187`.
- **S10 revertida por completo**: `ExpedienteScreen.tsx:57-58` vuelve a abrir la URL con
  `'noopener,noreferrer'` y la pestaña vacía sin URL; `openDocument.ts:63-65` ignora el `null` (desviación 4) y
  solo la pestaña vacía anula `opener` a mano (`:69-70`). `documentsFromRefetch` (`:43-48`) intacto. P-17: con la
  condición de B1 sustituida por `if (false)` `openDocument.test.ts` da **3 fallos** (los dos rechazos y el flujo
  que cierra la pestaña sin abrir la URL vencida); restaurado y comprobado con `cmp`.
- **S11** (`RequestTimeline.tsx:26,45`): claves `response-${index}` / `review-${index}`; el orden sale de
  `buildTimeline`, determinista. Correcto.
- Constitución sobre lo nuevo: sin `any`, `@ts-ignore` ni `eslint-disable` (P-9); sin `console.*`, ni URL
  firmada fuera de `openDocument.ts` (P-16); claves de Query sin cambios (P-10); textos en español (P-18).

### Sobre "lint:ci salió con 0"

No se reproduce: aquí `npm run lint:ci` sale con 3. En `scripts/lint-ratchet.mjs` el único `exit(0)` es
`:182`, después de leer el reporte y de `evaluateLint`; sin reporte, `:171-174` sale siempre con 3. El script
no puede dar 0 sin comparar. Lo más probable es que el 0 reportado fuera el de una tubería (`… | tail`, que
devuelve la salida del último comando). `git diff --stat -- scripts/` está vacío: es ajeno a la 016.

La causa de que no haya reporte en Windows sí es real y ajena a la 016: `scripts/lint-ratchet.mjs:168` llama
`spawnSync('npx', …)` sin `shell`, y en Windows `npx` es `npx.cmd`, así que falla con `ENOENT` (`run.error`, no
`stderr`, por eso no se imprime la causa). `scripts/audit-gate.mjs` tiene el mismo problema con `npm`
("`spawnSync npm ENOENT`"). En el CI (Linux) no pasa.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 a CA-5 | ✅ | Sin cambios desde la ronda 2. |
| CA-6 | ✅ | `openDocument.test.ts` (en rojo con B1 revertido) + `expedienteStatic.test.ts:218` (en rojo sin el adaptador); `expediente.test.ts` (`shouldShowLoadError`). Manual T14.4 pendiente. |
| CA-7 a CA-11 | ✅ | Sin cambios desde la ronda 2. |
| CA-12 | ✅ | `respond.test.ts` + `expedienteStatic.test.ts:227` (ata `onUploaded` a `addUploadedDocument`). Manual T17.2 pendiente. |
| CA-13 a CA-24 | ✅ | Sin cambios desde la ronda 2 (S11 no cambia lo que muestra la línea de tiempo de CA-9). |
| CA-25 | ✅ | `npm test`, lint equivalente (348 = tope), build y tsc en verde; sin dependencias ni excepciones nuevas. Auditoría: solo `follow-redirects`, que ya existía. |

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

- Ninguna prueba ata `ExpedienteScreen.tsx:58` a `'noopener,noreferrer'`; si alguien lo quita la suite sigue en
  verde. Un barrido estático de una línea en `expedienteStatic.test.ts` lo fijaría.
- Ajeno a la 016, en un PR propio: `scripts/lint-ratchet.mjs:168` y `scripts/audit-gate.mjs` deberían lanzar
  `npx`/`npm` con `shell: process.platform === 'win32'` (o `npx.cmd`) e imprimir `run.error` cuando exista, para
  que las puertas corran en Windows. Sigue pendiente `follow-redirects` ≥ 1.16.2.
- Siguen las comprobaciones manuales y la regeneración de capturas listadas en la ronda 2.
