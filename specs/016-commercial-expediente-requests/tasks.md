# 016 · Tareas (entrega C)

Plan: `plan.md` de esta carpeta. Spec: `spec.md`. Contrato:
`specs/014-tax-profile-and-compliance-case/backend-contract.md` (0.2, 1.2, 1.4, 2, 3, 4.5, 4.6 y 6).

## Reglas para todas las tareas

**Prueba primero.** La lógica sin interfaz lleva su prueba primero (P-13, P-17). Se escribe, se ve fallar
(el módulo o la función no existen, o la regla no está) y se anota en la tarea qué falló. Después se
implementa. Las pruebas viven en `__tests__/` y corren en entorno `node` (Node 22 trae `File` global, que
usan las pruebas de la carga).

**Tareas de interfaz.** Se verifican con `npx tsc --noEmit`, con eslint sobre los archivos tocados y con una
comprobación manual en el navegador. Esta entrega no tiene pruebas de componentes ni de Playwright propias.
**Las comprobaciones manuales las hace el usuario.** Quien implementa las deja marcadas como PENDIENTES en la
nota de la tarea, sin darlas por hechas.

**Variables.** Antes de verificar, en la misma terminal:

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

**Tipos de rutas.** `npx tsc --noEmit` usa los tipos de rutas de `.next/types`. Las páginas nuevas los
cambian: si `tsc` falla por tipos de rutas ausentes o viejos, corre antes `npm run build`.

**Línea base (2026-10-29).** `npm test`: 32 archivos, 1012 pruebas, todo en verde. `npx next lint`: 348
avisos = tope. Eslint sobre los archivos que se modifican: un solo aviso ajeno, el `<img>` de
`src/components/commercial/layout/Sidebar.tsx` (línea 154), que no se toca. El control de lint por tarea:

- archivos **nuevos**: `npx eslint --max-warnings=0 <archivos>`;
- archivos **modificados**: el mismo número de avisos que en la línea base (0, salvo `Sidebar.tsx` con 1).

`.lint-max-warnings` no se sube nunca (P-19). Si una tarea deja menos de 348 avisos en `npx next lint`, se
baja `.lint-max-warnings` al número nuevo en esa misma tarea.

**Windows.** `npm run lint:ci` y `npm run audit:ci` salen con código 3 (el script no encuentra `npx`/`npm`).
Se corren igual y se anota la salida; los equivalentes son `npx next lint` (0 errores, ≤ 348 avisos) y
`npm audit --omit=dev` (solo los altos con excepción vigente). La puerta real la confirma el CI en Linux.

**Dependencias.** No hay nuevas: `package.json` y `package-lock.json` no cambian.

**Comprobaciones manuales.**

- Entorno: `npx next dev --turbopack` (o `-p 3001`) con `.env.local`, la API local en `NEXT_PUBLIC_API_URL`,
  `MIDDLEWARE=ACTIVE` para T19.
- Usuarios: un empresario `ROLE_COMMERCIAL` con el onboarding `COMPLETED` y documentos de varios tipos (y al
  menos un reemplazo, para tener historial); otro empresario con el onboarding a medias (por ejemplo, el
  contrato en revisión de VERYGANA).
- Solicitudes: se crean y revisan como compliance con un cliente HTTP y el token de un
  `ROLE_COMPLIANCE_OFFICER` (`POST /compliance/information-requests`, `POST …/{id}/review`; sin pantalla hasta
  la 017). Hacen falta: una `OPEN` con un ítem `DOCUMENT` y otro `CLARIFICATION`, una `OBSERVED` (respondida
  y revisada `INSUFFICIENT`), una `RESPONDED`, una cerrada, una con `trigger` `MISSING_MANIFESTATION` y otra con
  `linkedDocumentId` (ítem `DOCUMENT` de un tipo con vigente aceptado y sin vencer).
- DevTools abiertas: Console, Network y Application → Storage (Local y Session).

**Bloques para delegar.**

| Bloque | Tareas | Dependencias |
|---|---|---|
| **A** · base: textos, servicios, claves | T1-T3 | independientes entre sí. |
| **B** · lógica pura | T4-T10 | T5 necesita T1; T7 y T8 necesitan T1; el resto, independientes. |
| **C** · hooks | T11 | A y B. |
| **D** · componentes | T12-T18 | C. T12 antes de T13; T13 antes de T14 y T17; T16 antes de T17. |
| **E** · páginas, menú, notificaciones, onboarding | T19-T22 | D. |
| **F** · ficha | T23-T24 | T4, T10, T11 (T24 es independiente). |
| **G** · barridos | T25 | todo lo anterior. |
| **H** · cierre | T26 | todo. |

---

## Bloque A · Base

