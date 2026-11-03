# 014 · Revisión

## Ronda 1: CAMBIOS

Pruebas ⚠️ (solo falla lo que ya fallaba) · lint:ci ⚠️ (Windows, salida 3; lo nuevo no suma avisos) · build ✅ · tsc ✅ · audit:ci ⚠️ (Windows, salida 3; comprobada a mano: sin hallazgos)

Comandos corridos por el reviewer (2026-10-28, sobre `dev` con los cambios sin commitear y las
`NEXT_PUBLIC_*` ficticias de `CLAUDE.md`):

| Comando | Resultado |
|---|---|
| `npm test` | 936 de 937 en verde. Solo falla `routeProtection.test.ts > /explore/recognitions pertenece a exactamente una clase`, que ya fallaba: la página viene de `d8ddff8` en `dev` y no está en el diff (pendiente ajeno 1). Las dos páginas nuevas quedan clasificadas por el prefijo `/commercial`. |
| `npm run build` | Salida 0. `/commercial/profile/tax-info` pesa 5,59 kB (209 kB de primera carga), `/commercial/profile/establishments` 2,06 kB (196 kB) y `/commercial-onboarding` 28,3 kB (233 kB). |
| `npx tsc --noEmit` (después del build) | Salida 0. |
| `npx next lint` | Salida 0, con 352 avisos frente al tope de 348. Ningún aviso cae en un archivo nuevo. Los avisos que sobran vienen de código que ya está commiteado en `dev` (pendiente ajeno 2). |
| `npx eslint --max-warnings 0` sobre los 35 archivos nuevos o tocados | 0 errores. Hay 2 avisos `no-explicit-any` en `CommercialProfileSeller.tsx:113,132`, que ya existían en `HEAD` (líneas 112 y 131); el diff solo agrega un import y un JSX. |
| `npm run lint:ci` | Salida 3 en Windows: "`next lint` no produjo reporte" (pendiente ajeno 3). |
| `npm run audit:ci` | Salida 3 en Windows (pendiente ajeno 3). A mano, con `npm audit --omit=dev --json`, los cuatro avisos altos (`postcss` ×2, `xlsx` ×2) tienen excepción vigente. Lo demás es moderado o bajo. |
| `.lint-max-warnings` | 348, igual que `origin/main`. |
| `git diff HEAD -- package.json package-lock.json security/ src/middleware.ts __tests__/middleware/ next.config.ts` | Vacío: no hay dependencias, excepciones ni cambios de middleware, `routeAccess.ts` o `Sidebar`. |

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `__tests__/onboarding/onboardingSteps.test.ts` (8 etiquetas, índice 5). La comprobación manual (T18) está pendiente. |
| CA-2 | ✅ | `handleDocumentsNext` no cambia y ya hace `setStep(status.currentStep)`, y existe la rama `TAX_PROFILE_PENDING` (`OnboardingWizard.tsx:825`). La comprobación manual está pendiente. |
| CA-3 | ✅ | `handleTaxProfileSaved` (`OnboardingWizard.tsx:474`) relee el estado. El botón se deshabilita con `isSubmitting \|\| isPending`, y `onSaved` se espera con `await`. Lo cubre `taxProfileKeys.test.ts`; la comprobación manual está pendiente. |
| CA-4 | ✅ | `taxProfileMapping.test.ts` (`fromVersionDetail`, de centavos a pesos). La comprobación manual está pendiente. |
| CA-5 | ✅ | `taxProfileSchema.test.ts` (sin actividades, 0 o 2 principales, CIIU inválido o repetido). |
| CA-6 | ✅ | `taxProfileSchema.test.ts` y `taxProfileMapping.test.ts` (`emptyTaxProfileValues` sin booleanos). |
| CA-7 | ✅ | `taxProfileSchema.test.ts`, `cents.test.ts` y `dateDisplay.test.ts`. |
| CA-8 | ✅ | `incomeOverlap.test.ts` y `taxProfileSchema.test.ts` (el texto de RN-10 en ambas filas). |
| CA-9 | ✅ | `taxProfileMapping.test.ts` (1234,56 → 123456), `cents.test.ts` (0,005 → 1) y `taxProfileSchema.test.ts` ("Máximo 2 decimales"). |
| CA-10 | ✅ | `catalog.test.ts` y `taxProfileMapping.test.ts` (`''` → `null`). `CatalogSelect` se deshabilita con "Aún no disponible". |
| CA-11 | ✅ | `display.test.ts` (`vigentRutDocuments`) y `taxProfileMapping.test.ts`. |
| CA-12 | ✅ | `taxProfileService.test.ts` (ruta y `context`). `CommitmentTextDialog` no tiene casilla, el error queda dentro del modal y el texto se pide solo al abrirlo (`enabled: open`). La comprobación manual está pendiente. |
| CA-13 | ❌ | Las invalidaciones son correctas (`taxProfileKeys.test.ts`), pero agregar o cerrar una sede desde "Gestionar sedes" también envía el formulario de la ficha (bloqueante 1). |
| CA-14 | ✅ | `taxProfileMapping.test.ts` (sin asesor no se envía el alcance). La nota se ve siempre en `AdvisorySection.tsx:31`. |
| CA-15 | ✅ | `apiErrorDetails.test.ts` y `taxProfileSchema.test.ts` (`sectionForField`). Lo que ve el usuario está en `TaxProfileForm.tsx:256-274`. La comprobación manual está pendiente. |
| CA-16 | ✅ | `taxProfileService.test.ts` (204 → `null`). La comprobación manual (T19) está pendiente. |
| CA-17 | ✅ | `labels.test.ts`, `display.test.ts` y `catalog.test.ts`. La comprobación manual está pendiente (R-1). |
| CA-18 | ✅ | `display.test.ts` (cinco valores, todos distintos). `CommitmentBlock` no tiene casilla. |
| CA-19 | ✅ | `display.test.ts` (`nextVersionMessage`). `confirmBeforeSubmit` cancela sin enviar. La comprobación manual está pendiente. |
| CA-20 | ✅ | `display.test.ts` (`sortVersionsDesc`). `VersionDetail` no muestra revisiones ni botón de editar. |
| CA-21 | ✅ | `dateDisplay.test.ts`. |
| CA-22 | ✅ | `establishmentSchema.test.ts` (`splitEstablishments`). En `EstablishmentsManager` el grupo de cerradas arranca plegado, no hay editar ni eliminar y se ven las ayudas literales. La comprobación manual (T20) está pendiente. |
| CA-23 | ✅ | `establishmentSchema.test.ts` (`http`, `www.` y `@` en cualquier combinación de mayúsculas). |
| CA-24 | ✅ | `establishmentSchema.test.ts` (motivo vacío). La comprobación manual está pendiente. |
| CA-25 | ✅ | `EstablishmentFormDialog.tsx:289-291`: toast con el `message` y el diálogo queda abierto. La comprobación manual está pendiente. |
| CA-26 | ✅ | `TaxAndEstablishmentsLinks` está en Seller y en Premium. La comprobación manual (T21) está pendiente. |
| CA-27 | ✅ | Ninguna de las dos `page.tsx` lleva `'use client'`. `routeInventory.test.ts` pasa, y `routeProtection.test.ts` solo falla por `/explore/recognitions` (ajeno). El middleware no cambia. |
| CA-28 | ✅ | `noPiiLeaks.test.ts`. Además, `readApiError` no expone `config` ni las cabeceras. |
| CA-29 | ✅ | `labels.test.ts` (RN-3), un `grep` de "cambia/modifica/afecta/acepta" en los textos nuevos sin hallazgos, y ningún código de catálogo escrito en el código. |
| CA-30 | ⚠️ | Build, tsc y pruebas pasan, salvo lo ajeno. `lint:ci` y `audit:ci` no corren en Windows (ajeno 3). No hay dependencias nuevas y el tope sigue en 348. |

