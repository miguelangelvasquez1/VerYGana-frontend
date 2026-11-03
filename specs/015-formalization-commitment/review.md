# 015 · Revisión

## Ronda 1: APROBADO

Revisado el 2026-10-28 sobre `dev` (`a911175`) más el árbol de trabajo sin commitear (014 y 015). Las
puertas las corrió el reviewer en Windows 11 con Node 24.11.1 y las variables públicas ficticias de
`CLAUDE.md`.

Pruebas ❌ (ajeno) · lint:ci ❌ (ajeno; la 015 no agrega avisos) · build ✅ · tsc ✅ · audit:ci ✅ (equivalente manual)

### Puertas

| Puerta | Resultado | Detalle |
|--------|-----------|---------|
| `npm test` | ❌ ajeno | 997 de 998 pasan (32 archivos). El único fallo es `routeProtection.test.ts` › `/explore/recognitions pertenece a exactamente una clase`: la página `src/app/(consumer)/explore/recognitions/page.tsx` entró en el commit `d8ddff8` sin clasificar en `routeAccess.ts` (tampoco está en `origin/main`). No lo toca la 015. Las 6 pruebas de `__tests__/formalization/` y las de `__tests__/taxProfile/` (014) pasan. |
| `npm run lint:ci` | sale con 3 en Windows; el equivalente da 0 errores y **352 avisos** con tope 348 | Ver "Lint" abajo. |
| `npm run build` | ✅ | `/commercial-onboarding`: 33,5 kB y First Load JS 239 kB. |
| `npx tsc --noEmit` | ✅ | Después del build. |
| `npm run audit:ci` | sale con 3 en Windows (`spawnSync npm ENOENT`); el equivalente da ✅ | `npm audit --omit=dev --json` evaluado con `evaluateAudit` del propio `scripts/audit-gate.mjs`: `ok: true`, código 0, cuatro excepciones vigentes (2 de `postcss`, 2 de `xlsx`, revisión el 2026-11-30, aprobadas por Nicolás Castro), sin fallos ni avisos. `package.json`, `package-lock.json` y `security/audit-exceptions.json` sin cambios. |

**Por qué salen con 3 en Windows (entorno, no la 015).** Los dos scripts llaman a
`spawnSync('npx', …)` (`scripts/lint-ratchet.mjs:168`) y `spawnSync('npm', …)`
(`scripts/audit-gate.mjs:143`) sin `shell: true`. En Windows `npx` y `npm` son los atajos `.cmd`, que
`spawnSync` sin shell no encuentra (ENOENT). En el CI (Linux) funcionan. Se validó el equivalente a mano:
`npx next lint --format json --output-file …` con el mismo conteo que hace `summarizeEslintReport`, y
`npm audit` evaluado con `evaluateAudit`.

**Lint: de dónde salen los 4 avisos de más.**

- Archivos nuevos del árbol de trabajo (014 y 015): 0 avisos y 0 errores.
- Archivos modificados: 3 avisos, los mismos que en `HEAD` (comprobado con eslint sobre
  `git show HEAD:<archivo>`):
  - `6-ContractStep.tsx`: 1 aviso, `rejectionNotes` sin usar, ahora en la línea 104;
  - `CommercialProfileSeller.tsx`: 2 avisos, `any` en las líneas 113 y 132.
- Conclusión: `HEAD` ya tiene 352 avisos. Los 4 de más vienen de los commits posteriores a `2674a0e`
  (el que fijó el tope en 348). No vienen de la 015 ni de la 014.
- `origin/main` (`e7226e6`, tope 348) solo agrega cambios en archivos de mascota y barra que hoy no
  tienen avisos. No se pudo lintar sin hacer checkout, pero no hay motivo para que baje el conteo.
- **En el CI, `lint:ci` fallará con 1 ("más avisos que el tope") en cualquier PR desde esta base,
  con o sin la 015.** No bloquea esta spec (CA-18 dice "como antes o mejor", y la 015 deja el conteo
  igual), pero hay que arreglar la base antes de mergear: corregir 4 avisos o quitar el código que los
  agregó. Nunca subir el tope (P-19).

**First Load JS.** `/commercial-onboarding` pasa de 233 kB a 239 kB (+6 kB). La causa probable es que
react-hook-form, `@hookform/resolvers/zod` y zod entran ahora en esa ruta por `RefusalReasonDialog`. Son
dependencias ya instaladas (P-1) y que P-11 exige. Es aceptable: ver Sugerencias.