- [x] T1 · Textos de la entrega (CA-2, CA-9, CA-10, CA-11, CA-13, CA-14, CA-18; RN-3, RN-6, RN-7, RN-9, RN-10)
  - Archivos: src/lib/labels/expedienteRequests.ts, __tests__/expediente/expedienteTexts.test.ts
  - Test primero: __tests__/expediente/expedienteTexts.test.ts. Casos:
    1. Literales de la spec, uno por uno: estados del expediente ("Aún no tienes documentos en tu
       expediente.", "No pudimos cargar tu expediente.", "No tienes permiso para ver este expediente.",
       "Documento cargado", "No pudimos subir el documento. Intenta de nuevo", "El documento anterior quedará
       en tu historial"), de la lista ("No tienes solicitudes pendientes.", "Aún no tienes solicitudes
       cerradas.", "No pudimos cargar tus solicitudes.", "No tienes permiso para ver estas solicitudes."), del
       detalle ("No encontramos esta solicitud.", "Volver a mis solicitudes", "No pudimos cargar la
       solicitud.", "No tienes permiso para ver esta solicitud.", "Tu respuesta está en revisión por
       VERYGANA.", "No pudimos enviar tu respuesta. Intenta de nuevo"), RN-3 ("Formato no permitido. Usa PDF,
       JPG o PNG", "El archivo supera el tamaño máximo de 10MB"), RN-6 ("Escribe una aclaración o adjunta al
       menos un documento"), RN-7 ("Recibimos tu respuesta. VERYGANA la revisará; la solicitud se cierra
       cuando termine la revisión"), RN-9 ("Podrás cargar este documento cuando termines tu registro.
       Mientras tanto, puedes responder con una aclaración."), RN-10 ("Esta solicitud es una aclaración sobre
       el compromiso de formalización. No es una sanción."), `linkedDocumentId` ("Ya tenemos un documento de
       este tipo en tu expediente; VERYGANA revisará si es suficiente"), RN-15 ("Sin soporte", "Documento ya
       no vigente", "Cargando documentos…", "No pudimos cargar tus documentos").
    2. Funciones: `expectedResponse('X')` = "Respuesta esperada: X"; `dueBefore('5 de noviembre de 2026')` =
       "Responder antes del 5 de noviembre de 2026"; `sentOn`, `uploadedOn` ("Cargado el …"), `expiresOn`
       ("Vence el …"), `supersededOn` ("Reemplazado el …"), `closedOn` ("Cerrada el …");
       `messageCounter(12)` = "12/2000"; `supportOptionLabel('RUT', 'rut.pdf')` = "RUT — rut.pdf".
    3. `requestsNotice(1)` = "VERYGANA te envió 1 solicitud de información"; `requestsNotice(2)` =
       "VERYGANA te envió 2 solicitudes de información" (CA-18).
    4. RN-10: recorriendo todos los valores (las funciones con argumentos ficticios), "sanción" solo aparece
       precedida de "No es una ".
    5. RN-7: ningún texto contiene `/resuelt|cerrad[ao]\b/i` salvo `closedOn` (que describe una solicitud ya
       cerrada por VERYGANA).
  - Nota: Hecho: `expedienteRequests.ts` con `EXPEDIENTE_TEXTS` e `INFORMATION_REQUEST_TEXTS` (9 pruebas). Prueba vista fallar: el módulo no existía (error de importación). Sin pendientes.

    Falla antes porque el módulo no existe.
  - Cambios: `export const EXPEDIENTE_TEXTS` e `INFORMATION_REQUEST_TEXTS` `as const` con funciones; los
    textos de D-8 del plan. Sin `'use client'`. Los textos de RN-3 se reutilizan desde aquí en T5 (no se
    copian de `5-DocumentsStep.tsx`).
  - Verificar: npx vitest run __tests__/expediente/expedienteTexts.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T2 · Servicios del expediente y de las solicitudes (CA-2, CA-3, CA-7, CA-10)
  - Archivos: src/services/commercial/ExpedienteService.ts,
    src/services/commercial/InformationRequestService.ts, __tests__/expediente/expedienteServices.test.ts
  - Test primero: __tests__/expediente/expedienteServices.test.ts, con `vi.mock('@/lib/api/client')` (patrón
    de `__tests__/taxProfile/taxProfileService.test.ts`) y `vi.mock('@/services/commercial/OnboardingService')`
    solo para `uploadDocumentFile`. Casos:
    1. `ExpedienteService.list()` → `GET /commercials/documents` y devuelve `data`.
    2. `prepareUpload(body)` → `POST /commercials/documents/prepare-upload` con el cuerpo tal cual.
    3. `confirmUpload(7)` → `POST /commercials/documents/7/confirm`.
    4. `uploadFile(url, file)` delega en `OnboardingService.uploadDocumentFile(url, file)` y no llama a
       `apiClient`.
    5. El servicio solo expone `list`, `prepareUpload`, `confirmUpload` y `uploadFile` (`Object.keys`): sin
       eliminar ni editar (CA-7).
    6. `InformationRequestService.listMine()` → `GET /commercials/information-requests`; `getMine(id)` →
       `GET /commercials/information-requests/{id}`; `respond(id, { message: 'x' })` → `POST
       /commercials/information-requests/{id}/responses` con ese cuerpo.
  - Nota: Hecho: `ExpedienteService` e `InformationRequestService` (8 pruebas). Prueba vista fallar: los módulos no existían. Sin pendientes.

    Falla antes porque los módulos no existen.
  - Cambios: los dos servicios vía `apiClient` con los tipos de `src/types` (sin `any`). Sin manejo de 401/402/503.
  - Verificar: npx vitest run __tests__/expediente/expedienteServices.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T3 · Claves e invalidaciones (CA-5, CA-10, CA-15, CA-19; RN-17)
  - Archivos: src/hooks/commercial/expedienteKeys.ts, src/hooks/commercial/informationRequestKeys.ts,
    __tests__/expediente/expedienteKeys.test.ts
  - Test primero: __tests__/expediente/expedienteKeys.test.ts. Casos:
    1. `expedienteKeys.list` empieza por `expedienteKeys.all`; `informationRequestKeys.detail('u1')` empieza
       por `informationRequestKeys.all` y es distinta de `detail('u2')` y de `list`.
    2. `EXPEDIENTE_INVALIDATIONS.confirmUpload` contiene `expedienteKeys.list` y
       `taxProfileKeys.onboardingDocuments` (RN-17); `uploadRejected` contiene `expedienteKeys.list`.
    3. `informationRequestInvalidations.respond('u1')` contiene `list` y `detail('u1')` (la insignia sale de
       `list`, CA-19); `respondRejected('u1')` también.
    4. Ninguna clave es la de otra entrega (`commercial-tax-profile`, `commercial-declarations`).
  - Nota: Hecho: `expedienteKeys.ts` e `informationRequestKeys.ts` (4 pruebas). Prueba vista fallar: los módulos no existían. Sin pendientes.

    Falla antes porque los módulos no existen.
  - Cambios: ver sección 6.1 del plan. Sin `'use client'`.
  - Verificar: npx vitest run __tests__/expediente/expedienteKeys.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

## Bloque B · Lógica pura

- [x] T4 · Agrupación del expediente y estado del selector de soporte (CA-1, CA-3, CA-12, CA-22, CA-23)
  - Archivos: src/lib/expediente/expediente.ts, __tests__/expediente/expediente.test.ts
  - Test primero: __tests__/expediente/expediente.test.ts. Casos:
    1. `groupExpediente`: con documentos de `CAMARA_COMERCIO`, `RUT` y `OTRO` desordenados, los grupos salen
       en el orden de `COMMERCIAL_DOCUMENT_TYPE_LABELS` (RUT, Cámara, Otro); un tipo sin documentos no
       aparece; `current` = los `VALIDATED` (más reciente primero); `history` = los `SUPERSEDED` por
       `supersededAt` descendente; un `PENDING` y un `ORPHANED` no aparecen en ningún lado (CA-1); dos
       `VALIDATED` del mismo tipo quedan ambos en `current` (D-6).
    2. `addableDocumentTypes`: solo los tipos sin `VALIDATED` (un tipo solo con `SUPERSEDED` sí es agregable);
       con los siete vigentes, `[]` (CA-3).
    3. `currentDocumentOfType(docs, 'RUT')`: el `VALIDATED` más reciente o `null` (CA-12).
    4. `documentNameById`: id → `originalFileName`, incluidos los `SUPERSEDED`.
    5. `supportSelectorState`:
       - `success` con dos vigentes y un reemplazado: "Sin soporte" primero y los dos vigentes como
         "{tipo} — {nombre}"; el reemplazado no se ofrece (CA-22);
       - `success` con `currentId` de un reemplazado: opción `{ value: id, label: 'Documento ya no vigente',
         stale: true }` (CA-23);
       - `pending`: `disabled`, nota "Cargando documentos…";
       - `error` sin `currentId`: solo "Sin soporte" y nota "No pudimos cargar tus documentos" (CA-23);
       - `error` y `pending` con `currentId`: además "Documento guardado" (D-5).
    6. `vigentSupportIds`: `Set` con los ids `VALIDATED`.
  - Nota: Hecho: `src/lib/expediente/expediente.ts` (14 pruebas). Prueba vista fallar: el módulo no existía. Sin pendientes.

    Falla antes porque el módulo no existe.
  - Cambios: funciones de la sección 6.3 del plan, sin `'use client'`, textos de T1.
  - Verificar: npx vitest run __tests__/expediente/expediente.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T5 · Carga en tres pasos y esquema del diálogo (CA-2, CA-3, CA-4, CA-5; RN-3, RN-4)
  - Archivos: src/lib/expediente/uploadFlow.ts, __tests__/expediente/uploadFlow.test.ts
  - Test primero: __tests__/expediente/uploadFlow.test.ts, con `deps` falsos (`vi.fn`) y `new File(...)`.
    Casos:
    1. `validateExpedienteFile`: PDF, JPEG y PNG de 1 KB → `null`; 10 MiB exactos → `null`; 10 MiB + 1 →
       "El archivo supera el tamaño máximo de 10MB"; `text/plain` → "Formato no permitido. Usa PDF, JPG o PNG";
       el tamaño se comprueba antes que el formato.
    2. CA-4: con un archivo inválido, `runExpedienteUpload` rechaza con `stage: 'validate'` y **`prepare` no se
       llama**.
    3. Orden y cuerpo: `prepare` recibe `{ documentType, originalFileName, contentType: file.type, sizeBytes:
       file.size }`; `put` recibe `permission.uploadUrl` y el archivo; `confirm` recibe `documentId`; devuelve
       lo que devuelve `confirm`.
    4. CA-2: con `replacesDocumentId: 5`, el cuerpo lleva `replacesDocumentId: 5`; CA-3: con `null` o sin él,
       el cuerpo **no tiene la clave** (`not.toHaveProperty`).
    5. CA-5: si `put` falla → `stage: 'upload'` y `confirm` no se llama; si `confirm` falla → `stage:
       'confirm'`; un segundo intento vuelve a llamar a `prepare` (dos llamadas en total).
    6. `uploadErrorMessage`: `validate` → su texto; `prepare` y `confirm` con un `AxiosError` 400 con
       `message` → ese `message`; `upload`, un 500 o un error de red → "No pudimos subir el documento. Intenta
       de nuevo".
    7. `shouldRefetchExpedienteAfterError`: `true` con 400 en `prepare` o `confirm`; `false` en `upload`,
       `validate` y 5xx.
    8. `ExpedienteUploadError.message` nunca contiene la `uploadUrl` del permiso (se prueba con una URL
       ficticia `https://r2.example.test/firmada?X-Amz-Signature=abc`).
    9. `createExpedienteUploadSchema(['RUT'])`: `documentType` fuera de la lista → "Selecciona un tipo de
       documento"; sin archivo → "Selecciona un archivo"; archivo de 11 MB → el texto de RN-3; válido → pasa.
  - Nota: Hecho: `src/lib/expediente/uploadFlow.ts` (14 pruebas). Prueba vista fallar: el módulo no existía. Nota: `ExpedienteUploadError` no guarda la causa en la etapa `upload` (el error del navegador podría arrastrar la URL firmada); solo en `prepare` y `confirm`, donde hace falta leer `status` y `message`.

    Falla antes porque el módulo no existe.
  - Cambios: sección 6.2 del plan. Reutiliza `MAX_DOCUMENT_SIZE_BYTES` y `ACCEPTED_DOCUMENT_MIME_TYPES` de
    `OnboardingService`, `readApiError` y los textos de T1. Sin `'use client'`.
  - Verificar: npx vitest run __tests__/expediente/uploadFlow.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T6 · "Ver" con URL de menos de 5 minutos (CA-6, CA-24; RN-5)
  - Archivos: src/lib/expediente/openDocument.ts, __tests__/expediente/openDocument.test.ts
  - Test primero: __tests__/expediente/openDocument.test.ts, con `openWindow` y `refetch` falsos y una
    ventana falsa `{ opener, location: { replace: vi.fn() }, close: vi.fn() }`. Casos:
    1. `isDownloadUrlFresh`: 3 min 59 s → `true`; 4 min → `false`; `fetchedAt` 0 → `false`.
    2. Fresca: `openWindow(url)` una vez, `refetch` no se llama, resultado `'opened'`.
    3. Vieja (CA-6): `openWindow()` sin URL primero, `opener` queda en `null`, `refetch` una vez, y
       `location.replace` con la URL **nueva** (no la vieja); `'opened'`.
    4. Vieja y el documento ya no está tras el `refetch`, o el `refetch` falla: `close()` y `'failed'`.
    5. Vieja y `openWindow()` devuelve `null` (bloqueador): tras el `refetch`, `openWindow(urlNueva)`.
    6. La función no guarda la URL en ningún sitio que devuelva (el resultado es solo `'opened' | 'failed'`).
  - Nota: Hecho: `src/lib/expediente/openDocument.ts` (6 pruebas). Prueba vista fallar: el módulo no existía. Nota: con URL fresca no se trata el `null` de `window.open` como fallo (con `noopener` siempre devuelve `null`); el abridor sigue devolviendo `OpenedWindow | null` para el camino de la pestaña vacía.

    Falla antes porque el módulo no existe.
  - Cambios: sección 6.4 del plan. Sin `'use client'`; el `window.open` real lo inyecta el componente (T14).
  - Verificar: npx vitest run __tests__/expediente/openDocument.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T7 · Pestañas, conteo, línea de tiempo y UUID (CA-8, CA-9, CA-13, CA-14, CA-17, CA-18, CA-19)
  - Archivos: src/lib/informationRequests/requests.ts, __tests__/informationRequests/requests.test.ts
  - Test primero: __tests__/informationRequests/requests.test.ts. Casos:
    1. `splitRequestsByTab`: con una de cada uno de los seis estados, `pending` = `OPEN`, `OBSERVED`,
       `RESPONDED` y `history` = las tres cerradas; cada pestaña por `issuedAt` descendente aunque la entrada
       venga desordenada (CA-8).
    2. `countAwaitingResponse`: `OPEN` + `OBSERVED` cuentan, `RESPONDED` y cerradas no; lista vacía → 0
       (CA-18, CA-19).
    3. `canRespond`: `true` solo con `OPEN` y `OBSERVED` (CA-13).
    4. `needsToneBanner`: `true` solo con `MISSING_MANIFESTATION`, `EXPRESS_REFUSAL` e `INCIDENT`, recorriendo
       los diez triggers (CA-14).
    5. `buildTimeline`: dos respuestas y una revisión intercaladas salen en orden cronológico ascendente;
       con la misma fecha, la respuesta antes que la revisión (CA-9).
    6. `latestInsufficientReview`: la última `INSUFFICIENT`, ignorando `SUFFICIENT`; sin ninguna → `null`.
    7. `isUuid`: un UUID en minúsculas y en mayúsculas → `true`; `'abc'`, `''`, un UUID sin guiones y uno con
       un carácter de más → `false` (CA-17).
  - Nota: Hecho: `src/lib/informationRequests/requests.ts` (9 pruebas). Prueba vista fallar: el módulo no existía. Sin pendientes.

    Falla antes porque el módulo no existe.
  - Cambios: sección 6.5 del plan. Sin `'use client'`.
  - Verificar: npx vitest run __tests__/informationRequests/requests.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T8 · Esquema, cuerpo y error de la respuesta (CA-10, CA-11, CA-15; RN-6)
  - Archivos: src/lib/informationRequests/respond.ts, __tests__/informationRequests/respond.test.ts
  - Test primero: __tests__/informationRequests/respond.test.ts. Casos:
    1. `respondSchema`: `{ message: '', documents: [] }` y `{ message: '   ', documents: [] }` → error
       "Escribe una aclaración o adjunta al menos un documento" en `message` (CA-11); 2000 caracteres → pasa;
       2001 → "Máximo 2000 caracteres"; solo un documento y texto vacío → pasa.
    2. `buildRespondBody` (CA-10): solo texto `'  hola  '` → `{ message: 'hola' }` sin `documentIds`; solo
       documentos → `{ documentIds: [3, 4] }` sin `message`; ambos → las dos claves; ids repetidos → una vez.
    3. `respondErrorOutcome` (CA-15): `AxiosError` 400 con `message` "Este requerimiento no está esperando una
       respuesta suya." → ese texto y `refetch: true`; 500, red (sin `response`) y 400 sin `message` → "No
       pudimos enviar tu respuesta. Intenta de nuevo" y `refetch: false`.
    4. `emptyRespondValues()` → `{ message: '', documents: [] }` y cada llamada devuelve un objeto nuevo.
  - Nota: Hecho: `src/lib/informationRequests/respond.ts` (9 pruebas). Prueba vista fallar: el módulo no existía. Sin pendientes.

    Falla antes porque el módulo no existe.
  - Cambios: sección 6.6 del plan (zod 4, `readApiError`, textos de T1). Sin `'use client'`.
  - Verificar: npx vitest run __tests__/informationRequests/respond.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T9 · Notificaciones reconocidas por título (CA-20; RN-14)
  - Archivos: src/lib/notifications/informationRequestNotifications.ts,
    __tests__/notifications/informationRequestNotifications.test.ts
  - Test primero: __tests__/notifications/informationRequestNotifications.test.ts. Casos:
    1. `INFORMATION_REQUEST_NOTIFICATION_TITLES` es exactamente `['Solicitud de información de VERYGANA', 'Tu
       respuesta tiene observaciones']` y `INFORMATION_REQUESTS_PATH` es
       `'/commercial/profile/information-requests'`.
    2. `commercialNotificationHref({ title })` con cada título → la ruta.
    3. Con `'solicitud de información de VERYGANA'`, `' Tu respuesta tiene observaciones'`, `'Tu respuesta
       tiene observaciones.'` y otro título cualquiera → `null` (comparación exacta).
  - Nota: Hecho: `src/lib/notifications/informationRequestNotifications.ts` (3 pruebas). Prueba vista fallar: el módulo no existía. Sin pendientes.

    Falla antes porque el módulo no existe.
  - Cambios: constante única con el comentario de DEP-1 (cambiarla cuando la API mande tipo y
    `requestPublicId`). Sin `'use client'`.
  - Verificar: npx vitest run __tests__/notifications/informationRequestNotifications.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T10 · El esquema de la ficha rechaza un soporte no vigente (CA-22, CA-23; RN-15)
  - Archivos: src/lib/taxProfile/taxProfileSchema.ts, __tests__/taxProfile/taxProfileSchema.test.ts
  - Test primero: nuevos casos en __tests__/taxProfile/taxProfileSchema.test.ts:
    1. `createTaxProfileSchema({ today, vigentSupportIds: new Set([10]) })` con un periodo con
       `supportDocumentId: 11` → error en `incomeReports.0.supportDocumentId` con "Este documento ya no está
       vigente. Elige otro o «Sin soporte»" (CA-23).
    2. Mismo conjunto con `supportDocumentId: 10` o `null` → sin ese error (CA-22).
    3. `vigentSupportIds: null` y sin el parámetro (llamada actual) → no comprueba, aunque el id no exista
       (CA-23: la lista falló, no bloquea).
    4. `sectionForField('incomeReports.0.supportDocumentId')` = `E_INCOME` (la sección se abre sola).
    5. Las pruebas existentes del archivo y de `taxProfileMapping.test.ts` siguen en verde (fila nueva con
       `null`, `toSubmitRequest` copia el id).
  - Nota: Hecho: `createTaxProfileSchema` acepta `vigentSupportIds` (opcional, `null` = no comprueba) y da el error en `incomeReports.{i}.supportDocumentId`; 4 casos nuevos en `taxProfileSchema.test.ts`. Prueba vista fallar: el caso del soporte no vigente (esperaba el error y no salía). `npx vitest run __tests__/taxProfile`: 10 archivos en verde. Sin pendientes.

    Fallan antes los casos 1 porque el parámetro no existe.
  - Cambios: parámetro opcional y el `ctx.addIssue` en el `superRefine` existente. El texto, desde T1.
  - Verificar: npx vitest run __tests__/taxProfile && npx tsc --noEmit
  - Comprobar: no aplica.

## Bloque C · Hooks

- [x] T11 · Hooks de TanStack Query (CA-5, CA-10, CA-15, CA-17, CA-19; RN-17, P-10)
  - Archivos: src/hooks/commercial/useExpediente.ts, src/hooks/commercial/useInformationRequests.ts
  - Test primero: no aplica en `node` sin montar React (P-17, excepción). Lo verificable sin React ya está
    probado: claves e invalidaciones (T3), `runExpedienteUpload` y `shouldRefetchExpedienteAfterError` (T5),
    `respondErrorOutcome` (T8), `isUuid` y `countAwaitingResponse` (T7). Los hooks solo recorren esas listas
    y funciones; no llevan lógica propia.
  - Cambios (`'use client'`): tabla de la sección 6.1 del plan.
    - `useExpediente`, `useExpedienteUpload` (deps reales: `ExpedienteService.prepareUpload`, `uploadFile`,
      `confirmUpload`).
    - `useInformationRequests`, `usePendingInformationRequestsCount` (`select`), `useInformationRequest`
      (`enabled: isUuid(publicId)`), `useRespondInformationRequest` (`setQueryData` + invalidaciones; en error,
      `respondRejected` si `refetch`).
    - Todos con `retry: retryUnlessForbiddenOrMissing` en las consultas.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/hooks/commercial/useExpediente.ts src/hooks/commercial/useInformationRequests.ts
  - Comprobar: se comprueba en T14, T17 y T20.
  - Nota: Hecho: `useExpediente.ts` y `useInformationRequests.ts` (sin lógica propia; recorren las listas de T3 y las funciones de T5, T7 y T8). `npx tsc --noEmit` y eslint con 0 avisos. Pendiente: la comprobación en navegador llega con T14, T17 y T20.

## Bloque D · Componentes

- [x] T12 · `Dialog` que no se cierra mientras sube (estado "Subiendo")
  - Archivos: src/components/shared/Dialog.tsx
  - Test primero: no aplica en `node` (componente; P-17, excepción). El uso con `dismissible={!isPending}`
    lo exige el barrido de T25.
  - Cambios: prop `dismissible?: boolean = true`. Con `false`, el manejador de Escape no llama a `onClose`, el
    fondo no cierra y la X queda `disabled` (`aria-disabled`). Con `true`, todo igual que hoy.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/shared/Dialog.tsx
  - Manual (PENDIENTE para el usuario): en `/commercial/profile/establishments`, "Agregar sede" sigue
    cerrándose con Escape, fondo y X (sin regresión).
  - Nota: Hecho: `Dialog` con `dismissible` (por defecto `true`); con `false`, Escape y fondo no llaman a `onClose` y la X queda `disabled` y `aria-disabled`. PENDIENTE manual: la regresión de "Agregar sede" (Escape, fondo y X).

- [x] T13 · Diálogo de carga al expediente (CA-2, CA-3, CA-4, CA-5, CA-12; RN-1, RN-2, RN-3, RN-4, P-11)
  - Archivos: src/components/commercial/expediente/ExpedienteUploadDialog.tsx
  - Test primero: no aplica en `node`; la lógica está en T5 (esquema, flujo, mensajes).
  - Cambios: sección 7.1 del plan. `'use client'`; react-hook-form + `zodResolver(createExpedienteUploadSchema(…))`,
    `mode: 'onChange'`; tres `target` (`replace`, `add`, `item`); `useExpedienteUpload`; `Dialog
    dismissible={!isPending}`; error en `role="alert"` con `uploadErrorMessage`; al terminar,
    `onUploaded(doc)`; el archivo se conserva tras un error (no se hace `reset`).
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/expediente/ExpedienteUploadDialog.tsx
  - Manual (PENDIENTE para el usuario, en T14):
    1. Elegir un `.txt` y luego un PDF de 11 MB: se ve el mensaje de RN-3 al elegirlo y en Network no hay
       `prepare-upload` (CA-4).
    2. Con un PDF válido, cortar la red (DevTools → Offline) justo después de `prepare-upload`: se ve "No
       pudimos subir el documento. Intenta de nuevo", el archivo sigue elegido; volver a "Subir" con red hace un
       `prepare-upload` nuevo (CA-5).
    3. Mientras sube, Escape, el fondo y la X no cierran el diálogo; "Subir" deshabilitado con indicador.
    4. Con teclado: el foco entra al diálogo, Tab recorre campos y botones, Escape cierra (sin subir) y el foco
       vuelve al botón que lo abrió.
  - Nota: Hecho: `ExpedienteUploadDialog` (modos `replace`, `add`, `item`; RHF + `zodResolver`, `mode: 'onChange'`, guarda `submittingRef`, `Dialog dismissible={!isPending}`, error en `role="alert"`, archivo conservado). El dialogo se reinicia al abrirse. PENDIENTE manual: los 4 puntos de T13.

- [x] T14 · Pantalla del expediente (CA-1, CA-2, CA-3, CA-6, CA-7)
  - Archivos: src/components/commercial/expediente/ExpedienteDocumentGroup.tsx,
    src/components/commercial/expediente/ExpedienteScreen.tsx
  - Test primero: no aplica en `node`; la lógica está en T4, T5 y T6.
  - Cambios: sección 7.1 del plan. "Ver" llama a `openExpedienteDocument` con `query.dataUpdatedAt`,
    `refetch` y el `window.open` real; `'failed'` → toast. `ExpedienteUploadDialog` con `next/dynamic` (`ssr:
    false`). Toast "Documento cargado" al subir. Sin eliminar ni editar.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/expediente
  - Manual (PENDIENTE para el usuario, tras T19, en `/commercial/profile/documents`):
    1. Un grupo por tipo en el orden del diccionario, con el vigente arriba (nombre, "Cargado el …", insignia de
       revisión, "Vencido" y "Vence el …" si aplica, observaciones) y "Historial" plegado; al abrirlo, los
       reemplazados con "Reemplazado el …" (CA-1).
    2. "Reemplazar" en un vigente: se ve "El documento anterior quedará en tu historial"; en Network el cuerpo
       de `prepare-upload` lleva `replacesDocumentId` con ese id y el mismo `documentType`; al terminar, el
       nuevo es el vigente y el anterior está en "Historial" (CA-2).
    3. "Agregar documento": el selector solo ofrece tipos sin vigente y el cuerpo no lleva
       `replacesDocumentId`; con todos los tipos vigentes el botón no aparece (CA-3).
    4. "Ver" recién cargada la página: se abre otra pestaña con el documento, sin nueva petición a
       `/commercials/documents`. Esperar más de 4 minutos y pulsar "Ver": primero un `GET /commercials/documents`
       y luego la pestaña con la URL nueva; la barra de la pestaña del front no cambia (CA-6).
    5. No hay ninguna acción de eliminar ni de editar (CA-7).
    6. A 360 px (DevTools, dispositivo de 360 de ancho): sin scroll horizontal, tarjetas apiladas, el diálogo
       cabe en pantalla.
  - Nota: Hecho: `ExpedienteDocumentGroup` y `ExpedienteScreen` (`next/dynamic` `ssr: false` para el dialogo; "Ver" por `openExpedienteDocument`; toast al subir). Ninguna mencion de `downloadUrl` fuera de `openDocument.ts`. PENDIENTE manual: los 6 puntos de T14 (tras T19).

- [x] T15 · Lista de solicitudes con pestañas (CA-8)
  - Archivos: src/components/commercial/information-requests/InformationRequestsList.tsx
  - Test primero: no aplica en `node`; la lógica está en T7.
  - Cambios: sección 7.2 del plan. Modos `profile` (`next/link` a
    `/commercial/profile/information-requests/{publicId}`) y `onboarding` (`onSelect`). Pestañas con
    `role="tablist"` y flechas. Estados de la spec.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/information-requests/InformationRequestsList.tsx
  - Manual (PENDIENTE para el usuario, tras T19): "Pendientes" muestra las `OPEN`, `OBSERVED` y `RESPONDED`;
    "Historial", las cerradas y anuladas; ambas de la más reciente a la más antigua, con insignia, tipo,
    motivo, "Enviada el …" y "Responder antes del …" cuando hay fecha límite. Con teclado: Tab llega a las
    pestañas y las flechas cambian de una a otra. Vacíos: los dos textos de la spec.
  - Nota: Hecho: `InformationRequestsList` (modos `profile` y `onboarding`, pestañas con flechas y tabindex itinerante, 3 estados). PENDIENTE manual: orden, vacios y teclado (tras T19).

- [x] T16 · Formulario de respuesta (CA-10, CA-11, CA-12, CA-15, CA-16; RN-6, RN-8, P-11)
  - Archivos: src/components/commercial/information-requests/RespondForm.tsx
  - Test primero: no aplica en `node`; la lógica está en T8. La guarda `useRef` la exige el barrido de T25.
  - Cambios: sección 7.3 del plan. Props: `publicId`, `canUploadDocuments`, `documentItems` (los ítems
    `DOCUMENT`, para "Cargar documento" desde el detalle), `onResponded()`. Guarda `submittingRef`; botón,
    textarea, "Cargar documento" y "Quitar" deshabilitados mientras envía; `buildRespondBody`; error con
    `respondErrorOutcome` en `role="alert"`, sin `reset`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/information-requests/RespondForm.tsx
  - Manual (PENDIENTE para el usuario, en T17):
    1. Formulario vacío o con espacios y "Enviar respuesta": se ve el texto de RN-6 y no hay `POST` (CA-11).
       Pegar 2001 caracteres: el área corta en 2000 y el contador dice "2000/2000".
    2. Enviar solo texto, solo documentos y ambos (tres solicitudes): en Network el cuerpo lleva solo las
       claves con valor (CA-10).
    3. Doble clic rápido en "Enviar respuesta": un solo `POST` en Network (CA-16).
    4. Responder una solicitud que en otra pestaña ya se respondió: se ve "Este requerimiento no está
       esperando una respuesta suya.", el detalle se vuelve a pedir y el formulario desaparece. Con la red
       cortada: "No pudimos enviar tu respuesta. Intenta de nuevo" y se conservan texto y documentos (CA-15).
  - Nota: Hecho: `RespondForm` con guarda `submittingRef`. Corregido el 2026-10-29 segun la decision del usuario: el estado de los documentos de la respuesta vive en `InformationRequestDetail`; `RespondForm` recibe `documents`, `onDocumentsChange` y `onBusyChange` (en lugar de `canUploadDocuments` y `documentItems`), conserva la lista con "Quitar" y el envio, y ya no tiene boton "Cargar documento" ni dialogo. PENDIENTE manual: los 4 puntos de T16 (en T17).

- [x] T17 · Detalle de la solicitud y conversación (CA-9, CA-10, CA-12, CA-13, CA-14, CA-17)
  - Archivos: src/components/commercial/information-requests/RequestTimeline.tsx,
    src/components/commercial/information-requests/InformationRequestDetail.tsx
  - Test primero: no aplica en `node`; la lógica está en T4, T7 y T8.
  - Cambios: sección 7.3 del plan. `useInformationRequest`, `useExpediente` (nombres y "Cargar documento"),
    `ExpedienteUploadDialog` en modo `item` con `next/dynamic`; `justResponded` en estado local; `back` como
    enlace o callback.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/information-requests/RequestTimeline.tsx src/components/commercial/information-requests/InformationRequestDetail.tsx
  - Manual (PENDIENTE para el usuario, tras T19, con el empresario `COMPLETED`):
    1. Una `OPEN` con ítem `DOCUMENT` y `CLARIFICATION`: se ven "Qué te pedimos" con "Respuesta esperada: …",
       el tipo de documento y "Cargar documento"; "Por qué" con el motivo y la relación; la conversación en
       orden cronológico (CA-9). En la de `linkedDocumentId`, el aviso de "Ya tenemos un documento…".
    2. "Cargar documento": si el tipo ya tiene vigente se ve el aviso de RN-1; al subir, el documento aparece
       en la lista de la respuesta con "Quitar", y en `/commercial/profile/documents` como vigente; la
       solicitud sigue "Pendiente de tu respuesta" hasta pulsar "Enviar respuesta" (CA-12).
    3. Enviar: se ve el mensaje de RN-7, la insignia pasa a "En revisión por VERYGANA", la respuesta aparece en
       la conversación con el nombre del documento, y el formulario desaparece (CA-10).
    4. Una `RESPONDED`: sin formulario y "Tu respuesta está en revisión por VERYGANA."; una cerrada: sin
       formulario, "Cerrada el …" y las notas de cierre (CA-13). Una `OBSERVED`: la última revisión
       "Insuficiente" resaltada sobre el formulario.
    5. La de `MISSING_MANIFESTATION`: banner informativo (no rojo) "… No es una sanción."; una de otro tipo,
       sin banner (CA-14).
    6. A 360 px: la conversación apilada, sin scroll horizontal.
  - Nota: Hecho: `RequestTimeline` e `InformationRequestDetail` (UUID invalido o 404 -> "No encontramos esta solicitud." sin llamar a la API; 403; error con reintento; `justResponded` local). Corregido el 2026-10-29: el detalle es dueno de `documents`, `sending` y del `ExpedienteUploadDialog` (fuera del `<form>`, por el burbujeo de submit del portal); "Cargar documento" va dentro de cada item `DOCUMENT` de "Qué te pedimos" (solo con `canUploadDocuments` y la solicitud esperando respuesta), deshabilitado mientras se envia o el expediente no esta cargado, con el error y "Reintentar" bajo la lista; en el onboarding, la nota de RN-9. PENDIENTE manual: los 6 puntos de T17 (tras T19).

- [x] T18 · Insignia de pendientes (CA-19; RN-11)
  - Archivos: src/components/commercial/information-requests/PendingRequestsBadge.tsx
  - Test primero: no aplica en `node`; el número sale de `countAwaitingResponse` (T7).
  - Cambios: sección 7.5 del plan. Con 0 o sin datos, `null`; con N, número + texto `sr-only`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/information-requests/PendingRequestsBadge.tsx
  - Comprobar: en T20.
  - Nota: Hecho: `PendingRequestsBadge` (`variant` `sidebar` o `card`; con 0 o sin datos, `null`; numero + `sr-only`). La comprobacion llega con T20.

> **Decisión del usuario (2026-10-29), tras el bloque D:** el botón "Cargar documento" va **dentro de
> cada ítem `DOCUMENT` de "Qué te pedimos"**, como dice la spec (flujo de solicitudes, paso 2.3), no en el
> formulario de respuesta. El estado de los documentos de la respuesta sube al detalle
> (`InformationRequestDetail`), que se lo pasa a `RespondForm` (lista con "Quitar") y a los ítems (botón).
> El botón se deshabilita mientras se envía la respuesta ("Enviando") y en el onboarding se reemplaza por
> la nota de RN-9. Se corrige en T16 y T17 antes del bloque E.

## Bloque E · Páginas, menú, notificaciones y onboarding

- [x] T19 · Páginas de servidor y su clasificación (CA-17, CA-25; P-2, P-4, P-6)
  - Archivos: src/app/commercial/profile/documents/page.tsx,
    src/app/commercial/profile/information-requests/page.tsx,
    src/app/commercial/profile/information-requests/[requestPublicId]/page.tsx
  - Test primero: `__tests__/middleware/routeProtection.test.ts` ya recorre `src/app`; tras crear las páginas
    debe clasificarlas por el prefijo `/commercial` (`ROLE_COMMERCIAL`) y probarlas con las seis identidades
    sin tocar `routeAccess.ts`. Si alguna saliera sin clasificar, la prueba falla y eso indica un error de
    ruta, no que haya que tocar la tabla.
  - Cambios: sección 4 del plan. Sin `'use client'`; `metadata`; enlace "Volver a Mi perfil" (o "Volver a mis
    solicitudes" en el detalle); el detalle con `params: Promise<{ requestPublicId: string }>` y `await`.
  - Verificar: npx vitest run __tests__/middleware && npm run build && npx tsc --noEmit && npx eslint --max-warnings=0 "src/app/commercial/profile/documents/page.tsx" "src/app/commercial/profile/information-requests"
    y `grep -L "use client"` sobre las tres páginas las lista a las tres; `git diff --stat -- src/middleware.ts __tests__/middleware/routeAccess.ts` vacío.
  - Manual (PENDIENTE para el usuario, con `MIDDLEWARE=ACTIVE`):
    1. Con sesión de consumidor, `/commercial/profile/documents` no deja entrar (middleware).
    2. `/commercial/profile/information-requests/abc`: "No encontramos esta solicitud." con "Volver a mis
       solicitudes" y **ningún** `GET /commercials/information-requests/abc` en Network; con un UUID inexistente
       y con el `publicId` de una solicitud de otro empresario: el mismo texto tras un 404 (CA-17).
  - Nota: Hecho: tres paginas de servidor (`documents`, `information-requests`, `information-requests/[requestPublicId]` con `await params`). `routeProtection.test.ts` las clasifica por el prefijo `/commercial` sin tocar `routeAccess.ts` ni el middleware (`__tests__/middleware` 606 pruebas en verde). `grep -L "use client"` lista las tres. El enlace "Volver a mis solicitudes" lo pinta el componente de detalle (tambien en el 404). El diff de `routeAccess.ts` que aparece es anterior a esta entrega (ya estaba modificado). PENDIENTE manual: los 2 puntos de T19.

- [x] T20 · Sidebar y "Mi perfil" con la insignia (CA-19)
  - Archivos: src/components/commercial/layout/Sidebar.tsx,
    src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx
  - Test primero: no aplica en `node`; el número y las invalidaciones están probados en T3 y T7.
  - Cambios: sección 7.5 del plan. Ítem antes de "Soporte" con `<PendingRequestsBadge variant="sidebar" />`;
    tarjeta de "Mi perfil" con los cuatro enlaces y `<PendingRequestsBadge variant="card" />`.
  - Verificar: npx tsc --noEmit && npx eslint src/components/commercial/layout/Sidebar.tsx src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx
    (Sidebar: 1 aviso, el `<img>` ajeno; TaxAndEstablishmentsLinks: 0).
  - Manual (PENDIENTE para el usuario): con 3 solicitudes `OPEN`/`OBSERVED`, el ítem "Solicitudes de
    información" del Sidebar y el enlace de "Mi perfil" muestran 3; tras responder una, ambos muestran 2 sin
    recargar; con 0, no hay insignia (CA-19). En el detalle, el ítem del Sidebar queda resaltado. En el
    Sidebar móvil (menú lateral), el ítem cierra el menú al navegar.
  - Nota: Hecho: item "Solicitudes de información" antes de "Soporte" en `Sidebar` (con `PendingRequestsBadge variant="sidebar"`; el `onClose` ya existia en el `Link`) y cuatro enlaces en `TaxAndEstablishmentsLinks` con la insignia `card`. Eslint: Sidebar 1 aviso (el `<img>` ajeno), enlaces 0. PENDIENTE manual: los puntos de T20.

- [x] T21 · Notificaciones que llevan a las solicitudes (CA-20; RN-14)
  - Archivos: src/components/notifications/NotificationsPanel.tsx,
    src/components/commercial/layout/Header.tsx
  - Test primero: la regla está probada en T9. `__tests__/ui/consumerInteractive.test.ts` y
    `jsxInteractive.test.ts` ya cubren el panel (alcance del consumidor): deben seguir en verde, sin botón
    dentro de enlace.
  - Cambios: sección 7.5 del plan. Prop opcional `getNotificationHref`; el `Link` envuelve solo título y
    mensaje y llama a `onToggle` al hacer clic; "Ver más" queda fuera. `Header` comercial pasa
    `commercialNotificationHref`. Admin, consumidor y diseñador no pasan la prop.
  - Verificar: npx vitest run __tests__/ui __tests__/notifications && npx tsc --noEmit && npx eslint --max-warnings=0 src/components/notifications/NotificationsPanel.tsx src/components/commercial/layout/Header.tsx
  - Manual (PENDIENTE para el usuario): en el panel comercial, una notificación "Solicitud de información de
    VERYGANA" y otra "Tu respuesta tiene observaciones" llevan a la lista y cierran el panel (escritorio y hoja
    inferior en móvil); otra notificación no navega y su "Ver más" funciona como antes; en `/home` (consumidor)
    el panel se ve y se comporta igual que antes (CA-20).
  - Nota: Hecho: `NotificationPanel` con `getNotificationHref` opcional (`Link` solo en titulo y mensaje; "Ver mas" y la fecha quedan fuera; `onNavigate` = `onToggle`); sin la prop el marcado es el mismo. `Header` comercial pasa `commercialNotificationHref`. `__tests__/ui` y `__tests__/notifications` en verde (30 pruebas). PENDIENTE manual: los puntos de T21.

- [x] T22 · Solicitudes dentro del onboarding (CA-18; RN-9, RN-12)
  - Archivos: src/components/commercial/information-requests/OnboardingRequestsNotice.tsx,
    src/components/commercial/information-requests/OnboardingRequestsBrowser.tsx,
    src/components/commercial/onboarding/OnboardingWizard.tsx
  - Test primero: no aplica en `node`; el conteo y el texto del aviso están probados en T1 y T7.
  - Cambios: sección 7.4 del plan. El aviso se monta en tres sitios del asistente (D-9) y no toca su estado;
    `OnboardingRequestsBrowser` con `next/dynamic` (`ssr: false`); detalle con `canUploadDocuments={false}`; el
    aviso sigue montado mientras el diálogo esté abierto aunque el conteo llegue a 0.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/information-requests/OnboardingRequestsNotice.tsx src/components/commercial/information-requests/OnboardingRequestsBrowser.tsx
    y `npx eslint src/components/commercial/onboarding/OnboardingWizard.tsx` con 0 avisos; `npm run build` y
    anotar el First Load JS de `/commercial-onboarding` (antes: 239 kB).
  - Manual (PENDIENTE para el usuario, con el empresario en el onboarding):
    1. Con 2 solicitudes `OPEN`/`OBSERVED`: arriba del paso, "VERYGANA te envió 2 solicitudes de información" y
       "Ver solicitudes" (CA-18).
    2. Escribir algo en el paso actual (por ejemplo, en la ficha), abrir "Ver solicitudes", entrar a una
       solicitud: los ítems `DOCUMENT` muestran la nota de RN-9 y no "Cargar documento"; responder con una
       aclaración: se ve el mensaje de RN-7. Cerrar el diálogo: el asistente sigue en el mismo paso con lo
       escrito (CA-18).
    3. Tras responder las dos, el aviso desaparece al cerrar el diálogo; sin pendientes, no hay aviso.
    4. Con teclado: "Ver solicitudes" abre el diálogo con el foco dentro; Escape lo cierra y el foco vuelve al
       botón.
  - Nota: Hecho: `OnboardingRequestsNotice` (aviso `role="status"`, conserva el ultimo conteo mientras el dialogo este abierto, nada si falla o hay 0) y `OnboardingRequestsBrowser` (`next/dynamic` `ssr: false`; lista <-> detalle con `canUploadDocuments={false}`). Montado en `OnboardingWizard` entre el stepper y la tarjeta, y arriba de "Cuenta en revision" y "Un asesor te contactara". First Load JS de `/commercial-onboarding`: 243 kB (antes 239 kB). Eslint 0 avisos. PENDIENTE manual: los 4 puntos de T22.

## Bloque F · Ficha tributaria

- [x] T23 · Selector de soporte por periodo (CA-22, CA-23; RN-15)
  - Archivos: src/components/commercial/tax-profile/TaxProfileForm.tsx,
    src/components/commercial/tax-profile/sections/IncomeSection.tsx
  - Test primero: la lógica está en T4 (opciones) y T10 (esquema). No hay prueba de componente (P-17,
    excepción).
  - Cambios: secciones 6.3 y 7.6 del plan. `TaxProfileForm` llama a `useExpediente()`, guarda
    `vigentSupportIds` en un `useRef` (solo con éxito; si no, `null`) y el resolver lo pasa a
    `createTaxProfileSchema`; `IncomeSection` recibe el estado de la consulta y pinta el `<select>` con
    `Controller`. La carga de documentos no bloquea el formulario.
  - Verificar: npx vitest run __tests__/taxProfile && npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/tax-profile/TaxProfileForm.tsx src/components/commercial/tax-profile/sections/IncomeSection.tsx
  - Manual (PENDIENTE para el usuario):
    1. En `/commercial/profile/tax-info` → "Editar ficha", sección e): "Agregar periodo" arranca en "Sin
       soporte" y ofrece solo los vigentes como "{tipo} — {nombre}"; al enviar, en Network cada periodo lleva el
       `supportDocumentId` elegido o `null` (CA-22).
    2. Reemplazar en el expediente el documento que soportaba un periodo y volver a "Editar ficha": el selector
       muestra "Documento ya no vigente" y "Enviar ficha" no envía hasta elegir otro o "Sin soporte" (CA-23).
    3. Con la red bloqueada solo para `/commercials/documents` (DevTools → Network → Block request URL): el
       selector ofrece "Sin soporte" (y "Documento guardado" si el periodo ya tenía uno) con la nota "No pudimos
       cargar tus documentos", y la ficha se envía (CA-23).
    4. Lo mismo en el paso "Ficha tributaria" del onboarding con el empresario a medias (los documentos del
       paso de documentos aparecen como vigentes).
  - Nota: Hecho: `TaxProfileForm` llama a `useExpediente()`, guarda `vigentSupportIds` en un `useRef` (solo con la consulta en éxito; si no, `null`) que el resolver pasa a `createTaxProfileSchema`; `IncomeSection` recibe `documentsStatus` y `documents` y pinta `SupportSelect` (`Controller`, "" <-> `null`, número <-> id, opciones y nota de `supportSelectorState`, `disabled` solo en carga, error del esquema bajo el campo). Es el mismo formulario del perfil y del paso del onboarding. `__tests__/taxProfile` 149 pruebas en verde, `tsc` y eslint `--max-warnings=0` limpios. Sin pruebas de componente (P-17, excepción). PENDIENTE manual: los 4 puntos de T23.

- [x] T24 · "Tienes una aclaración pendiente" como enlace (CA-21; RN-13)
  - Archivos: src/components/commercial/tax-profile/CommitmentBlock.tsx, src/lib/taxProfile/display.ts
  - Test primero: el barrido de T25 exige que `CommitmentBlock` enlace a `INFORMATION_REQUESTS_PATH`.
    `__tests__/taxProfile/display.test.ts` sigue en verde (el texto no cambia).
  - Cambios: con `display.pendingClarification`, el texto es `<Link href={INFORMATION_REQUESTS_PATH}>`; el
    comentario de `pendingClarification` en `display.ts` ya no dice "sin enlace".
  - Verificar: npx vitest run __tests__/taxProfile && npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/tax-profile/CommitmentBlock.tsx src/lib/taxProfile/display.ts
  - Manual (PENDIENTE para el usuario): con un empresario cuyo compromiso es `NOT_MANIFESTED`,
    `EXPRESS_REFUSAL` o `TECHNICAL_INCIDENT`, en `/commercial/profile/tax-info` el texto "Tienes una aclaración
    pendiente" es un enlace que lleva a la lista de solicitudes (CA-21).
  - Nota: Hecho: `CommitmentBlock` pinta "Tienes una aclaración pendiente" como `<Link href={INFORMATION_REQUESTS_PATH}>` subrayado; el comentario de `pendingClarification` en `display.ts` ya no dice "sin enlace". `display.test.ts` sigue en verde. El barrido de T25 lo exige (se vio fallar con `href="/x"`). PENDIENTE manual: el punto de T24.

## Bloque G · Barridos

- [x] T25 · PII y barridos estáticos (CA-6, CA-7, CA-14, CA-16, CA-20, CA-21, CA-24; P-16)
  - Archivos: __tests__/taxProfile/noPiiLeaks.test.ts, __tests__/expediente/expedienteStatic.test.ts
  - Test primero: __tests__/expediente/expedienteStatic.test.ts, con funciones de barrido exportadas y probadas
    con fragmentos (como `scanForLeaks`), y comentarios quitados antes de buscar. Casos:
    1. `downloadUrl` solo aparece en `src/lib/expediente/openDocument.ts` dentro de `src/components/commercial`,
       `src/lib/expediente`, `src/lib/informationRequests`, `src/hooks/commercial/useExpediente.ts` y
       `useInformationRequests.ts` (CA-6, CA-24).
    2. `uploadUrl` solo en `src/lib/expediente/uploadFlow.ts` en esos mismos sitios.
    3. `holderIdentification` no aparece en `src/components/commercial/expediente`,
       `src/components/commercial/information-requests` ni `src/lib/expediente` (CA-24).
    4. Sin acciones de borrar o editar en `src/components/commercial/expediente`: ni "Eliminar", ni "Editar", ni
       `delete`/`remove` como llamada (CA-7).
    5. Los dos títulos de notificación solo aparecen como literal en
       `src/lib/notifications/informationRequestNotifications.ts` (CA-20).
    6. "sanción" solo aparece en `src/lib/labels/expedienteRequests.ts` (los componentes usan la constante)
       (CA-14).
    7. `RespondForm.tsx` declara un `useRef` y lo comprueba al inicio del envío (CA-16); `ExpedienteUploadDialog.tsx`
       pasa `dismissible=` al `Dialog`.
    8. `CommitmentBlock.tsx` importa `INFORMATION_REQUESTS_PATH` y lo usa en un `href` (CA-21).

    Cada barrido se ve fallar antes con un fragmento que lo viola (por ejemplo, un componente de prueba en
    memoria con `doc.downloadUrl`).
  - Cambios en `noPiiLeaks.test.ts`: añadir a `TARGETS` `src/components/commercial/expediente`,
    `src/components/commercial/information-requests`, `src/lib/expediente`, `src/lib/informationRequests`,
    `src/lib/notifications/informationRequestNotifications.ts`, `src/lib/labels/expedienteRequests.ts`,
    `src/services/commercial/ExpedienteService.ts`, `src/services/commercial/InformationRequestService.ts`,
    `src/hooks/commercial/expedienteKeys.ts`, `informationRequestKeys.ts`, `useExpediente.ts`,
    `useInformationRequests.ts`, las tres páginas nuevas, `src/components/notifications/NotificationsPanel.tsx`
    y `src/components/commercial/layout/Sidebar.tsx` (comprobar antes con `grep` que estos dos últimos no tienen
    `console.`, almacenamiento ni `window.location`; si los tuvieran, no se añaden y se anota). El asistente y
    `Header.tsx` no se añaden si tienen deuda previa (el asistente la tiene: `sessionStorage` en el pago).
  - Verificar: npx vitest run __tests__/expediente __tests__/taxProfile/noPiiLeaks.test.ts
  - Manual (PENDIENTE para el usuario): recorrer expediente (Ver, Reemplazar), lista, detalle (Cargar
    documento, Enviar) y el diálogo del onboarding con DevTools: en Console no aparece nada; en Application →
    Local Storage y Session Storage no hay claves nuevas con URL, textos de respuestas ni identificaciones; la
    barra de direcciones solo muestra las rutas de la sección 4 del plan (sin query) (CA-24).
  - Nota: Hecho: `__tests__/expediente/expedienteStatic.test.ts` (funciones `mentions`, `hasDeleteOrEdit`, `guardsDoubleSubmit` y `linksToRequests`, probadas con fragmentos buenos y malos y aplicadas a los archivos reales) y 17 destinos nuevos en `TARGETS` de `noPiiLeaks.test.ts` (incluidos `NotificationsPanel.tsx` y `Sidebar.tsx`: `grep` previo sin `console.`, almacenamiento ni `window.location`; `Header.tsx` y el asistente no se añaden). Cada regla se vio fallar con un fragmento malo temporal en el archivo real, ya quitado: `downloadUrl` (ExpedienteScreen), `uploadUrl` (ExpedienteUploadDialog), `holderIdentification` y `'Eliminar'` (ExpedienteDocumentGroup), título de notificación (NotificationsPanel), `'sanción'` (InformationRequestDetail), sin guarda en RespondForm, sin `dismissible=` en ExpedienteUploadDialog, `href` sin la constante en CommitmentBlock, y `console.log`/`localStorage` en NotificationsPanel, Sidebar, `expediente.ts` y la página de documentos. Desviaciones: (1) los barridos de `downloadUrl`, `uploadUrl` y "sanción" cubren las carpetas y archivos de la 016, no todo `src/components/commercial`, porque `OnboardingWizard.tsx` (línea 518, contrato) y `5-DocumentsStep.tsx` ya usaban `downloadUrl`/`uploadUrl` de otros flujos desde antes; (2) el barrido de `uploadUrl` obligó a renombrar el parámetro de `put` en `useExpediente.ts` (`uploadUrl` a `url`, mismo comportamiento); (3) el barrido de "sanción" incluye `src/components/commercial/tax-profile` y no mira `src/app/terminos`, que tiene "SANCIÓN" en sus reglas públicas. `npx vitest run __tests__/expediente __tests__/taxProfile/noPiiLeaks.test.ts`: 8 archivos, 89 pruebas en verde. PENDIENTE manual: el recorrido con DevTools de T25.

## Bloque H · Cierre

- [x] T26 · Puertas finales (CA-25)
  - Verificar, en este orden y con las variables de "Reglas":
    1. `npm test` (todo en verde: los 32 archivos de antes más los nuevos).
    2. `npm run lint:ci` (en Windows sale con 3: anotar y correr `npx next lint`: 0 errores y ≤ 348 avisos; si
       baja, bajar `.lint-max-warnings`).
    3. `npm run build` (anotar el First Load JS de `/commercial-onboarding`, `/commercial/profile/documents` y
       `/commercial/profile/information-requests/[requestPublicId]`).
    4. `npx tsc --noEmit`.
    5. `npm run audit:ci` (en Windows, `npm audit --omit=dev`: solo los altos con excepción vigente).
    6. Por tocar `NotificationsPanel.tsx` (alcance del consumidor): `npm run build:e2e && npm run test:e2e`
       (Chromium), y después `npm run build` otra vez antes de `npx tsc --noEmit`, porque `build:e2e` reemplaza
       `.next`.
    7. `git diff --stat -- package.json package-lock.json src/middleware.ts __tests__/middleware/routeAccess.ts next.config.ts`
       vacío.
  - Comprobar: la lista de comprobaciones manuales PENDIENTES de T12-T25 queda reunida en la nota de esta
    tarea para el usuario.
  - Nota: Hecho el 2026-10-29, con las variables ficticias. (1) `npx vitest run`: 42 archivos, 1136 pruebas, verde (antes 32 y 1012). (2) `npm run lint:ci` no produjo reporte en Windows (ajeno); `npx next lint`: 0 errores y 348 avisos = tope; `.lint-max-warnings` queda en 348. (3) `npm run build` verde; First Load JS: `/commercial-onboarding` 245 kB, `/commercial/profile/documents` 187 kB, `/commercial/profile/information-requests` 183 kB, `/commercial/profile/information-requests/[requestPublicId]` 200 kB (y `/commercial/profile/tax-info` 214 kB). (4) `npx tsc --noEmit` verde, tras el último `build`. (5) `npm audit --omit=dev`: 2 altos de postcss y 2 de xlsx; `evaluateAudit` de `scripts/audit-gate.mjs` con `security/audit-exceptions.json` y la fecha de hoy: `ok`, código 0, las 4 con excepción vigente hasta el 2026-11-30, sin avisos; más 2 moderados de fast-uri que la puerta no bloquea. (6) `npm run build:e2e` verde, pero `npm run test:e2e` NO SE PUDO CORRER: Chromium de Playwright no está instalado (falta `chromium_headless_shell-1248` en `AppData/Local/ms-playwright`; 379 pruebas fallan al lanzar el navegador, ninguna por la app). Pendiente: `npx playwright install chromium` y repetir `npm run build:e2e && npm run test:e2e`, y luego `npm run build` y `npx tsc --noEmit` (tras el intento fallido ya se repitieron: verdes). (7) `git diff --stat -- package.json package-lock.json src/middleware.ts next.config.ts`: vacío. Sin dependencias nuevas. COMPROBACIONES MANUALES PENDIENTES para el usuario (el detalle está en el bloque "Manual" de cada tarea): T12 regresión de "Agregar sede" (Escape, fondo y X); T13 y T14 diálogo de carga y pantalla del expediente en `/commercial/profile/documents` (4 y 6 puntos: Ver, Agregar, Reemplazar, historial, sin borrar ni editar); T15 pestañas de la lista (orden, vacíos, teclado); T16 y T17 formulario de respuesta y detalle con conversación (4 y 6 puntos: doble envío, "Cargar documento" en ítems `DOCUMENT`, 404/403); T18 insignia de pendientes; T19 con `MIDDLEWARE=ACTIVE` (2 puntos); T20 Sidebar y "Mi perfil" con la insignia; T21 notificaciones que navegan a las solicitudes; T22 aviso y diálogo de solicitudes en el onboarding (4 puntos); T23 selector de soporte (4 puntos: vigentes, "Documento ya no vigente", red bloqueada a `/commercials/documents`, onboarding); T24 enlace de "aclaración pendiente"; T25 recorrido con DevTools (Console vacía, sin claves nuevas en Local/Session Storage, rutas sin query). Además, el CI en Linux debe confirmar `lint:ci`, `audit:ci` y `Pruebas en navegador`.

---

## Correcciones de la ronda 1

- [x] B1. `documentsFromRefetch` (`src/lib/expediente/openDocument.ts`) rechaza si el resultado de `query.refetch()` trae `isError` o `status 'error'`; `ExpedienteScreen.tsx` lo usa en el adaptador. Prueba en `openDocument.test.ts` con un resultado real en forma `{ data: anterior, isError: true }`.
- [x] B2. `addUploadedDocument` (`src/lib/informationRequests/respond.ts`) quita el documento reemplazado de la respuesta; `InformationRequestDetail.tsx` lo usa en `onUploaded`. Pruebas en `respond.test.ts` (mismo tipo dos veces, dos ítems del mismo tipo, sin duplicar).
- [x] B3. Fixture `e2e/fixtures/api/commercials/information-requests.json` (lista vacía) y ruta en `e2e/support/mockRoutes.mjs`.
  - Nota: PENDIENTE para quien tenga la plataforma de las referencias: regenerar las tres capturas comerciales (`commercial-support`, `commercial-ally`, `commercial-product`) con `npx playwright test --project=desktop-1280 --update-snapshots`, porque el Sidebar tiene un ítem nuevo. No se generaron capturas `*-win32.png` ni se tocaron las de referencia.
- [x] S4. `RespondForm.tsx`: el botón muestra `Loader2` mientras envía.
- [x] S5. Tras responder con éxito se vacía la lista de documentos de la respuesta.
- [x] S6. `TaxAndEstablishmentsLinks.tsx` usa `INFORMATION_REQUESTS_PATH`.
- [x] S7. Un 400 por estado: `RespondForm` avisa con `onRejected` y el detalle muestra el mensaje de la API (`role="alert"`) aunque el formulario se desmonte; se limpia al enviar de nuevo, al responder o al cargar un documento.
  - Nota: no hay prueba automática de S4, S5 y S7 (interfaz, sin pruebas de componentes, P-17); queda para la comprobación manual T16/T17.

---

## Trazabilidad CA → tareas

| CA | Tareas | Verificación |
|---|---|---|
| CA-1 | T4, T14 | `expediente.test.ts`; manual T14.1 |
| CA-2 | T1, T2, T5, T13, T14 | `uploadFlow.test.ts`, `expedienteServices.test.ts`, `expedienteTexts.test.ts`; manual T14.2 |
| CA-3 | T4, T5, T13, T14 | `expediente.test.ts`, `uploadFlow.test.ts`; manual T14.3 |
| CA-4 | T5, T13 | `uploadFlow.test.ts` (sin `prepare`); manual T13.1 |
| CA-5 | T3, T5, T11, T13 | `uploadFlow.test.ts`, `expedienteKeys.test.ts`; manual T13.2 |
| CA-6 | T6, T14, T25 | `openDocument.test.ts`, `expedienteStatic.test.ts`; manual T14.4 |
| CA-7 | T2, T14, T25 | `expedienteServices.test.ts`, `expedienteStatic.test.ts`; manual T14.5 |
| CA-8 | T7, T15 | `requests.test.ts`; manual T15 |
| CA-9 | T1, T7, T17 | `requests.test.ts`, `expedienteTexts.test.ts`; manual T17.1 |
| CA-10 | T1, T2, T3, T8, T11, T16, T17 | `respond.test.ts`, `expedienteServices.test.ts`, `expedienteKeys.test.ts`, `expedienteTexts.test.ts`; manual T16.2, T17.3 |
| CA-11 | T8, T16 | `respond.test.ts`; manual T16.1 |
| CA-12 | T4, T13, T16, T17 | `expediente.test.ts`; manual T17.2 |
| CA-13 | T1, T7, T17 | `requests.test.ts`, `expedienteTexts.test.ts`; manual T17.4 |
| CA-14 | T1, T7, T17, T25 | `requests.test.ts`, `expedienteTexts.test.ts`, `expedienteStatic.test.ts`; manual T17.5 |
| CA-15 | T3, T8, T11, T16 | `respond.test.ts`, `expedienteKeys.test.ts`; manual T16.4 |
| CA-16 | T16, T25 | `expedienteStatic.test.ts`; manual T16.3 |
| CA-17 | T7, T11, T17, T19 | `requests.test.ts`; manual T19.2 |
| CA-18 | T1, T7, T22 | `expedienteTexts.test.ts`, `requests.test.ts`; manual T22 |
| CA-19 | T3, T7, T18, T20 | `expedienteKeys.test.ts`, `requests.test.ts`; manual T20 |
| CA-20 | T9, T21, T25 | `informationRequestNotifications.test.ts`, `expedienteStatic.test.ts`, `__tests__/ui`; manual T21 |
| CA-21 | T24, T25 | `expedienteStatic.test.ts`; manual T24 |
| CA-22 | T4, T10, T23 | `expediente.test.ts`, `taxProfileSchema.test.ts`; manual T23.1 |
| CA-23 | T4, T10, T23 | `expediente.test.ts`, `taxProfileSchema.test.ts`; manual T23.2, T23.3 |
| CA-24 | T6, T25 | `noPiiLeaks.test.ts`, `expedienteStatic.test.ts`; manual T25 |
| CA-25 | T19, T26 | `__tests__/middleware`, las puertas de T26 y el `git diff` vacío |

## Sugerencias de la ronda 2

- [x] S8. Comprobación estática en `__tests__/expediente/expedienteStatic.test.ts`: `ExpedienteScreen.tsx` usa `documentsFromRefetch` en el adaptador de refetch y `InformationRequestDetail.tsx` usa `addUploadedDocument` en `onUploaded`. Vista en rojo sustituyendo cada uso por la versión sin el arreglo (restaurados con `cmp`).
- [x] S9. `ExpedienteScreen.tsx`: la vista de error solo si `shouldShowLoadError(isError, data)` (`src/lib/expediente/expediente.ts`, función pura con prueba en `expediente.test.ts`). Con datos cargados y refetch fallido se conserva la lista y aparece un aviso discreto (`T.refreshFailed`).
- [ ] ~~S10.~~ Descartada: detección de ventana bloqueada en "Ver" sin `noopener`.
  - Nota: Revertida por decisión del usuario (2026-11-02): quitar noopener/noreferrer para detectar el bloqueo no compensa; se mantiene la desviación 4 de la ronda 1.
- [x] S11. `RequestTimeline.tsx`: claves `response-${index}` / `review-${index}` con el índice de `buildTimeline` (orden determinista).
- [x] S12. Revisión de las sugerencias de la ronda 1: todas atendidas (S4-S7 en la ronda 2, S8-S11 aquí). Ver reporte.