### Bloqueantes

- `src/components/commercial/tax-profile/sections/EstablishmentsSummarySection.tsx:146`, junto con `src/components/commercial/establishments/EstablishmentFormDialog.tsx:297` y `src/components/commercial/establishments/CloseEstablishmentDialog.tsx:194` (P-11, CA-13, RN-13).

  **Qué pasa:** el diálogo "Gestionar sedes" se renderiza dentro del `<form>` de `TaxProfileForm.tsx:283`. `Dialog` usa `createPortal`, así que en el DOM los formularios de "Agregar sede" y "Cerrar sede" quedan fuera del de la ficha. Pero React propaga los eventos de un portal por el árbol de React, no por el del DOM, y `submit` es un evento delegado: no está en `nonDelegatedEvents` de `react-dom` 19.1. Por eso, al enviar uno de esos formularios, el `submit` sube también al `onSubmit={handleSubmit(onValid, onInvalid)}` de la ficha. El `handleSubmit` de react-hook-form solo hace `preventDefault` y no corta la propagación.

  **Consecuencias:**
  - En el onboarding, con la ficha válida, registrar o cerrar una sede envía la ficha (`PUT`) y hace avanzar el asistente.
  - Con la ficha a medio llenar, aparecen los errores, se abren secciones y el foco salta a un campo detrás del modal.
  - En "Editar ficha" se abre la confirmación "Se creará la versión N+1".

  **Qué haría falta:** cortar la propagación en los formularios internos, por ejemplo `onSubmit={(e) => { e.stopPropagation(); void onSubmit(e); }}` en los dos diálogos, o sacar el `Dialog` de "Gestionar sedes" fuera del `<form>` de la ficha. Conviene además dejar escrito en `tasks.md` (T20) que se comprueba a mano que agregar o cerrar una sede desde la sección f) no envía la ficha.