### Criterios de aceptación

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `formalizationTexts.test.ts` (textos literales de RN-2), `commitmentDecision.test.ts` (estado inicial vacío); el bloque está entre el aviso de objeciones y `StepButton` (`6-ContractStep.tsx:455-461`). Manual T10.1 **pendiente**. |
| CA-2 | ✅ | `commitmentDecision.test.ts` (inicial congelado), `taxProfileKeys.test.ts` (`CONTRACT_SHEET`: `staleTime 0`, `gcTime 0`, `refetchOnMount 'always'`), `commitmentStatic.test.ts` (sin `defaultChecked` ni almacenamiento, `useReducer` sin inicializador). Manual T10.2 **pendiente**. |
| CA-3 | ✅ | `commitmentDecision.test.ts` (`{ declarationVersion }` sin la clave `decision`), `approveContractService.test.ts` (ruta, cuerpo, cabecera). Manual T11.1 **pendiente**. |
| CA-4 | ✅ | `commitmentDecision.test.ts`, `approveContractService.test.ts`. Manual T11.2 **pendiente**. |
| CA-5 | ✅ | `commitmentDecision.test.ts` (con motivo recortado; vacío, sin `refusalReason`), `refusalReasonSchema.test.ts`. Manual T11.3 **pendiente**. |
| CA-6 | ✅ | `commitmentDecision.test.ts` (`undoRefusal` → inicial y cuerpo sin `decision`). Manual T10.4 **pendiente**. |
| CA-7 | ✅ | `refusalReasonSchema.test.ts` (1000 sí, 1001 no); `maxLength` y contador en `RefusalReasonDialog.tsx:57-65`; Cancelar, Escape y la X solo llaman a `onClose`. Manual T10.3 **pendiente**. |
| CA-8 | ✅ | `commitmentDecision.test.ts` (`view` nulo → `{}` aunque haya decisión); estado de error con "Reintentar" en `FormalizationCommitmentBlock.tsx:74-90`. Manual T10.5 **pendiente**. |
| CA-9 | ✅ | `commitmentDecision.test.ts` (evidencia y cuerpo sin `decision`). Manual T10.6 **pendiente**. |
| CA-10 | ✅ | `commitmentDecision.test.ts` (otra versión, otro contrato, otros tres estados y nula → sin evidencia). Manual T10.7 **pendiente**. |
| CA-11 | ✅ | `commitmentStatic.test.ts` (el `StepButton` "Aprobar contrato" sin `disabled`); guarda síncrona `approvingRef` (`OnboardingWizard.tsx:528`). Manual T10.8 y T11.4 (doble clic, una sola petición) **pendientes**. |
| CA-12 | ✅ | `contractApproval.test.ts` (misma huella → misma clave sin generar otra; cambia decisión, motivo o versión → otra). La clave se descarta tras un 200 en `useApproveContract.ts:34`; esa línea solo tiene comprobación manual. Manual T11.5 **pendiente**. |
| CA-13 | ✅ | `contractApproval.test.ts` (`VERYGANA_REVIEW_PENDING`, `SIGNATURE_PENDING`, `PAYMENT_PENDING` → `advance`, sin toast). Manual T11.6 **pendiente**. |
| CA-14 | ✅ | `contractApproval.test.ts` (`BUSINESS_REVIEW_PENDING` → `show-error`; `message` de 400 y 422; genérico con 500, red y error que no es de axios). Manual T11.7 **pendiente** (R-1: la rama de 400 con `message` solo por prueba). |
| CA-15 | ⏳ | Solo manual: caja `max-h-[50vh] overflow-y-auto break-words`, `tabIndex={0}` y `role="region"` con nombre accesible (`FormalizationCommitmentBlock.tsx:33-41`). Manual T10.9 (360 px, teclado) **pendiente**. |
| CA-16 | ✅ | `formalizationTexts.test.ts` (sin IVA, régimen, vocación, comisión ni plan; "cambia" solo precedido de "no"), `commitmentStatic.test.ts` (etiqueta y bloque solo en un sitio). Manual T12 **pendiente**. |
| CA-17 | ✅ | `noPiiLeaks.test.ts` con los archivos de la 015 en `TARGETS`; sin `console.*`, almacenamiento ni URL en los archivos nuevos (grep del reviewer); la clave vive en un `useRef` y el motivo en el estado del formulario y del reductor. Manual T12 (DevTools) **pendiente**. |
| CA-18 | ✅ | Ningún aviso nuevo (comprobado arriba); sin dependencias nuevas; build y tsc en verde. Los fallos de pruebas y de `lint:ci` ya existían. |

