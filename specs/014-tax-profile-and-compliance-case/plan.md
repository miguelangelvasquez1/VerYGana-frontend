# 014 · Plan: ficha tributaria y establecimientos del empresario (entrega A)

- **Spec:** `spec.md` de esta carpeta (Estado: Aprobada, 2026-10-27). Es solo la entrega A.
- **Contrato con la API:** `backend-contract.md` (secciones 0, 1, 2, 3, 4.1, 4.2 y 4.3), comprobado
  contra el checkout de la API (solo lectura): `controllers/tax/CommercialTaxProfileController.java`,
  `controllers/declarations/DeclarationController.java`, `dtos/tax/TaxProfileDTOs.java`,
  `dtos/tax/TaxProfileSubmitRequestDTO.java`, `dtos/tax/TaxRequestDTOs.java`,
  `services/tax/TaxProfileServiceImpl.java`, `services/tax/CommercialEstablishmentServiceImpl.java` y
  `services/commercial/CommercialDocumentServiceImpl.java`.
- **Adaptación al repo:** `instrucciones.md` sección 3 y 4.12 (donde difiere, manda `spec.md`).
- **Fecha del plan:** 2026-10-27. Lecturas hechas sobre `dev` en `a911175`.
- **Tareas:** `tasks.md` de esta carpeta (23 tareas en 4 bloques).

## 1. Resumen

Se agrega la base compartida (los cuatro archivos de tipos completos, el diccionario de textos y
colores, utilidades puras con prueba, servicios y hooks de TanStack Query solo de lo que usa A), un
formulario compartido `TaxProfileForm` (react-hook-form + zod) que se usa en un paso nuevo
"Ficha tributaria" del asistente de `/commercial-onboarding` y en dos páginas nuevas de servidor bajo
`/commercial/profile` (`tax-info` y `establishments`), con accesos desde "Mi perfil". No cambia el
middleware ni el `Sidebar`, no hay dependencias nuevas y todos los endpoints ya existen en la API.

## 2. Lo que se encontró al leer el código

### 2.1 Front

- `OnboardingStep` está en `src/services/commercial/OnboardingService.ts` (no en `src/types`), junto a
  `ApiErrorBody` (`message`, `details?: Record<string,string>`), `MAX_DOCUMENT_SIZE_BYTES`,
  `OnboardingDocument` (`status: string`) y `getDocuments()`. El único `Record` exhaustivo sobre los
  pasos es `STEP_INDEX` de `OnboardingWizard.tsx`; `ComplianceService.ts` y `types/ads/commercial.ts`
  solo usan el tipo y `NegotiationsPanel.tsx` formatea el paso crudo (no se rompe nada más).
- `OnboardingWizard.tsx` (cliente, 885 líneas): `STEP_LABELS` (7) y `STEP_INDEX`. `handleDocumentsNext`
  ya hace `continueDocuments()` → `getStatus()` → `setStep(status.currentStep)`: CA-2 solo necesita
  el paso nuevo, su índice y su rama de render. El asistente carga sus datos con el servicio y
  `useEffect` (deuda P-10); el estado del onboarding **no** tiene `queryKey` en ningún sitio
  (`grep "queryKey.*onboarding"`: nada). Al llegar a `CONTRACT_PENDING` el efecto del resumen
  (`hasLoadedSummaryRef`) se dispara solo: no hay que tocarlo.
- `onboarding.shared.tsx` tiene `extractApiError` (con conversiones de tipo, sin guardia), `formatCOP`
  (centavos → COP sin decimales), `FieldWrapper`, `inputCls` y `BoolToggle` (dos botones, no un grupo
  de radio). Se reutilizan `FieldWrapper` e `inputCls` por estilo; `BoolToggle` no sirve para RN-7 /
  accesibilidad (no es un grupo de radio con nombre), así que se crea `YesNoRadioGroup`.
- `src/app/commercial/profile/page.tsx` es `'use client'` (deuda P-2) y elige entre
  `CommercialProfileSeller.tsx` y `CommercialProfilePremium.tsx`. En ambos, el bloque de "Tu plan"
  (después de `<ProfileContactInfo />`) es el sitio natural del bloque nuevo.
- `src/app/commercial/layout.tsx` es de servidor y monta `DashboardLayout`; `ReactQueryProvider` y el
  `Toaster` de `react-hot-toast` están en el layout raíz, así que también cubren `/commercial-onboarding`
  (que está fuera de `/commercial`). Valores por defecto de las consultas: `staleTime` 60 s,
  `retry: 1`, sin `refetchOnWindowFocus`; mutaciones sin reintento.
- Fábrica de claves de referencia: `commercialDashboardKeys` en
  `src/hooks/commercial/useCommercialDashboard.ts`; `locationKeys` en `src/hooks/useLocation.ts`
  (`useDepartments`, `useMunicipalities(departmentCode)`, con `Municipality.code` = DANE).
  Mutaciones con `setQueryData`: `src/hooks/ads/mutations.ts`.
- Formulario rhf + zod de referencia: `src/app/(consumer)/explore/profile/edit/page.tsx`
  (`zodResolver`). Versiones: `react-hook-form` 7.71.2, `@hookform/resolvers` 5.2.2, `zod` 4.6.6.
- `src/lib/utils/dateTime.ts` **no sirve** para mostrar: convierte valores de `<input>` a ISO con el
  desfase del navegador (para enviar). Hace falta formateo de presentación en hora de Colombia y de
  `AAAA-MM-DD` sin pasar por `new Date('AAAA-MM-DD')`.
- Diálogos e insignias existentes:
  - `src/components/compliance/ui/primitives.tsx`: `Modal` (Escape, foco que entra y vuelve, scroll
    bloqueado) y `StatusTag`, pero con la piel del portal de cumplimiento (`compliance-root`, fuente
    Plex, colores `cmp-*`, `framer-motion`). No se usa en pantallas del empresario.
  - `src/components/generic/ConfirmDialog.tsx`: sin Escape ni devolución de foco, cierra y hace su
    propio `toast` con `err: any` al fallar (chocaría con el manejo de `details` de RN-15).
  - `src/components/shared/` no tiene diálogo ni insignia.
  → Se crean `src/components/shared/Dialog.tsx` (modelado sobre `Modal` de cumplimiento, sin
  animación ni piel de cumplimiento) y `src/components/shared/StatusBadge.tsx` (decisión D-6).