### Sugerencias (no bloquean)

- `src/components/commercial/tax-profile/TaxProfileForm.tsx:262-270` (RN-15): una clave de `details` como `rutResponsibilityCodes[0]` se convierte en `rutResponsibilityCodes.0`. `sectionForField` sí la encuentra (sección a), pero `useFieldError('rutResponsibilityCodes')` no ve el error del elemento: no se muestra bajo ningún campo ni se suma al toast. Es poco probable, porque los códigos salen del catálogo. Lo mismo pasa con cualquier ruta que no tenga un campo que la pinte. Se podría comprobar con `getFieldState` o con una lista de rutas visibles antes de llamar a `setError`, y mandar al toast lo demás.
- `src/lib/taxProfile/catalog.ts:36`: `displayCode` busca el código sin filtrar por `catalogType`. Si dos tipos comparten un código, la vista de lectura podría mostrar la etiqueta del tipo equivocado. Convendría pasar el tipo.
- `src/components/commercial/tax-profile/TaxProfileReadView.tsx:46`: se detecta "observada" comparando el texto `'Observada'`. Si el diccionario cambia, se pierde la nota destacada. Es mejor exponer `result` en `sectionReviewDisplay` y comparar con `'OBSERVED'`.
- `YesNoRadioGroup` y `CatalogSelect` no reciben `field.ref` del `Controller`, así que `setFocus` no lleva el foco a esas preguntas cuando son el primer error (CA-6). La sección sí se abre.
- `src/components/shared/Dialog.tsx`: no atrapa el foco (Tab puede salir del modal con `aria-modal`). La spec solo pide Escape y que el foco vuelva, pero conviene agregarlo cuando se reutilice en B, C y D.
- `AdvisorySection.tsx:21`: si se escribe un alcance de más de 1000 caracteres y luego se marca "No", el error de `advisorScope` bloquea el envío con el campo oculto. Se podría validar el alcance solo cuando `hasAccountingAdvisor === true`.

### Pendientes ajenos a esta spec (decisiones del usuario, no bloquean)

1. `routeProtection.test.ts` falla por `/explore/recognitions`, que llegó en un commit de `dev` y no está clasificada.
2. `next lint` da 352 avisos frente al tope de 348 por código ya commiteado en `dev`. Esta entrega no agrega ninguno.
3. En Windows, `npm run lint:ci` y `npm run audit:ci` salen con 3 (el script no encuentra `npx`/`npm`). La auditoría se comprobó a mano y está bien. El CI de Linux decide.
4. Las comprobaciones manuales de T17–T22 están pendientes para el usuario; no hay pruebas de navegador en esta entrega.

Nota: para comparar el tope de lint se corrió `git fetch origin main`, que solo actualiza la referencia remota. No se hizo ningún otro git de escritura.

## Ronda 2: APROBADO

Pruebas ⚠️ (solo falla lo que ya fallaba) · lint:ci ⚠️ (no se volvió a correr; ajeno 2 y 3 siguen igual) · build ✅ · tsc ✅ · audit:ci ⚠️ (no se volvió a correr; no cambiaron dependencias)

Comandos corridos por el reviewer (2026-10-28, mismas `NEXT_PUBLIC_*` ficticias):

| Comando | Resultado |
|---|---|
| `npm test` | 937 de 938 en verde: hay una prueba nueva. Solo falla `routeProtection.test.ts > /explore/recognitions`, que ya fallaba (ajeno 1). |
| `npm run build` | Salida 0. Los tamaños no cambian: `tax-info` 5,59 kB, `establishments` 2,06 kB y `commercial-onboarding` 28,3 kB. |
| `npx tsc --noEmit` (después del build) | Salida 0. |
| `npx eslint` sobre los 65 `.ts`/`.tsx` nuevos o tocados | 0 errores. Siguen los 2 avisos `no-explicit-any` de `CommercialProfileSeller.tsx:113,132`, que ya estaban en `HEAD`. |
| `npx next lint` | 352 avisos frente al tope de 348, como en la ronda 1 (ajeno 2). Esta ronda no agrega avisos. |
| `git status` | Los mismos archivos que en la ronda 1. Sigue sin haber cambios en `package.json`, `security/`, el middleware ni `routeAccess.ts`. |