**Comprobaciones manuales pendientes (las hace el usuario en el navegador; no se dan por hechas):**

- T10, de 1 a 9: CA-1, 2, 6, 7, 8, 9, 10, 11 y 15.
- T11, de 1 a 7: CA-3, 4, 5, 11, 12, 13 y 14, con la cabecera `Idempotency-Key` visible en Network.
- T12: CA-16 y CA-17. En DevTools, tras una negativa con motivo: sin el motivo, la decisión ni la clave
  en consola, URL, `localStorage` ni `sessionStorage`.

### Contrato con la API

Se comprobó contra el checkout de `../VerYGanaAPI`:

- `ContractApproveRequestDTO` (`declarationVersion` ≤ 20, `decision`, `refusalReason` ≤ 1000)
  coincide con `ContractApproveRequest`.
- `DeclarationDTOs.DeclarationView` y `Manifestation` (`id`, `status`, `declarationVersion`,
  `contractId`, `contractVersion`, `occurredAt`, `detail`, `actorLegalRepName`) coinciden con
  `Declaration.types.ts`.
- `CommercialContractController.approve` tiene `@RequestBody(required = false)` y
  `@RequestHeader("Idempotency-Key", required = false)`, bajo `hasRole('COMMERCIAL')`.
- `DeclarationController.view` responde `GET /commercials/declarations/{code}?context=`.
- La 015 no usa `actorLegalRepName` ni ningún id interno de usuario.

### Rutas y roles

No se tocan `src/middleware.ts`, `routeAccess.ts` ni ningún route handler. No hay rutas nuevas
(P-4, P-5).

### Constitución

Sin violaciones en lo que agrega la 015:

- P-2: `'use client'` solo en los dos componentes y los dos hooks; ninguna página ni layout.
- P-9: ningún `any` ni `@ts-ignore`.
- P-10: el texto se pide con `useDeclaration`, y la aprobación es una `useMutation` que invalida
  `profile`, `declarationsAll` y `onboardingAll`.
- P-11: el motivo usa react-hook-form con `zodResolver`; la aprobación tiene guarda con `useRef` y el
  diálogo deshabilita "Confirmar" con `isSubmitting`.
- P-16: ver CA-17.
- P-18: código en inglés; comentarios y textos en español.

La 015 no rompe la 014: `useDeclaration` mantiene su firma, `TAX_PROFILE` sigue con 30 min de
`staleTime` (prueba en `taxProfileKeys.test.ts`), y todas las pruebas de `__tests__/taxProfile/` pasan.

### Bloqueantes

Ninguno de la 015.

Fuera de esta spec, antes del merge (no bloquean la 015):

- `__tests__/middleware/routeAccess.ts` (P-4): `/explore/recognitions` sin clasificar, del commit
  `d8ddff8`. Hay que clasificarla: `ROLE_RULES` + `matcher`, `PUBLIC` o `UNPROTECTED_PENDING`.
- Base con 352 avisos de lint y tope 348 (P-19): `lint:ci` fallará en el CI. Hay que corregir 4 avisos
  de los commits posteriores a `2674a0e`; el tope no se sube.

### Sugerencias (no bloquean)

- `src/hooks/commercial/useApproveContract.ts:21-27`: el `onSuccess` invalida `declarationsAll` con
  `await`, y el paso sigue montado hasta que termina. La consulta `CONTRACT_SHEET` está activa con
  `staleTime: 0`, así que se vuelve a pedir: la API registra una puesta a disposición más después de
  aprobar, y el avance a "Contrato en revisión" espera ese `GET`. Además, tras un `ACCEPT` el bloque
  puede mostrar un instante la evidencia. Alternativas:
  - invalidar `declarationsAll` con `refetchType: 'none'`, o con un `predicate` que excluya
    `CONTRACT_SHEET`;
  - no esperar las invalidaciones antes de devolver el resultado.