- Pruebas: Vitest en entorno `node`, `__tests__/**/*.test.ts`, alias `@` en `vitest.config.mts`;
  `vi.mock` ya se usa (`__tests__/proxy/route.test.ts`). `.lint-max-warnings` = **348**.
- `__tests__/middleware/routeAccess.ts` tiene `{ path: '/commercial', match: 'prefix', role:
  'ROLE_COMMERCIAL' }`: las dos páginas nuevas quedan cubiertas sin tocar la tabla.
  `/commercial-onboarding` está en `PUBLIC` (sin ruta nueva). No se crea ningún route handler.
- El alcance de las pruebas de navegador es el consumidor (`__tests__/ui/consumerScope.ts`, `e2e/`):
  los componentes nuevos de `/commercial` no entran.

### 2.2 API (comprobado en el código, no supuesto)

- `GET /commercials/tax-profile` devuelve `ResponseEntity.noContent()` si no hay ficha (204 sin cuerpo).
- `PUT /commercials/tax-profile`: falla con 400 y solo `message` (`InvalidRequestException`) en:
  carga documental incompleta ("Complete la carga documental antes de diligenciar la ficha
  tributaria."), principal ≠ 1, CIIU repetidos, responsabilidad RUT repetida, código fuera del
  catálogo vigente, fin < inicio, fin > hoy en `America/Bogota`, solapamiento (misma regla que RN-10:
  mismo concepto, periodos que se cruzan con extremos incluidos, y alcance igual o uno
  `CONSOLIDATED_INCLUDES_PLATFORM`), y `rutDocumentId` / `supportDocumentId` que no sea un documento
  propio en estado `VALIDATED`. Falla con 400 y `details` por campo en la validación de Bean
  Validation (`activities[0].ciiuCode`, `currentCapacity`, `incomeReports[0].amountCents`, …).
  Al recibir la ficha mueve `TAX_PROFILE_PENDING` → `CONTRACT_PENDING`.
- `continueToContract` deja `TAX_PROFILE_PENDING` o `CONTRACT_PENDING` según exista ficha.
- `GET /commercials/onboarding/documents` no exige paso editable (sirve también después del registro)
  y lista los documentos no `ORPHANED` con su `status` (`PENDING` / `VALIDATED` / `SUPERSEDED`);
  "RUT vigente" = `documentType === 'RUT' && status === 'VALIDATED'`. Trae `downloadUrl` firmada en los
  vigentes: no se muestra ni se guarda fuera de la caché en memoria.
- `POST /commercials/establishments`: la API rechaza además `.com` y `.co` como palabra
  (`(?i)(https?://|www\.|\.com\b|\.co\b|@)`), con su propio mensaje ("Indique la dirección física de la
  sede. Un sitio web, correo o red social no es un establecimiento."); y la dirección repetida activa
  en el mismo municipio. `municipalityCode` con `\d{5}`. `close`: 400 "Este establecimiento ya está
  cerrado.", 404 si no es suyo.
- `GET /commercials/declarations/{code}?context=…` **registra en la API que el texto se puso a
  disposición** (comentario del controller). No acepta nada (ver D-7).
- `GET /commercials/tax-profile/versions/{n}`: 404 `EntityNotFoundException` si no existe.

## 3. Archivos

### 3.1 Crear

| Archivo | Qué contiene |
|---|---|
| `src/types/commercial/TaxProfile.types.ts` | Sección 1.1 del contrato tal cual (importa `Manifestation`). |
| `src/types/commercial/Expediente.types.ts` | Sección 1.2 tal cual. |
| `src/types/commercial/Declaration.types.ts` | Sección 1.3 tal cual (incluye `ContractApproveRequest`, que usa B). |
| `src/types/compliance/InformationRequest.types.ts` | Sección 1.4 tal cual (carpeta nueva; importa `CommercialDocumentType`). |
| `src/lib/labels/taxCompliance.ts` | Diccionario único de la sección 3 del contrato: texto y tono (`blue`/`orange`/`green`/`gray`/`red`) por valor; incluye los enums de B, C y D. Títulos de sección a)–h). Textos de relación de sede. |
| `src/lib/money/cents.ts` | `parsePesosInput(text)`, `pesosToCents`, `centsToPesosInput(cents)`, `formatCents(cents)` (COP, hasta 2 decimales). Aritmética sobre la cadena, sin `parseFloat` sin redondear. |
| `src/lib/utils/dateDisplay.ts` | `todayInBogota(now?)` → `AAAA-MM-DD`; `formatPlainDate('2026-10-01')` → "1 de octubre de 2026" sin `new Date(cadena)`; `formatBogotaDateTime(iso)` con `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })`. |
| `src/lib/api/apiError.ts` | `readApiError(err)` con `axios.isAxiosError` y guardia de tipo (sin `any`, P-9) → `{ status?, message?, details? }`; `toFormFieldPath(dtoPath)` (`activities[0].ciiuCode` → `activities.0.ciiuCode`, `incomeReports[1].amountCents` → `incomeReports.1.amount`). |
| `src/lib/taxProfile/incomeOverlap.ts` | `findIncomeOverlaps(rows)` → índices de filas que chocan (RN-10, misma regla que la API). |
| `src/lib/taxProfile/taxProfileSchema.ts` | `TaxProfileFormValues`, `emptyTaxProfileValues()`, `createTaxProfileSchema({ today })`, `toSubmitRequest(values)`, `fromVersionDetail(detail, { catalog, vigentRutIds })`, `sectionForField(path)`. |
| `src/lib/taxProfile/establishmentSchema.ts` | `establishmentSchema`, `closeEstablishmentSchema`, `splitEstablishments(list)` (activos / cerrados). |
| `src/lib/taxProfile/catalog.ts` | `groupCatalog(entries)` por `catalogType` (los cinco tipos siempre presentes), `catalogOptionLabel(entry)` → `código — etiqueta`, `displayCode(code, entries)` (etiqueta o el código solo). |
| `src/lib/taxProfile/display.ts` | `commitmentDisplay(manifestation)` (tabla de la sección 3 de la spec), `sectionReviewDisplay(reviews, section)`, `sortVersionsDesc(list)`, `vigentRutDocuments(docs)`, `nextVersionMessage(current)`. |
| `src/services/commercial/TaxProfileService.ts` | `getTaxProfile` (204 → `null`), `submitTaxProfile`, `listTaxProfileVersions`, `getTaxProfileVersion(n)`, `getTaxCatalog`, `listEstablishments`, `createEstablishment`, `closeEstablishment(id, body)`; todo vía `apiClient`. |
| `src/services/commercial/DeclarationService.ts` | Solo `getDeclaration(code, context)` → `GET /commercials/declarations/{code}` con `params: { context }`. `approveContract` es de B y va en `OnboardingService`. |
| `src/hooks/commercial/taxProfileKeys.ts` | Fábrica de claves (sin `'use client'`, importable desde Vitest) y `TAX_PROFILE_INVALIDATIONS` por mutación. |
| `src/hooks/commercial/useTaxProfile.ts` | `'use client'`. Consultas y mutaciones (sección 6). |
| `src/components/shared/Dialog.tsx` | `'use client'`. Portal, `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape cierra solo el diálogo de arriba (pila de diálogos abiertos: hay anidados), foco que entra y vuelve, scroll bloqueado. Estilo del panel comercial. |
| `src/components/shared/StatusBadge.tsx` | Insignia que recibe `{ label, tone }` del diccionario. Componente sin estado (no lleva `'use client'`). |
| `src/components/commercial/tax-profile/CollapsibleSection.tsx` | Botón con `aria-expanded` / `aria-controls`; abierto controlado desde el formulario (para abrir la sección con errores). |
| `src/components/commercial/tax-profile/YesNoRadioGroup.tsx` | `fieldset` + `legend`, dos `input type="radio"` con el mismo `name`, sin valor inicial; error asociado con `aria-describedby`. |
| `src/components/commercial/tax-profile/CatalogSelect.tsx` | `CatalogSelect` (uno) y `CatalogMultiSelect` (casillas, sin repetir) a partir del catálogo agrupado; sin entradas → deshabilitado "Aún no disponible". |
| `src/components/commercial/tax-profile/CommitmentTextDialog.tsx` | Enlace "Leer el compromiso de formalización" / "Leer texto" + `Dialog` que pide el texto (`enabled` solo al abrir), muestra `fullText` literal (`whitespace-pre-line`), la nota "Este compromiso se manifiesta al aprobar el contrato" y un único botón "Cerrar". Error: "No pudimos cargar el texto" + "Reintentar" dentro del diálogo. |
| `src/components/commercial/tax-profile/sections/RutSection.tsx` … `AdvisorySection.tsx` | Ocho secciones a)–h) (`RutSection`, `RegimeActivitiesSection`, `VatIncSection`, `InvoicingSection`, `IncomeSection`, `EstablishmentsSummarySection`, `GrowthSection`, `AdvisorySection`), con `useFormContext` / `useFieldArray`. |
| `src/components/commercial/tax-profile/TaxProfileForm.tsx` | `'use client'`. `FormProvider`, bloque informativo, enlace del compromiso, secciones, envío, mapeo de `details`, apertura de secciones con error. |
| `src/components/commercial/tax-profile/TaxProfileFormContainer.tsx` | `'use client'`. Carga en paralelo ficha, catálogo, sedes y documentos del onboarding; estados de carga / error / 403; arma los valores iniciales. Lo usan el paso del onboarding y el perfil. |
| `src/components/commercial/tax-profile/TaxProfileReadView.tsx` | Vista de lectura por sección a)–h), con o sin revisiones (historial sin revisiones). |
| `src/components/commercial/tax-profile/CommitmentBlock.tsx` | Bloque "Compromiso de formalización" según `commitmentDisplay` + `CommitmentTextDialog`. Sin casilla. |
| `src/components/commercial/tax-profile/TaxProfileHistory.tsx` | Pestaña "Historial": lista y detalle de una versión en solo lectura. |
| `src/components/commercial/tax-profile/TaxInfoScreen.tsx` | `'use client'`. Pantalla de `/commercial/profile/tax-info`: estados, cabecera, banner, pestañas, edición con confirmación. |
| `src/components/commercial/establishments/EstablishmentsManager.tsx` | `'use client'`. Lista Activos / Cerrados (plegado), ayudas, "Agregar sede", "Cerrar sede". Se usa en la página y en el modal de la sección f). |
| `src/components/commercial/establishments/EstablishmentFormDialog.tsx` | Diálogo "Agregar sede" (rhf + zod, departamento → municipio con `useDepartments` / `useMunicipalities`). |
| `src/components/commercial/establishments/CloseEstablishmentDialog.tsx` | Diálogo "Cerrar sede" con motivo obligatorio. |
| `src/components/commercial/onboarding/onboardingSteps.ts` | `STEP_LABELS` (8) y `STEP_INDEX` sacados del asistente, puros y con prueba. |
| `src/components/commercial/onboarding/steps/5b-TaxProfileStep.tsx` | Paso del asistente: título, `TaxProfileFormContainer` en modo onboarding ("Guardar y continuar"). |
| `src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx` | Bloque "Información tributaria y sedes" con dos `next/link`. Sin estado (sin `'use client'`). |
| `src/app/commercial/profile/tax-info/page.tsx` | Página de **servidor**: `metadata`, enlace "Volver a Mi perfil", título y `<TaxInfoScreen />`. |
| `src/app/commercial/profile/establishments/page.tsx` | Página de **servidor**: `metadata`, enlace de vuelta, título y `<EstablishmentsManager />`. |
| Pruebas en `__tests__/` | `money/cents.test.ts`, `utils/dateDisplay.test.ts`, `api/apiErrorDetails.test.ts`, `taxProfile/labels.test.ts`, `taxProfile/incomeOverlap.test.ts`, `taxProfile/catalog.test.ts`, `taxProfile/display.test.ts`, `taxProfile/taxProfileSchema.test.ts`, `taxProfile/taxProfileMapping.test.ts`, `taxProfile/establishmentSchema.test.ts`, `taxProfile/taxProfileService.test.ts`, `taxProfile/taxProfileKeys.test.ts`, `onboarding/onboardingSteps.test.ts`, `taxProfile/noPiiLeaks.test.ts`. |

### 3.2 Modificar

| Archivo | Cambio |
|---|---|
| `src/services/commercial/OnboardingService.ts` | `'TAX_PROFILE_PENDING'` en `OnboardingStep`, entre `DOCUMENTS_PENDING` y `CONTRACT_PENDING`. Nada más. |
| `src/components/commercial/onboarding/OnboardingWizard.tsx` | Importa `STEP_LABELS` / `STEP_INDEX` de `onboardingSteps.ts` (quita las constantes locales); rama `step === "TAX_PROFILE_PENDING"` con `<TaxProfileStep onSaved={handleTaxProfileSaved} />`; `handleTaxProfileSaved` relee `getStatus()`, llama `syncRejectionState`, `onCompleted()` si `completed`, si no `setStep(status.currentStep)`. `handleDocumentsNext` no cambia. |
| `src/components/commercial/profile/CommercialProfileSeller.tsx` | `<TaxAndEstablishmentsLinks />` después del bloque "Tu plan". |
| `src/components/commercial/profile/CommercialProfilePremium.tsx` | Igual. |

No se tocan `src/middleware.ts`, `__tests__/middleware/routeAccess.ts`, el `Sidebar`, `next.config.ts`,
`package.json` ni `PagedResponse`.

## 4. Rutas y acceso

| Ruta | Archivo | Rol | Tipo |
|---|---|---|---|
| `/commercial/profile/tax-info` | `src/app/commercial/profile/tax-info/page.tsx` | `ROLE_COMMERCIAL` (prefijo `/commercial` ya en `matcher`, en el cuerpo del middleware y en `ROLE_RULES`) | servidor; lo interactivo en `TaxInfoScreen` |
| `/commercial/profile/establishments` | `src/app/commercial/profile/establishments/page.tsx` | igual | servidor; lo interactivo en `EstablishmentsManager` |
| paso del onboarding | sin ruta nueva (`/commercial-onboarding`, `PUBLIC`) | — | dentro del asistente (cliente) |

- **P-4:** no hay ruta nueva fuera de un prefijo protegido ni route handler nuevo, así que no hay
  cambios en `matcher`, cuerpo del middleware ni `routeAccess.ts`. Se comprueba con
  `npx vitest run __tests__/middleware` (CA-27): `routeProtection.test.ts` recorre `src/app`, clasifica
  las dos páginas nuevas por el prefijo y las prueba con las seis identidades.
- **P-5:** el middleware solo actúa con `MIDDLEWARE=ACTIVE`; la API protege los datos
  (`@PreAuthorize("hasRole('COMMERCIAL')")`, 403 si no). La pantalla muestra "No tienes permiso para ver
  esta información" ante un 403.
- **P-2:** las dos `page.tsx` no llevan `'use client'`; no usan `params` ni `searchParams` (P-6 no aplica).
  `TaxAndEstablishmentsLinks` y `StatusBadge` no necesitan cliente.
- **P-7:** enlaces internos con `next/link`; no hay imágenes.

## 5. Contrato con la API

Todo vía `apiClient` (`src/lib/api/client.ts`); los 401, 402, 503 y el 400 de cambio de plan los resuelve
el interceptor y no se reimplementan. Tipos de `src/types/commercial/*`.

| Método y ruta | Servicio | Entrada → salida | Errores y lo que ve el usuario |
|---|---|---|---|
| `GET /commercials/tax-profile` | `getTaxProfile()` | — → `TaxProfileResponse \| null` (204 → `null` mirando `response.status`, no `data === ""`) | Red / 5xx: "No pudimos cargar tu ficha tributaria" + "Reintentar". 403: "No tienes permiso para ver esta información". |
| `PUT /commercials/tax-profile` | `submitTaxProfile(body)` | `TaxProfileSubmitRequest` → `TaxProfileResponse` | 400: toast con `message`; cada `details` bajo su campo (RN-15); clave sin campo visible se suma al toast. Sin `message`: "No pudimos guardar tu ficha. Intenta de nuevo". Lo escrito se conserva. |
| `GET /commercials/tax-profile/versions` | `listTaxProfileVersions()` | → `VersionSummary[]` | Error solo en la pestaña Historial ("No pudimos cargar el historial" + "Reintentar"). |
| `GET /commercials/tax-profile/versions/{n}` | `getTaxProfileVersion(n)` | → `TaxProfileVersionDetail` | 404: "No encontramos esa versión". Otro: error en la pestaña. |
| `GET /commercials/tax-profile/catalog` | `getTaxCatalog()` | → `CatalogEntry[]` | Hace fallar la carga inicial del formulario ("Reintentar"). En la vista de lectura, sin catálogo se muestran los códigos solos. |
| `GET /commercials/establishments` | `listEstablishments()` | → `Establishment[]` | Página: "No pudimos cargar tus sedes" + "Reintentar". En el formulario: falla la carga inicial. |
| `POST /commercials/establishments` | `createEstablishment(body)` | `EstablishmentRequest` → `Establishment` | 400 (canal digital, dirección repetida, municipio): toast con `message`; el diálogo sigue abierto con lo escrito (CA-25). |
| `POST /commercials/establishments/{id}/close` | `closeEstablishment(id, body)` | `CloseEstablishmentRequest` → `Establishment` | 400 "Este establecimiento ya está cerrado." / 404: toast con `message`; el diálogo sigue abierto. |
| `GET /commercials/declarations/FORMALIZATION_COMMITMENT?context=TAX_PROFILE` | `getDeclaration(code, context)` | → `DeclarationView` | Error dentro del diálogo: "No pudimos cargar el texto" + "Reintentar"; el formulario sigue usable. |
| `GET /commercials/onboarding/status` (existe) | `OnboardingService.getStatus()` | → `OnboardingStatus` | Ya lo maneja el asistente. |
| `GET /commercials/onboarding/documents` (existe) | `OnboardingService.getDocuments()` | → `OnboardingDocumentsResponse` | Parte de la carga inicial del formulario. |

**Nada falta en la API**: no hay dependencias pendientes. Diferencias de texto que no bloquean: el
mensaje de la API para canal digital ("Indique… Un sitio web…") difiere del texto de validación del
front de RN-14 ("Indica… Una página web…"); cada uno se muestra en su caso (validación local / rechazo
de la API), y la API además rechaza `.com` y `.co`, que el front no valida (se ve el `message`).

## 6. Datos y estado (P-10)

`src/hooks/commercial/taxProfileKeys.ts`:

```ts
taxProfileKeys = {
  all:            ['commercial-tax-profile'],
  profile:        ['commercial-tax-profile', 'profile'],
  versions:       ['commercial-tax-profile', 'versions'],
  version: (n) => ['commercial-tax-profile', 'versions', n],
  catalog:        ['commercial-tax-profile', 'catalog'],
  establishments: ['commercial-establishments'],
  declaration: (code, context) => ['commercial-declarations', code, context],
  onboardingAll:  ['commercial-onboarding'],
  onboardingDocuments: ['commercial-onboarding', 'documents'],
}
```

| Hook | Clave | Opciones |
|---|---|---|
| `useTaxProfile()` | `profile` | por defecto (60 s). |
| `useTaxProfileVersions({ enabled })` | `versions` | `enabled` solo con la pestaña Historial abierta. |
| `useTaxProfileVersion(n \| null)` | `version(n)` | `enabled: n != null`; `staleTime: Infinity` (una versión enviada no cambia); `retry: false` en 404. |
| `useTaxCatalog()` | `catalog` | `staleTime` 10 min (cambia poco). |
| `useEstablishments()` | `establishments` | por defecto. |
| `useOnboardingDocuments()` | `onboardingDocuments` | `staleTime: 0` (el RUT pudo subirse un momento antes en el paso de Documentos, que no usa Query). |
| `useDeclaration(code, context, { enabled })` | `declaration(code, context)` | `enabled` solo con el diálogo abierto; `staleTime` 30 min para no repetir el GET (que la API registra) cada vez que se abre (D-7). |
| `useSubmitTaxProfile()` | — | `onSuccess`: `setQueryData(profile, respuesta)` e invalida `profile`, `versions` y `onboardingAll` (RN-17). |
| `useCreateEstablishment()` / `useCloseEstablishment()` | — | `onSuccess`: invalida `establishments` y `profile` (RN-17; trae `activeEstablishments`). |

- `TAX_PROFILE_INVALIDATIONS` declara esas listas y los hooks las recorren: así la prueba
  `taxProfileKeys.test.ts` comprueba RN-17 sin montar React.
- El estado del onboarding no tiene consulta propia hoy: el asistente lo relee con
  `OnboardingService.getStatus()` tras guardar (patrón existente del asistente, deuda P-10 aceptada en
  ese archivo). Invalidar `onboardingAll` deja listo el camino para cuando exista una consulta.
- Doble envío (P-11, RN-16): los botones de envío se deshabilitan con `formState.isSubmitting` o
  `mutation.isPending`; el `onSubmit` del formulario espera (`await`) también al `onSaved` del
  asistente, así que "Guardar y continuar" sigue deshabilitado mientras se relee el estado.
- Re-renders: `IncomeSection` observa solo `incomeReports` (`useWatch({ name: 'incomeReports' })`) para
  el aviso de solapamiento en vivo; no hay `watch()` global del formulario.
- Volumen: pocas filas por empresario; sin paginación ni virtualización.

## 7. UI

### 7.1 Formulario (`TaxProfileForm`)

- Valores del formulario (`TaxProfileFormValues`): códigos como `string` (`''` = sin elegir), booleanos
  Sí/No como `boolean | undefined` (sin valor inicial, RN-7), montos como texto en pesos, fechas como
  `AAAA-MM-DD` de `<input type="date">`, y por periodo un `supportDocumentId: number | null` oculto
  (RN-11: `null` en filas nuevas, el de la versión al precargar; no se muestra).
- Esquema `createTaxProfileSchema({ today })` (zod 4, `today` = `todayInBogota()` al enviar, inyectable
  en la prueba):
  - actividades: mínimo 1 ("Agrega al menos una actividad"); CIIU `/^\d{4}$/` ("El CIIU tiene 4
    dígitos"); principal = 1 exacta ("Marca exactamente una actividad como principal", en la raíz de
    `activities`); CIIU repetido en la fila repetida ("Este CIIU ya está en otra actividad");
    descripción ≤ 300.
  - Sí/No: `undefined` → "Selecciona una opción" en cada una (RN-7, CA-6).
  - `currentCapacity`: `trim()` no vacío ("Describe lo que puedes atender hoy") y ≤ 2000; escenario y
    medidas ≤ 2000; alcance IVA/INC, notas de facturación y retención, alcance de asesoría ≤ 1000;
    notas de periodo ≤ 500. Mensaje "Máximo N caracteres" (RN-8).
  - periodos: mínimo 1 ("Agrega al menos un periodo"); concepto, alcance, desde, hasta y monto
    obligatorios ("Campo obligatorio"); fin < inicio → "El fin del periodo no puede ser anterior al
    inicio"; fin > hoy → "Informa solo periodos ya cerrados"; monto con `parsePesosInput`: negativo →
    "El monto no puede ser negativo"; no numérico → "Escribe el monto en pesos, por ejemplo 1500000 o
    1234,56" (RN-9).
  - solapamiento: con `findIncomeOverlaps`, un error en el alcance de cada fila que choca con el texto
    de RN-10; bloquea el envío. Además la sección e) marca las filas en vivo (borde naranja y el texto).
- `toSubmitRequest(values)`: pesos → centavos (`pesosToCents`, CA-9); `''` → `null` en códigos (CA-10);
  RUT sin elegir → `rutDocumentId: null` (CA-11); textos opcionales vacíos → se omiten;
  `advisorScope` se omite si "tiene asesor" es No (RN-7); `currency: 'COP'`; `supportDocumentId` se
  copia tal cual.
- `fromVersionDetail(detail, { catalog, vigentRutIds })` (CA-4): centavos → texto en pesos
  (`centsToPesosInput`, coma decimal); booleanos tal cual; `null` → `''`. Códigos que ya no están en el
  catálogo vigente y un `rutDocumentId` que ya no es un RUT vigente arrancan vacíos, con la ayuda de D-3.
- Errores de la API: `readApiError` → toast con `message` (o el texto por defecto) y, por cada
  `details`, `setError(toFormFieldPath(clave), { message })` si el campo existe; si no, el texto se suma
  al toast. Toda sección que tenga un error (de zod en `onInvalid` o de la API) se abre con
  `sectionForField` y se lleva el foco al primer campo con error (`setFocus`).
- Bloque informativo arriba, con el texto literal de 4.1; debajo `CommitmentTextDialog`.
- Sección a): `<select>` con los RUT vigentes (`vigentRutDocuments`, mostrando `originalFileName` y la
  fecha de carga) o el aviso "No tienes un RUT vigente cargado" (y se envía `null`);
  `CatalogMultiSelect` de `RUT_RESPONSIBILITY`.
- Sección b): `CatalogSelect` `REGIME`; lista de actividades con `useFieldArray`: CIIU
  (`inputMode="numeric"`, `maxLength={4}`), descripción, radio "Principal" (un solo grupo de radio para
  toda la lista: al marcar una fila, las demás pasan a `false`), "Quitar" deshabilitado con una sola
  fila, "Agregar actividad".
- Sección c): dos `CatalogSelect` y el área "¿A qué productos o servicios aplica?".
- Sección d): dos `YesNoRadioGroup`, `CatalogSelect` `INVOICING_METHOD` y dos áreas de texto.
- Sección e): filas con concepto (Ingresos / Ventas / Recaudos), desde, hasta, monto en pesos
  (`inputMode="decimal"`, con la vista previa "= $ 1.234,56" con `formatCents` bajo el campo, D-8),
  alcance (textos del diccionario), notas; "Quitar" deshabilitado con una fila; "Agregar periodo".
  En pantallas menores a `md` cada fila es una tarjeta apilada; desde `md`, una cuadrícula.
- Sección f): "Tienes N establecimientos activos" (N = activas de `useEstablishments`) y "Gestionar
  sedes", que abre `Dialog` con `EstablishmentsManager`. Las mutaciones invalidan la lista, así que N se
  actualiza solo (CA-13).
- Sección g): tres áreas de texto con la ayuda literal.
- Sección h): `YesNoRadioGroup`; el área del alcance solo con "Sí"; nota fija "Esta información no le
  da acceso a tu asesor a la plataforma" siempre visible (RN-5, CA-14).
- Botón de envío `type="submit"`: "Guardar y continuar" (onboarding) o "Enviar ficha" (perfil),
  deshabilitado mientras envía. En el perfil, además "Cancelar edición".

### 7.2 Paso del onboarding

`5b-TaxProfileStep.tsx`: título "Ficha tributaria" y `TaxProfileFormContainer mode="onboarding"`. El
contenedor muestra el indicador de carga del asistente (`Loader2`) mientras llegan las cuatro consultas.
Tras un envío correcto llama `onSaved()`; el asistente relee el estado y va a `currentStep` (CA-3). Si
esa relectura falla, el asistente muestra el error con su `handleApiError` y el texto de D-4.

### 7.3 `/commercial/profile/tax-info` (`TaxInfoScreen`)

| Estado | Qué se ve |
|---|---|
| Cargando | Esqueleto (`animate-pulse`) de la cabecera y de ocho filas de sección. |
| 204 | "Aún no has diligenciado tu ficha tributaria" + "Completar ficha" → formulario vacío; al guardar, toast "Ficha enviada. Versión 1" y vista de lectura (CA-16). Sin confirmación previa (D-2). |
| Error | "No pudimos cargar tu ficha tributaria" + "Reintentar" (`refetch`); 403: "No tienes permiso para ver esta información". |
| Con ficha | Pestañas "Ficha actual" / "Historial" (`role="tablist"`, `aria-selected`). Cabecera: `StatusBadge` del estado, "Versión N", "Actualizada el {formatBogotaDateTime(updatedAt)}". Banner naranja si `OBSERVED` (texto literal). `TaxProfileReadView` con revisiones (insignia por sección o "Pendiente de revisión"; nota destacada si `OBSERVED`). `CommitmentBlock`. "Editar ficha". |
| Editando | `TaxProfileFormContainer mode="profile"` precargado. Al enviar con datos válidos, `Dialog` "Se creará la versión {N+1}. La anterior queda en el historial" (Confirmar / Cancelar); Cancelar no envía nada; Confirmar envía, toast "Ficha enviada. Versión {N+1}" y vuelve a la lectura (CA-19). "Cancelar edición" vuelve sin enviar. |
| Historial | Lista con `sortVersionsDesc` ("Versión N · enviada el {fecha Bogotá}"); al elegir una, `TaxProfileReadView` sin revisiones y sin "Editar ficha" (CA-20). |

`TaxProfileReadView`: códigos con `displayCode` (CA-17, RN-4); montos con `formatCents`; fechas
`AAAA-MM-DD` con `formatPlainDate` (CA-21); sección a) "Documento RUT vinculado" / "Sin documento RUT
vinculado" (sin mostrar ids ni URL); sección f) `establishmentsCount` de la versión; sección h) siempre
con la nota de RN-5.

`CommitmentBlock` según `commitmentDisplay` (CA-18, RN-2): `null` → "Aún no registrado. Se manifiesta
al aprobar el contrato"; `MANIFESTED` → "Manifestado el {fecha Bogotá} por {actorLegalRepName} · versión
{declarationVersion}"; los otros tres con su insignia y tono propios y "Tienes una aclaración
pendiente" **sin enlace**. Siempre "Leer texto". Ninguna casilla.

### 7.4 `/commercial/profile/establishments` (`EstablishmentsManager`)

- Cargando: esqueleto de tres tarjetas. Vacío: "Aún no tienes sedes registradas" + "Agregar sede".
  Error: "No pudimos cargar tus sedes" + "Reintentar".
- Ayudas visibles: "Registra solo sedes físicas. Una página web, red social o correo no es un
  establecimiento" y "¿Hay un dato errado? Cierra esta sede y registra la correcta".
- "Activos": nombre, dirección, municipio (`municipalityName`), relación (diccionario) y "Cerrar sede".
  "Cerrados": botón plegable (cerrado por defecto, `aria-expanded`), con "Cerrada el {fecha Bogotá}" y el
  motivo; no aparece si no hay cerradas. Sin editar ni eliminar (CA-22).
- `EstablishmentFormDialog`: nombre, dirección, departamento → municipio (el municipio se limpia al
  cambiar de departamento; se envía `municipality.code`), relación (`<select>` con placeholder, sin
  valor por defecto). Éxito: toast "Sede registrada", cierra el diálogo. 400: toast con `message`, el
  diálogo sigue abierto con lo escrito (CA-23, CA-25).
- `CloseEstablishmentDialog`: motivo obligatorio (≤ 300), botón "Cerrar sede" deshabilitado mientras
  envía. Éxito: toast "Sede cerrada" (CA-24).

### 7.5 "Mi perfil"

`TaxAndEstablishmentsLinks`: tarjeta "Información tributaria y sedes" con los enlaces "Información
tributaria" (`/commercial/profile/tax-info`) y "Establecimientos" (`/commercial/profile/establishments`),
con el mismo estilo de tarjeta que "Tu plan", en Seller y Premium (CA-26).

### 7.6 Responsive y accesibilidad

- Desde 360 px sin scroll horizontal: filas de actividades y periodos como tarjetas en móvil, las
  pestañas y la cabecera se apilan; el stepper del asistente ya tiene `overflow-x-auto` y pasa a 8
  burbujas (en móvil solo números, las etiquetas son `hidden sm:block`).
- Cada campo con `label` asociado; errores con `aria-describedby` / `aria-invalid`; Sí/No como
  `fieldset` + `legend` + radios con `name`; secciones plegables con `aria-expanded`; diálogos con
  Escape y foco de vuelta; textos en español y código en inglés (P-18).

## 8. Configuración

Ninguna variable de entorno nueva, ningún host nuevo en `images.remotePatterns`, ningún cambio en
`next.config.ts`.

## 9. Dependencias

Ninguna nueva (P-1). Se usan las ya instaladas: `react-hook-form`, `@hookform/resolvers`, `zod`,
`@tanstack/react-query`, `axios`, `react-hot-toast`, `lucide-react`. No se usa `framer-motion` en los
componentes nuevos.

## 10. Seguridad y PII (P-16, P-12)

- Datos sensibles de esta entrega: direcciones de sedes, montos de ingresos, textos de la ficha,
  nombres de archivo del RUT, el nombre del representante legal del compromiso. Ninguno va a
  `console.*`, a la URL (no hay `searchParams` ni `router.push` con datos: las pestañas y la versión
  elegida son estado local), ni a `localStorage` / `sessionStorage`.
- Los errores de axios no se imprimen: `readApiError` extrae solo `status`, `message` y `details`.
- `downloadUrl` (URL firmada) de los documentos del onboarding vive solo en la caché en memoria de
  Query y no se pinta.
- El token sigue el flujo existente (`apiClient` + `tokenStore`); nada nuevo lo toca.
- Verificación automática: `__tests__/taxProfile/noPiiLeaks.test.ts` recorre los archivos nuevos y falla
  con `console.`, `localStorage`, `sessionStorage`, `URLSearchParams`, `window.location` o un
  `router.push` / `href` con `?` (CA-28).

## 11. Llamadas salientes del servidor

No aplica: no se agrega ninguna ruta de `src/app/api` ni `fetch` de servidor. Las páginas nuevas de
servidor no piden datos; todo se pide en el navegador vía `apiClient` (30 s de tiempo límite).

## 12. Efectos colaterales

- Enviar la ficha mueve el onboarding de paso en la API; el asistente lo refleja releyendo el estado.
  Desde el perfil, enviar crea una versión nueva y la API pone el estado en `SUBMITTED` (las revisiones
  previas siguen en `sectionReviews` según la API: se muestran tal como lleguen).
- Crear o cerrar una sede publica un evento en la API (`TaxProfileChangedEvent`); el front solo refresca
  la lista y la ficha.
- Abrir el texto del compromiso hace un GET que la API registra como "puesto a disposición" (D-7). No
  envía aceptación.
- No hay STOMP / SSE ni notificaciones en esta entrega. Ninguna otra pantalla del front muestra estos
  datos todavía (compliance llega con D).
- Si la validación del front falla, no se llama a la API: no se crea versión, no avanza el onboarding,
  no se crea ni cierra la sede, y el formulario conserva lo escrito.

## 13. Trazabilidad

| CA | Tareas | Cómo se verifica |
|---|---|---|
| CA-1 | T17, T18 | `onboardingSteps.test.ts` (8 etiquetas, índice 5 = "Ficha tributaria" entre Documentos y Contrato); manual: recargar en `TAX_PROFILE_PENDING`. |
| CA-2 | T18 | Manual: "Continuar" en Documentos con y sin ficha previa. |
| CA-3 | T11, T16, T18 | `taxProfileKeys.test.ts` (invalidaciones); manual: botón deshabilitado y paso siguiente. |
| CA-4 | T8, T16, T18, T19 | `taxProfileMapping.test.ts` (`fromVersionDetail`, centavos → pesos); manual en onboarding y "Editar ficha". |
| CA-5 | T8, T15 | `taxProfileSchema.test.ts`; manual: errores bajo el campo. |
| CA-6 | T8, T13, T15 | `taxProfileSchema.test.ts` + `taxProfileMapping.test.ts` (`emptyTaxProfileValues` sin booleanos); manual. |
| CA-7 | T3, T4, T8, T15 | `cents.test.ts`, `dateDisplay.test.ts`, `taxProfileSchema.test.ts`; manual. |
| CA-8 | T6, T8, T15 | `incomeOverlap.test.ts`, `taxProfileSchema.test.ts`; manual. |
| CA-9 | T3, T8 | `cents.test.ts`, `taxProfileMapping.test.ts` (1234,56 → 123456; 0,005 → 1). |
| CA-10 | T7, T8, T13 | `catalog.test.ts`, `taxProfileMapping.test.ts`; manual con un tipo vacío. |
| CA-11 | T7, T8, T15 | `display.test.ts` (`vigentRutDocuments`), `taxProfileMapping.test.ts`; manual. |
| CA-12 | T10, T13 | `taxProfileService.test.ts` (ruta y `context`); manual: diálogo sin casilla, error dentro. |
| CA-13 | T11, T14, T15 | `taxProfileKeys.test.ts`; manual: N cambia al cerrar el diálogo. |
| CA-14 | T8, T15 | `taxProfileMapping.test.ts` (alcance omitido con No); manual: nota y alcance condicional. |
| CA-15 | T5, T8, T16 | `apiErrorDetails.test.ts`, `taxProfileSchema.test.ts` (`sectionForField`); manual con un 400 real. |
| CA-16 | T10, T19 | `taxProfileService.test.ts` (204 → `null`); manual. |
| CA-17 | T2, T7, T19 | `labels.test.ts`, `display.test.ts`, `catalog.test.ts`; manual con una ficha observada. |
| CA-18 | T2, T7, T19 | `display.test.ts` (cinco valores, textos distintos); manual del caso disponible. |
| CA-19 | T7, T16, T19 | `display.test.ts` (`nextVersionMessage`); manual: confirmar y cancelar. |
| CA-20 | T7, T19 | `display.test.ts` (`sortVersionsDesc`); manual. |
| CA-21 | T4, T19 | `dateDisplay.test.ts`; manual. |
| CA-22 | T9, T14, T20 | `establishmentSchema.test.ts` (`splitEstablishments`); manual. |
| CA-23 | T9, T14, T20 | `establishmentSchema.test.ts`; manual. |
| CA-24 | T9, T14, T20 | `establishmentSchema.test.ts`; manual. |
| CA-25 | T14, T20 | Manual: dirección repetida en la API. |
| CA-26 | T21 | Manual en Seller y Premium. |
| CA-27 | T19, T20, T23 | `npx vitest run __tests__/middleware`; `grep` de `'use client'` en las dos páginas; `git diff --stat src/middleware.ts` vacío. |
| CA-28 | T22 | `noPiiLeaks.test.ts`; manual: DevTools (URL, Application → Storage, Console). |
| CA-29 | T2, T22 | `labels.test.ts` (textos literales del contrato); revisión de textos de T22 con `grep`; manual. |
| CA-30 | T23 | Las cinco puertas en verde; `git diff package.json package-lock.json` vacío; `.lint-max-warnings` ≤ 348. |

## 14. Riesgos

- **R-1 · Pruebas manuales que dependen de datos de la API.** CA-17 y CA-18 necesitan una ficha
  `OBSERVED` y manifestaciones del compromiso que en A solo se consiguen con la API (revisión de compliance
  por `POST /compliance/tax-profiles/{id}/sections/{section}/review`, y el compromiso hasta que exista B).
  La lógica queda cubierta por `display.test.ts`; lo visual se comprueba con los casos que se puedan
  producir y el resto se anota en el PR (excepción de P-17).
- **R-2 · Soporte de ingresos conservado y ya no vigente.** RN-11 conserva `supportDocumentId`; si ese
  documento dejara de estar `VALIDATED`, la API rechazaría el envío y en A no hay selector para quitarlo.
  En A el front siempre manda `null` en filas nuevas y nadie puede poner un soporte hasta C, así que el
  riesgo es casi nulo; C trae el selector.
- **R-3 · Relectura del estado tras guardar.** Si `getStatus()` falla después de un PUT correcto, un
  segundo "Guardar y continuar" crearía otra versión (inocuo, pero confuso). Se mitiga con el texto de D-4.
- **R-4 · Montos con separador de miles.** Un "1.500" se leería como 1,5 pesos. Se mitiga con la vista
  previa formateada bajo el campo (D-8).
- **R-5 · Escape en diálogos anidados** (Gestionar sedes → Agregar / Cerrar sede): `Dialog` debe cerrar
  solo el de arriba; se comprueba a mano en T20.
- **R-6 · Bundle del asistente.** `TaxProfileStep` se importa de forma estática como los demás pasos;
  el formulario solo suma código de cliente a `/commercial-onboarding` y `/commercial/profile/tax-info`.
  Se revisa el tamaño de ambas en la salida de `npm run build` (T23).

## 15. Decisiones para el usuario

> **Resueltas en la Puerta 2 (2026-10-27):** D-1 → máximo 2 decimales en el formulario ("Máximo 2
> decimales"); la utilidad `pesosToCents` sigue redondeando y se prueba aparte (spec RN-9 y CA-9
> corregidas). D-3 → arrancan vacíos con aviso (spec RN-12b). D-7 → se acepta; RN-1 de la spec
> corregida. D-2, D-4, D-5, D-6 y D-8 → valor por defecto del plan.

- **D-1 · Montos con más de 2 decimales.** RN-9 dice "hasta 2 decimales" y CA-9 pide que `0,005` llegue
  como `1`. Por defecto el plan sigue CA-9: el campo acepta más decimales y redondea al centavo más
  cercano (la vista previa muestra el resultado). Alternativa: rechazar más de 2 decimales con "Máximo 2
  decimales" y verificar CA-9 solo en `cents.test.ts`.
- **D-2 · "Completar ficha" (sin ficha previa) no pide confirmación**: la confirmación de RN-13 aplica a
  "Editar ficha" (la spec la ubica ahí y CA-16 no la menciona). Alternativa: confirmar también con
  "Se creará la versión 1…".
- **D-3 · Precarga con códigos o RUT que ya no son vigentes.** Por defecto arrancan vacíos con la ayuda
  "El código {código} ya no está vigente. Elige otro o deja el campo vacío" (o "El RUT de la versión
  anterior ya no está vigente"), porque la API los rechazaría. Alternativa: conservarlos y dejar que la
  API responda.
- **D-4 · Texto si falla la relectura del estado tras guardar en el onboarding:** "Tu ficha quedó
  guardada, pero no pudimos continuar. Recarga la página." (texto nuevo).
- **D-5 · Textos de validación que la spec no fija** (lista en 7.1 y 7.4: "Agrega al menos una
  actividad", "Marca exactamente una actividad como principal", "El CIIU tiene 4 dígitos", "Este CIIU ya
  está en otra actividad", "Describe lo que puedes atender hoy", "Campo obligatorio", "El monto no puede
  ser negativo", "Escribe el monto en pesos…", "Agrega al menos un periodo", "No pudimos cargar el
  historial", "Escribe el motivo del cierre"). Se aceptan salvo que digas otra cosa.
- **D-6 · Diálogo e insignia nuevos en `src/components/shared/`** en vez de reutilizar
  `generic/ConfirmDialog` (sin Escape ni devolución de foco y con su propio toast) o `Modal` / `StatusTag`
  de cumplimiento (piel del portal de cumplimiento). Informativa: la spec pide reutilizar solo si existe
  algo adecuado.
- **D-7 · El GET del texto del compromiso queda registrado en la API** como "puesto a disposición". RN-1
  dice que abrir o cerrar el modal "no envía nada"; el plan lo interpreta como "no envía aceptación ni
  decisión", pide el texto solo al abrir el diálogo y lo guarda 30 min en caché. Confirma que es lo
  esperado.
- **D-8 · Formato del monto:** se acepta coma o punto como separador decimal (uno solo), sin separador
  de miles, con vista previa "= $ 1.500.000" bajo el campo.

## 16. Bloqueos

Ninguno. La spec está aprobada, no choca con `CLAUDE.md` ni con `docs/constitution.md`, y todos los
endpoints y campos que usa existen en la API.