### Verificación de los cambios de la ronda 1

1. **El `submit` de los diálogos de sedes ya no envía la ficha.** Bloqueante 1 de la ronda 1, resuelto.
   - `EstablishmentFormDialog.tsx:56-60` y `CloseEstablishmentDialog.tsx:44-48` llaman a `e.stopPropagation()` y después a `handleSubmit`.
   - En `react-dom` 19.1.0, `processDispatchQueueItemsInOrder` revisa `event.isPropagationStopped()` antes de cada instancia siguiente (`react-dom-client.development.js:16392` y `:16415`). Como la ruta de despacho sigue el árbol de React, el corte vale también a través del portal: el `onSubmit` de `TaxProfileForm.tsx:172` ya no se ejecuta.
   - `handleSubmit` de react-hook-form llama a `preventDefault` de forma síncrona, así que no hay envío nativo.
   - **Botones:** todos los `<button>` de `Dialog.tsx`, `EstablishmentsManager.tsx`, los dos diálogos de sedes, `EstablishmentsSummarySection.tsx`, `CommitmentTextDialog.tsx` y `TaxInfoScreen.tsx` tienen `type` explícito. El único `type="submit"` de cada diálogo pertenece a su propio `<form>`. Además, el dueño de formulario de un control se decide por el árbol del DOM, y el contenido del portal está en `document.body`, fuera del `<form>` de la ficha. Por eso ningún control del portal puede enviar la ficha de forma nativa.
   - **Enter en un input:** el envío implícito apunta al formulario dueño en el DOM, que es el del diálogo, y ese envío se corta igual. En `EstablishmentsManager` no hay inputs fuera de esos dos `<form>`, y la ficha no tiene `onKeyDown`.
   - `CommitmentTextDialog` no tiene `<form>`. La confirmación de `TaxInfoScreen.tsx:117` es hermana de `TaxProfileFormContainer`, no hija.
   - La comprobación manual quedó escrita en `tasks.md:290` (excepción de P-17: no hay pruebas de componentes) y sigue pendiente para el usuario.
2. **`advisorScope` en `taxProfileSchema.ts:88,98-104`.**
   - El límite pasó al `superRefine` y solo se aplica con `hasAccountingAdvisor === true`.
   - La prueba existente (`taxProfileSchema.test.ts:144-157`) sigue exigiendo "Máximo 1000 caracteres" en `advisorScope` con "Sí", junto con los otros tres campos. El ajuste no la debilita.
   - La prueba nueva (`:158-166`) se pondría en rojo si se quitara la condición: con "No", espera `{}`.
3. **Vista de lectura.** `TaxProfileReadView.tsx:46` compara `review.result === 'OBSERVED'`, y `sectionReviewDisplay` expone `result` (`display.ts:47,55-56`), que `tsc` valida contra el tipo `SectionReview['result']`.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-13 | ✅ | Invalidaciones en `taxProfileKeys.test.ts`. Agregar o cerrar una sede ya no envía la ficha (verificado en el código, arriba). La comprobación manual de `tasks.md:290` está pendiente. |
| CA-14 | ✅ | `taxProfileMapping.test.ts` y `taxProfileSchema.test.ts:158-166`: con "No", el alcance oculto no bloquea. |
| Resto | — | Sin cambios respecto de la ronda 1 (CA-30 ⚠️ solo por lo ajeno). |

### Bloqueantes
- Ninguno.

### Sugerencias (no bloquean)
- Siguen vigentes las de la ronda 1 que no se tocaron:
  - `details` con índice en `TaxProfileForm.tsx`;
  - `displayCode` sin tipo de catálogo;
  - `field.ref` en `YesNoRadioGroup` y `CatalogSelect`;
  - trampa de foco en `Dialog.tsx`.
- `Dialog.tsx` podría cortar en un solo sitio los eventos sintéticos que salen del portal, o el diálogo de "Gestionar sedes" podría vivir fuera del `<form>` de la ficha. Así un `<form>` futuro dentro de un `Dialog` anidado en otro formulario no repetiría el problema. Hoy el corte depende de que cada diálogo se acuerde de hacerlo.

### Pendientes ajenos (sin cambios desde la ronda 1)
1. `/explore/recognitions` sin clasificar en `routeAccess.ts`.
2. 352 avisos frente al tope de 348, por código ya commiteado en `dev`.
3. `lint:ci` y `audit:ci` salen con 3 en Windows. El CI de Linux decide.
4. Las comprobaciones manuales de T17–T22 siguen pendientes para el usuario, ahora también la nota de `tasks.md:290`.

Nota: en esta ronda no se hizo ningún git de escritura.