- `src/hooks/commercial/useTaxProfile.ts:83-93`: `useDeclaration` no usa
  `retryUnlessForbiddenOrMissing`, así que un 403 o un 404 del texto se reintenta una vez (retraso de
  alrededor de 1 s antes de mostrar el estado). Aplicarlo sería coherente con los demás hooks.
- `scripts/lint-ratchet.mjs:168` y `scripts/audit-gate.mjs:143`: con `shell: process.platform ===
  'win32'` (o usando `npx.cmd` y `npm.cmd`) las dos puertas correrían en Windows. Es otra spec.
- First Load JS +6 kB en `/commercial-onboarding`: si importa, se puede cargar `RefusalReasonDialog`
  con `next/dynamic` al abrirlo.
- `FormalizationCommitmentBlock.tsx:81-87`: "Reintentar" no se deshabilita mientras se envía la
  aprobación. La spec no lo pide, pero sería coherente con el estado "Enviando".

## Ronda 2: APROBADO

Revisado el 2026-10-29 sobre `dev` (`a911175`) más el árbol de trabajo sin commitear (014, 015 y T14-T19).
Puertas corridas por el reviewer en Windows 11 con las variables públicas ficticias de `CLAUDE.md`.

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ✅ (equivalente)

### Puertas

| Puerta | Resultado | Detalle |
|--------|-----------|---------|
| `npm test` | ✅ | 32 archivos, 1012 pruebas, todo en verde. `routeProtection.test.ts` ya pasa con `/explore/recognitions`. |
| `npm run lint:ci` | ✅ equivalente | En Windows sale con 3 (ver ronda 1). `npx next lint --format json`: 0 errores y **348 avisos**, igual al tope. `.lint-max-warnings` = 348 en el árbol, en `HEAD` y en `origin/main`: no sube (P-19). |
| `npm run build` | ✅ | `/commercial-onboarding`: 33,9 kB y First Load JS **239 kB**. |
| `npx tsc --noEmit` | ✅ | Después del build. |
| `npm run audit:ci` | ✅ equivalente | `npm audit --omit=dev --json` (2 altos y 2 moderados) evaluado con `evaluateAudit` de `scripts/audit-gate.mjs` y la lista `exceptions`, con fecha 2026-10-29: `ok: true`, código 0, 4 excepciones vigentes (`xlsx` ×2 y `postcss` ×2, aprobadas por Nicolás Castro, `reviewBy` 2026-11-30), sin fallos ni avisos. |

`git diff` de `package.json`, `package-lock.json`, `src/middleware.ts`, `next.config.ts`, `security/` y
`.lint-max-warnings`: vacío.

### Tareas de la ronda 2

- **T14.** `useApproveContract.ts:21-40`. En TanStack Query v5, `queryKey` y `predicate` se aplican a la
  vez. El hook hace tres cosas:
  1. Las claves `['commercial-declarations', *, 'CONTRACT_SHEET']` se marcan desactualizadas con
     `refetchType: 'none'`, así que no hay `GET` (RN-10).
  2. Las demás declaraciones (la vista `TAX_PROFILE`) se invalidan con la relectura normal, sin esperarla.
  3. Se esperan `profile` y `onboardingAll`.

  No se pierde ninguna de las tres invalidaciones que pide P-10. La decisión de avance no cambia:
  - con un 200, `OnboardingWizard.tsx:532-534` usa el resultado del `POST`;
  - con un error, relee `OnboardingService.getStatus()` (RN-9).

  Con `gcTime: 0`, la consulta `CONTRACT_SHEET` se descarta al desmontarse el paso. La función pura
  `isContractSheetDeclarationKey` tiene prueba (`taxProfileKeys.test.ts:106-124`).
- **T15.** "Reintentar" lleva `disabled={submitting}` (`FormalizationCommitmentBlock.tsx:84`). El barrido
  de `commitmentStatic.test.ts:132-138` falla si se quita.
- **T16.** `retryPolicy.ts` no lleva `'use client'`: 403 y 404 no se reintentan, y lo demás se reintenta
  una vez, como `retry: 1` de `ReactQueryProvider`. `useDeclaration` la usa (`useTaxProfile.ts:84`). Hay
  prueba de la función y un barrido estático del hook. La política de caché por contexto queda intacta.
- **T17.** `next/dynamic` con `ssr: false` en un componente de cliente, montado solo con `dialogOpen`.
  CA-5 y CA-7 se mantienen:
  - el `Dialog` compartido guarda el `opener` y enfoca el panel cuando se monta abierto;
  - Escape, Cancelar, la X y el fondo solo llaman a `onClose`, que desmonta el diálogo y devuelve el foco;
  - el contador y `maxLength` siguen en `RefusalReasonDialog.tsx`;
  - `reset` al abrir sigue funcionando: con el montaje nuevo cada apertura empieza vacía de todas formas.

  **La afirmación del implementer es cierta.** En `.next/app-build-manifest.json`, los chunks iniciales de
  `/commercial-onboarding/page` incluyen react-hook-form (`static/chunks/2998-…js`), que entra por
  `TaxProfileFormContainer` (5b, de la 014). El diálogo quedó en un chunk asíncrono aparte
  (`static/chunks/8447.…js`). Por eso el First Load JS sigue en 239 kB.
- **T18.**
  - `routeAccess.ts:52`: `{ path: '/explore/recognitions', match: 'exact', role: 'ROLE_CONSUMER' }`
    describe lo que ya hace el middleware: `matcher` literal sin `:path*` (`middleware.ts:19`),
    `CONSUMER_ALLOWED` (`:50`) y `matchesPattern` exacto. La página solo admite `CONSUMER`.
    `src/middleware.ts` no se tocó. **Cambio de roles marcado:** la tabla declara ahora que esa ruta exige
    `ROLE_CONSUMER`. Ese requisito ya existía en el middleware desde `d8ddff8`; este cambio no lo
    introduce.
  - Los cuatro avisos quitados no cambian el comportamiento:
    - `UserState` en `UserDetailModal.tsx` era un import de tipo sin uso;
    - `useCallback` en `CreateAdForm.tsx` era un import sin uso;
    - `getCommercialInitialData` en `Header.tsx` era un import sin uso;
    - `rejectionNotes` en `6-ContractStep.tsx` deja de desestructurarse en `ContractGenerateStep`, pero la
      prop sigue en el tipo y el wizard la pasa.

    Los cuatro sin `eslint-disable`. `tsc` y el build confirman que nada los referenciaba.

### Criterios de aceptación

Siguen como en la ronda 1. Lo que cambia:

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-2 | ✅ | Ronda 1 más `taxProfileKeys.test.ts` (`isContractSheetDeclarationKey`). Manual T14 (Network tras aprobar) **pendiente**. |
| CA-5 / CA-7 | ✅ | Ronda 1 más el barrido del import dinámico (`commitmentStatic.test.ts:145`). Manual T17 (foco al abrir, sin parpadeo) **pendiente**. |
| CA-11 | ✅ | Ronda 1 más T15 (`commitmentStatic.test.ts:132-138`). |
| CA-18 | ✅ | Puertas en verde, 348 avisos con tope 348, sin dependencias nuevas. |

### Constitución

Sin violaciones en el diff de la ronda 2:

- P-2: `'use client'` solo donde ya estaba; `retryPolicy.ts` y `taxProfileKeys.ts` no lo llevan.
- P-4 y P-5: tabla coherente con el middleware.
- P-9: ningún `any` ni `@ts-ignore`.
- P-10: claves e invalidaciones correctas.
- P-16: sin logs ni URL nuevos.
- P-18: código en inglés; comentarios en español.
- P-19: el tope no sube y queda igual al conteo real.

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

- `src/hooks/commercial/useApproveContract.ts:23-34`: la prueba de T14 cubre la función pura, pero no
  cómo la usa el hook. Si alguien quita `refetchType: 'none'` o el `predicate`, todas las pruebas siguen
  en verde. En `node` se puede probar con un `QueryClient` real: extraer el `onSuccess` a una función que
  reciba el cliente y comprobar con una consulta observada `CONTRACT_SHEET` que su `queryFn` no se vuelve
  a llamar. Mientras tanto, queda la comprobación manual de Network.
- `FormalizationCommitmentBlock.tsx:12-15`: el `dynamic` no tiene `loading`. Si el chunk tarda o no se
  descarga (red caída), el clic en "No acepto…" no da ninguna respuesta visible. Hoy no cambia el First
  Load JS (ver T17). Valdría la pena un indicador mínimo, o precargar el chunk al pasar el puntero o al
  enfocar el enlace.
- El arreglo de `shell` en `scripts/lint-ratchet.mjs` y `scripts/audit-gate.mjs` para Windows sigue
  pendiente (otra spec).
