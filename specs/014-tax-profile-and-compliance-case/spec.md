# 014 · Ficha tributaria y establecimientos del empresario (entrega A)

- **Estado:** Aprobada
- **Fecha:** 2026-10-27
- **Ticket:** —
- **Origen:** API · `docs/frontend/instrucciones-frontend-caracterizacion.md` (copiado aquí como
  `backend-contract.md`) · numerales 1.7, 4.7 y 4.8 del contrato. Controllers:
  `controllers/tax/CommercialTaxProfileController.java` y
  `controllers/declarations/DeclarationController.java` del repositorio de la API.

> Es la entrega **A** de cuatro (ver `instrucciones.md`, sección 1). B (compromiso en la
> aprobación del contrato), C (expediente y solicitudes del empresario) y D (pantallas de
> compliance) van en sus propias specs (`015`, `016`, `017`). Donde este documento y
> `instrucciones.md` difieren, manda este documento; para endpoints, campos y textos, manda
> `backend-contract.md`.

## Problema

La API ya pide al empresario una **ficha tributaria** (incisos a–h del numeral 4.7) entre la
carga de documentos y el contrato: al confirmar los documentos, el onboarding pasa a
`TAX_PROFILE_PENDING` si el empresario aún no ha enviado la ficha. El front no conoce ese paso:
el asistente de `/commercial-onboarding` no tiene a dónde llevarlo y el registro queda trabado
justo antes del contrato.

Además, el empresario no tiene dónde consultar ni corregir su ficha después del registro, ni
dónde administrar sus **establecimientos** (sedes físicas), que la ficha resume en el inciso f)
y que VERYGANA revisa.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Empresario | `ROLE_COMMERCIAL` | Diligencia la ficha en el onboarding; la consulta, la edita (crea una versión nueva) y ve su historial en el perfil; registra y cierra sedes. Lee el compromiso de formalización en solo lectura. |
| Otros roles | `ROLE_CONSUMER`, `ROLE_ADMIN`, `ROLE_COMPLIANCE_OFFICER`, `ROLE_GAME_DESIGNER` | No entran: las rutas cuelgan de `/commercial`, que el middleware ya restringe, y la API responde 403. Las pantallas de compliance son de la entrega D. |

## Historias de usuario

- Como empresario en registro, quiero diligenciar mi ficha tributaria después de los documentos
  para poder llegar al contrato.
- Como empresario, quiero ver mi ficha con el estado de revisión de cada sección para saber qué
  debo corregir.
- Como empresario, quiero editar mi ficha sabiendo que se crea una versión nueva y que la
  anterior queda en el historial.
- Como empresario, quiero registrar mis sedes físicas y cerrar las que ya no uso, con un motivo.
- Como empresario, quiero leer el compromiso de formalización completo antes de llegar al
  contrato, sin que leerlo cuente como aceptarlo.

## Pantallas y flujo

### 1. Paso nuevo del onboarding: "Ficha tributaria"

- Vive dentro del asistente existente (`/commercial-onboarding`,
  `src/components/commercial/onboarding/OnboardingWizard.tsx`). No hay ruta nueva.
- El stepper pasa de 7 a 8 burbujas: Términos · Identificación · Diagnóstico · Plan · Documentos
  · **Ficha tributaria** · Contrato · Pago.
- Se muestra cuando el estado del onboarding dice `currentStep === 'TAX_PROFILE_PENDING'`, tanto
  al llegar desde Documentos como al recargar la página en ese paso.
- Al pulsar "Continuar" en Documentos, el asistente vuelve a leer el estado y va al paso que diga
  `currentStep`: `TAX_PROFILE_PENDING`, o `CONTRACT_PENDING` si la ficha ya existía (por ejemplo,
  tras una solicitud de cambios del contrato). Nunca supone el contrato.
- Al guardar la ficha con éxito, vuelve a leer el estado y va a `currentStep` (normalmente
  `CONTRACT_PENDING`).
- El contenido es el formulario compartido `TaxProfileForm` (abajo).

### 2. Formulario compartido de la ficha (`TaxProfileForm`)

Se usa en el paso del onboarding y en "Editar ficha" / "Completar ficha" del perfil.

- **Bloque informativo fijo arriba**, con el texto literal del contrato con la API (4.1):
  > Esta ficha recoge tu información tributaria tal como la declaras. Incluye también tus
  > actividades e ingresos fuera de VERYGANA. VERYGANA puede revisarla y pedirte soportes; esa
  > revisión no es asesoría contable o tributaria.
- Debajo, el enlace **"Leer el compromiso de formalización"**: abre un modal que pide el texto con
  contexto `TAX_PROFILE` y muestra `fullText` completo y literal, en solo lectura, **sin
  casilla ni botón de aceptar**, con la nota "Este compromiso se manifiesta al aprobar el
  contrato".
- **Ocho secciones plegables**, una por inciso, con los títulos del diccionario
  ("a) RUT", "b) Régimen y actividades", … "h) Asesoría contable"):

| Sección | Qué pide | Cómo |
|---|---|---|
| a) RUT | documento RUT y responsabilidades RUT | Selector con los documentos de tipo `RUT` vigentes del onboarding (si no hay, aviso "No tienes un RUT vigente cargado" y se envía `null`). Selección múltiple de códigos `RUT_RESPONSIBILITY`. |
| b) Régimen y actividades | régimen y actividades CIIU | Selector `REGIME`. Lista de actividades: CIIU (solo números, 4 dígitos), descripción opcional y radio "Principal". Botón "Agregar actividad"; se puede quitar una fila mientras quede al menos una. |
| c) IVA e INC | condición de IVA, condición de INC y alcance | Dos selectores y un área de texto "¿A qué productos o servicios aplica?". |
| d) Facturación y retención | obligado a facturar, método, notas; agente de retención, notas | Dos preguntas Sí/No **sin respuesta marcada al inicio**, selector `INVOICING_METHOD` y dos áreas de texto. |
| e) Ingresos o ventas | periodos de ingresos | Tabla editable: concepto, desde, hasta, monto en pesos, alcance y notas. Botón "Agregar periodo"; se puede quitar una fila mientras quede al menos una. **Sin selector de soporte en esta entrega** (ver RN-11). |
| f) Establecimientos | (no va en el envío) | "Tienes N establecimientos activos" y botón "Gestionar sedes", que abre en un modal el mismo componente de la pantalla de establecimientos. Al cerrar el modal, el número se actualiza. |
| g) Capacidad de crecimiento | capacidad actual (obligatoria), escenario y medidas | Tres áreas de texto, con la ayuda "Describe lo que puedes atender hoy. El escenario de crecimiento es solo informativo". |
| h) Asesoría | tiene asesor contable, alcance | Pregunta Sí/No sin respuesta marcada al inicio; si es Sí, área de texto del alcance. Nota fija: "Esta información no le da acceso a tu asesor a la plataforma". |

- **Selectores de catálogo:** las opciones salen del catálogo de la API, agrupado por tipo, y se
  muestran como `código — etiqueta`. Ningún código ni opción va escrito en el front. Si un tipo
  no tiene entradas, su selector queda deshabilitado con "Aún no disponible" y se envía `null`.
  Todos los códigos de catálogo son opcionales.
- **Botón de envío:** "Guardar y continuar" en el onboarding; "Enviar ficha" en el perfil. Se
  deshabilita mientras se envía.
- **Precarga:** si la API ya tiene una ficha, el formulario arranca con los datos de la versión
  vigente (montos convertidos de centavos a pesos). Si no hay ficha, arranca vacío, con una
  actividad y un periodo de ingresos en blanco.

### 3. Perfil → "Información tributaria" — `/commercial/profile/tax-info` (nueva)

- Ruta nueva bajo `/commercial`, ya protegida por prefijo para `ROLE_COMMERCIAL`: no se toca
  `src/middleware.ts`. La página (`src/app/commercial/profile/tax-info/page.tsx`) es de servidor
  y renderiza un componente de cliente (P-2).
- Se llega desde el bloque nuevo de "Mi perfil" (sección 5).
- **Sin ficha** (la API responde 204): mensaje "Aún no has diligenciado tu ficha tributaria" y
  botón "Completar ficha", que muestra el `TaxProfileForm` vacío. Si la API rechaza el envío
  porque falta la carga documental, se muestra su `message`.
- **Con ficha**, dos pestañas: **"Ficha actual"** e **"Historial"**.
  - Cabecera: insignia de estado (En revisión / Con observaciones / Revisada), "Versión N" y la
    fecha de la última actualización en hora de Colombia.
  - Si el estado es `OBSERVED`: banner naranja "VERYGANA dejó observaciones en tu ficha.
    Corrígelas y envía una nueva versión".
  - Vista de lectura por sección (a–h). Junto a cada una, la insignia de su revisión (Verificada /
    Observada / No aplica) o "Pendiente de revisión" si la API no trae revisión para esa sección;
    si está `OBSERVED`, la nota de la revisión destacada debajo. Los códigos de catálogo se
    muestran como `código — etiqueta` cuando el catálogo los trae, y como el código solo si ya no
    está en él. Los montos en pesos (COP); las fechas `AAAA-MM-DD` formateadas sin correrse de
    día.
  - Bloque **"Compromiso de formalización"**, solo lectura y sin casilla, según el valor que trae
    la ficha:

    | Valor | Qué se muestra |
    |---|---|
    | sin registro (`null`) | "Aún no registrado. Se manifiesta al aprobar el contrato". |
    | `MANIFESTED` | "Manifestado el {fecha} por {representante legal} · versión {versión}". |
    | `NOT_MANIFESTED` | insignia naranja "Sin manifestar — pendiente de aclaración" y "Tienes una aclaración pendiente". |
    | `EXPRESS_REFUSAL` | insignia roja "No aceptado" y "Tienes una aclaración pendiente". |
    | `TECHNICAL_INCIDENT` | insignia gris "Falla técnica — pendiente de aclaración" y "Tienes una aclaración pendiente". |

    En los tres últimos, "Tienes una aclaración pendiente" va **sin enlace** en esta entrega: la
    pantalla de solicitudes llega con la entrega C, que agrega el enlace. Siempre hay un enlace
    "Leer texto" que abre el mismo modal de solo lectura del formulario.
  - Botón **"Editar ficha"**: muestra el `TaxProfileForm` precargado. Al enviar, primero pide
    confirmación: "Se creará la versión {N+1}. La anterior queda en el historial" (Confirmar /
    Cancelar). Al guardar, vuelve a la vista de lectura con la versión nueva. "Cancelar edición"
    descarta los cambios sin enviar.
  - Pestaña **"Historial"**: lista de versiones (número y fecha de envío), de la más reciente a la
    más antigua. Al elegir una, se ve en solo lectura con el mismo formato por secciones, sin
    revisiones (son de la versión vigente) y sin botón de editar.

### 4. Perfil → "Establecimientos" — `/commercial/profile/establishments` (nueva)

- Igual que la anterior: bajo `/commercial`, página de servidor que renderiza un componente de
  cliente. El mismo componente se usa en el modal de la sección f) de la ficha.
- Lista en dos grupos: **"Activos"** y **"Cerrados"** (plegado por defecto). Cada sede muestra
  nombre, dirección, municipio y relación (Propio / Arrendado / Franquicia / Otro); las cerradas,
  además, la fecha y el motivo del cierre.
- Texto de ayuda visible: "Registra solo sedes físicas. Una página web, red social o correo no es
  un establecimiento". Junto a la lista: "¿Hay un dato errado? Cierra esta sede y registra la
  correcta".
- **"Agregar sede"**: formulario con nombre, dirección, departamento → municipio (los selectores
  de ubicación que ya existen; se envía el código DANE del municipio) y relación.
- **"Cerrar sede"** (solo en activas): modal con motivo obligatorio y botón "Cerrar sede". La sede
  pasa a "Cerrados".
- No hay editar ni eliminar.

### 5. Accesos desde "Mi perfil"

- En `/commercial/profile`, tanto en la vista Seller (`CommercialProfileSeller.tsx`) como en la
  Premium (`CommercialProfilePremium.tsx`), un bloque **"Información tributaria y sedes"** con dos
  enlaces: "Información tributaria" y "Establecimientos". El `Sidebar` no cambia.

### Estados de pantalla

**Paso "Ficha tributaria" y `TaxProfileForm`**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Indicador de carga mientras llegan, en paralelo, la ficha, el catálogo, los establecimientos y los documentos del onboarding. |
| Vacío | Sin ficha previa: formulario vacío (una actividad y un periodo en blanco). Catálogo de un tipo vacío: selector deshabilitado "Aún no disponible". Sin RUT vigente: aviso en la sección a). |
| Error (red, 5xx) | Si falla la carga inicial: "No pudimos cargar tu ficha tributaria" y "Reintentar". Si falla solo el texto del compromiso, el error queda dentro del modal y el formulario sigue usable. Si falla el envío: toast con el `message` de la API, o "No pudimos guardar tu ficha. Intenta de nuevo" si no hay; lo escrito se conserva. |
| Validación (400) | Toast con el `message` de la API y, si trae `details`, cada error bajo su campo; la sección plegada que tenga un error se abre. |
| Sin permiso (401, 403, rol equivocado) | 401 lo resuelve el interceptor (renueva o manda a `/login`). Rol equivocado: el middleware lo saca de `/commercial`. 403 de la API: "No tienes permiso para ver esta información". |
| Éxito | Onboarding: pasa al paso que diga el estado. Perfil: toast "Ficha enviada. Versión N" y vista de lectura. |

**"Información tributaria"**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto de la cabecera y las secciones. |
| Vacío | 204: invitación "Completar ficha". Historial con una sola versión: la lista con esa versión. |
| Error (red, 5xx) | "No pudimos cargar tu ficha tributaria" y "Reintentar". El error del historial o de una versión se muestra solo en esa pestaña. |
| Sin permiso | Igual que el formulario. |
| Éxito | Cabecera, secciones con su revisión, bloque del compromiso, pestañas. |

**"Establecimientos"**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto de la lista. |
| Vacío | "Aún no tienes sedes registradas" y el botón "Agregar sede". Sin cerradas: el grupo "Cerrados" no aparece. |
| Error (red, 5xx) | Lista: "No pudimos cargar tus sedes" y "Reintentar". Al agregar o cerrar: toast con el `message` de la API; el modal sigue abierto con lo escrito. |
| Sin permiso | Igual que el formulario. |
| Éxito | Agregar: toast "Sede registrada" y aparece en "Activos". Cerrar: toast "Sede cerrada" y pasa a "Cerrados". |

## Contrato con la API

Todos con `ROLE_COMMERCIAL` (`@PreAuthorize("hasRole('COMMERCIAL')")`). Los DTO son los de
`backend-contract.md`, sección 1, copiados tal cual.

| Endpoint | Método | Entrada | Salida | Errores y qué ve el usuario |
|----------|--------|---------|--------|-----------------------------|
| `/commercials/tax-profile` | GET | — | `TaxProfileResponse`, o **204 sin cuerpo** si no hay ficha | 204 = "no hay ficha" (no es error). |
| `/commercials/tax-profile` | PUT | `TaxProfileSubmitRequest` | `TaxProfileResponse` | 400 con `message` (p. ej. "Complete la carga documental antes de diligenciar la ficha tributaria.", "Marque exactamente una actividad económica como principal.", "Informe solo periodos ya cerrados…", solapamiento) y `details` por campo. |
| `/commercials/tax-profile/versions` | GET | — | `VersionSummary[]` | Error en la pestaña Historial. |
| `/commercials/tax-profile/versions/{n}` | GET | — | `TaxProfileVersionDetail` | 404: "No encontramos esa versión". |
| `/commercials/tax-profile/catalog` | GET | — | `CatalogEntry[]` (vigentes) | Si falla, la carga inicial del formulario falla con "Reintentar". |
| `/commercials/establishments` | GET | — | `Establishment[]` (activos y cerrados) | — |
| `/commercials/establishments` | POST | `EstablishmentRequest` | `Establishment` | 400: canal digital ("Indique la dirección física de la sede…") o dirección repetida en el municipio; se muestra el `message`. |
| `/commercials/establishments/{id}/close` | POST | `CloseEstablishmentRequest` | `Establishment` | 400 "Este establecimiento ya está cerrado." |
| `/commercials/declarations/FORMALIZATION_COMMITMENT?context=TAX_PROFILE` | GET | — | `DeclarationView` | Error dentro del modal de lectura. |
| `/commercials/onboarding/status` (existe) | GET | — | `OnboardingStatus` | Ya manejado por el asistente. |
| `/commercials/onboarding/documents` (existe) | GET | — | documentos del onboarding | Para el selector de RUT. |

- La API mueve el onboarding de `TAX_PROFILE_PENDING` a `CONTRACT_PENDING` al recibir la ficha, y
  de `DOCUMENTS_PENDING` a `TAX_PROFILE_PENDING` o `CONTRACT_PENDING` al confirmar documentos
  (`CommercialDocumentServiceImpl.continueToContract`). El front solo lee `currentStep`.
- Dinero en centavos (`amountCents`); fechas sin hora en `AAAA-MM-DD`; fechas con hora en ISO.
- Los 401, 402, 503 y el 400 de cambio de plan los trata el interceptor global.
- No hay dependencias de la API pendientes para esta entrega: todos los endpoints existen.

## Reglas de negocio

- **RN-1 (L-2, L-3):** el compromiso de formalización aparece en esta entrega solo para leerse:
  texto completo y literal, sin casilla, sin botón de aceptar, con la nota "Este compromiso se
  manifiesta al aprobar el contrato". Abrir o cerrar el modal no envía aceptación ni decisión a
  la API. El texto se pide solo al abrir el modal (la API registra esa consulta como "puesto a
  disposición") y se conserva 30 minutos en caché para no repetir la consulta en cada apertura.
- **RN-2 (L-5):** sin registro, `NOT_MANIFESTED`, `EXPRESS_REFUSAL` y `TECHNICAL_INCIDENT` se
  muestran con textos e insignias distintos (tabla de la sección 3). Una falla técnica nunca se
  presenta como negativa.
- **RN-3 (L-6):** ningún texto dice ni sugiere que la ficha o el compromiso cambian la condición
  frente al IVA, el régimen, la vocación, la comisión ni el plan.
- **RN-4 (L-14):** ningún código de catálogo, tarifa, umbral ni condición tributaria va escrito en
  el front: las opciones salen del catálogo de la API.
- **RN-5 (L-15):** la sección h) muestra siempre "Esta información no le da acceso a tu asesor a
  la plataforma".
- **RN-6 · Actividades:** al menos una; exactamente una marcada como principal; CIIU de
  exactamente 4 dígitos (`/^\d{4}$/`); sin CIIU repetidos; descripción de máximo 300 caracteres.
- **RN-7 · Preguntas Sí/No:** "obligado a facturar", "agente de retención" y "tiene asesor
  contable" no tienen respuesta por defecto: el usuario elige; sin elegir, "Selecciona una
  opción" y no se envía. Si "tiene asesor contable" es No, el alcance no se envía.
- **RN-8 · Textos:** capacidad actual obligatoria (sin solo espacios), máximo 2000; escenario y
  medidas, 2000; alcance de IVA/INC, notas de facturación, notas de retención y alcance de
  asesoría, 1000; notas de cada periodo, 500. Errores como "Máximo N caracteres".
- **RN-9 · Ingresos:** al menos un periodo; fin ≥ inicio ("El fin del periodo no puede ser
  anterior al inicio"); fin ≤ hoy en hora de Colombia ("Informa solo periodos ya cerrados");
  monto ≥ 0 en pesos, con coma o punto decimal, sin separador de miles y **máximo 2 decimales**
  ("Máximo 2 decimales"); bajo el campo se ve el valor formateado en COP; moneda `COP`. Se envía
  en centavos: pesos × 100, redondeado a entero (la utilidad de conversión redondea; el
  formulario nunca le pasa más de 2 decimales).
- **RN-10 · Solapamiento (L-8):** dos periodos del mismo concepto cuyas fechas se cruzan chocan si
  uno es "Total que ya incluye VERYGANA" y el otro cualquier alcance, o si los dos tienen el mismo
  alcance. Las filas que chocan se marcan con "Si un total ya incluye las ventas de VERYGANA, no
  las informes otra vez por separado" y el formulario no se envía mientras haya choques (la API
  lo rechazaría igual). Periodos que no se cruzan, o de distinto concepto, no chocan.
- **RN-11 · Soporte de ingresos:** en esta entrega no hay selector de documento de soporte por
  periodo. Un periodo nuevo se envía con `supportDocumentId: null`; al editar una versión cuyo
  periodo ya traía soporte, se conserva el valor sin mostrarlo para editar. El selector llega con
  la entrega C (expediente).
- **RN-12 · RUT:** el selector de la sección a) solo ofrece documentos de tipo `RUT` vigentes del
  onboarding; las responsabilidades RUT no se repiten.
- **RN-12b · Precarga de valores no vigentes:** al editar, un código de catálogo que ya no está
  en el catálogo vigente, o un RUT que ya no es vigente, arranca vacío con la ayuda "El código
  {código} ya no está vigente. Elige otro o deja el campo vacío" (o "El RUT de la versión
  anterior ya no está vigente"), porque la API lo rechazaría.
- **RN-13 · Versiones:** cada envío crea una versión nueva; desde el perfil se confirma antes con
  "Se creará la versión {N+1}. La anterior queda en el historial". Las versiones anteriores solo
  se leen.
- **RN-14 · Establecimientos (L-9):** nombre obligatorio, máximo 150; dirección obligatoria,
  máximo 300, y no puede contener `http`, `www.` ni `@` (sin distinguir mayúsculas): "Indica la
  dirección física de la sede. Una página web, correo o red social no es un establecimiento";
  municipio y relación obligatorios. Motivo de cierre obligatorio, máximo 300. No se editan ni se
  borran.
- **RN-15 · Errores de la API:** ante un rechazo se muestra siempre el `message` de la API; los
  `details` se ponen bajo su campo, convirtiendo la ruta del DTO al nombre del campo del
  formulario (`activities[0].ciiuCode` → `activities.0.ciiuCode`). Una clave sin campo visible se
  suma al toast.
- **RN-16 · Doble envío:** todo botón que envía se deshabilita mientras la petición está en curso.
- **RN-17 · Datos frescos:** enviar la ficha refresca la ficha, el historial y el estado del
  onboarding; crear o cerrar una sede refresca la lista de sedes y la ficha (por el número de
  activas).

## Criterios de aceptación

**Onboarding**

- **CA-1:** Dado un empresario con el onboarding en `TAX_PROFILE_PENDING`, cuando abre o recarga
  `/commercial-onboarding`, entonces ve el paso "Ficha tributaria" activo en la sexta burbuja del
  stepper, entre "Documentos" y "Contrato", y las anteriores completas.
- **CA-2:** Dado un empresario en Documentos con todo cargado, cuando pulsa "Continuar", entonces
  el asistente lee el estado y muestra "Ficha tributaria" si la API responde
  `TAX_PROFILE_PENDING`, o el paso del contrato si responde `CONTRACT_PENDING`.
- **CA-3:** Dado el paso "Ficha tributaria" con una ficha válida, cuando pulsa "Guardar y
  continuar", entonces se envía la ficha, se vuelve a leer el estado y el asistente muestra el
  paso que diga `currentStep`; mientras se envía, el botón está deshabilitado.
- **CA-4:** Dado que la API ya tiene una ficha del empresario, cuando se abre el formulario
  (onboarding o "Editar ficha"), entonces arranca con los datos de la versión vigente y los
  montos en pesos.

**Formulario**

- **CA-5:** Dado el formulario, cuando el usuario intenta enviar sin actividades, con cero o dos
  principales, con un CIIU que no tiene 4 dígitos o con CIIU repetidos, entonces no se envía nada
  y ve el error bajo el campo correspondiente.
- **CA-6:** Dado un formulario recién abierto sin ficha previa, entonces ninguna de las tres
  preguntas Sí/No tiene respuesta marcada; cuando intenta enviar sin responderlas, ve
  "Selecciona una opción" en cada una y no se envía.
- **CA-7:** Dado un periodo con fin anterior al inicio, fin posterior a hoy (hora de Colombia) o
  monto negativo, cuando intenta enviar, entonces ve el error de la RN-9 en esa fila y no se
  envía; sin ningún periodo, tampoco se envía.
- **CA-8:** Dado dos periodos de "Ventas" que se cruzan, uno con "Total que ya incluye VERYGANA"
  y otro con "Solo operaciones fuera de VERYGANA", entonces ambas filas se marcan con el texto de
  la RN-10 y el formulario no se envía; si los periodos no se cruzan, no se marcan.
- **CA-9:** Dado un monto de `1234,56` pesos, cuando se envía, entonces la API recibe
  `amountCents: 123456`; dado `1234,567`, el campo muestra "Máximo 2 decimales" y no se envía.
  La utilidad de conversión, probada aparte, redondea al centavo más cercano (`0,005` → `1`).
- **CA-10:** Dado un catálogo sin entradas de un tipo, entonces su selector está deshabilitado con
  "Aún no disponible" y el envío lleva ese código en `null` sin error; dado un tipo con entradas,
  las opciones son exactamente las del catálogo, como `código — etiqueta`.
- **CA-11:** Dado que el empresario no tiene un RUT vigente en sus documentos del onboarding,
  entonces la sección a) muestra "No tienes un RUT vigente cargado" y el envío lleva
  `rutDocumentId: null`.
- **CA-12:** Dado el formulario, cuando pulsa "Leer el compromiso de formalización", entonces se
  abre un modal con el texto completo que devuelve la API, la nota "Este compromiso se manifiesta
  al aprobar el contrato" y solo un botón para cerrar; no hay casilla ni botón de aceptar. Si la
  API falla, el modal dice "No pudimos cargar el texto" y el formulario sigue usable.
- **CA-13:** Dado la sección f), entonces muestra "Tienes N establecimientos activos"; cuando el
  usuario registra o cierra una sede desde "Gestionar sedes" y cierra el modal, el número se
  actualiza.
- **CA-14:** Dado la sección h), entonces siempre se ve "Esta información no le da acceso a tu
  asesor a la plataforma"; el alcance solo aparece si respondió Sí.
- **CA-15:** Dado un envío que la API rechaza con 400, `message` y
  `details: { "activities[0].ciiuCode": "…" }`, entonces el usuario ve el `message` en un toast y
  el texto del detalle bajo el CIIU de la primera actividad, con su sección abierta; lo escrito se
  conserva.

**Información tributaria**

- **CA-16:** Dado un empresario sin ficha (204), cuando abre `/commercial/profile/tax-info`,
  entonces ve "Aún no has diligenciado tu ficha tributaria" y "Completar ficha"; al enviarla con
  éxito, ve la vista de lectura con "Versión 1".
- **CA-17:** Dado una ficha `OBSERVED` con la sección e) observada y una nota, entonces ve la
  insignia "Con observaciones", el banner naranja de la sección 3, la insignia "Observada" y la
  nota en la sección e), y "Pendiente de revisión" en las secciones sin revisión.
- **CA-18:** Dado cada valor del compromiso (sin registro, `MANIFESTED`, `NOT_MANIFESTED`,
  `EXPRESS_REFUSAL`, `TECHNICAL_INCIDENT`), entonces el bloque muestra el texto e insignia de la
  tabla de la sección 3, distintos entre sí, y en ningún caso una casilla.
- **CA-19:** Dado una ficha en la versión 3, cuando pulsa "Editar ficha" y envía, entonces primero
  ve "Se creará la versión 4. La anterior queda en el historial"; al confirmar, se envía y la
  vista muestra "Versión 4"; al cancelar la confirmación, no se envía nada.
- **CA-20:** Dado la pestaña "Historial", entonces lista las versiones de la más reciente a la más
  antigua con su fecha; al elegir una, se ve en solo lectura y sin botón de editar.
- **CA-21:** Dado una fecha `2026-10-01` en un periodo, entonces se muestra como 1 de octubre de
  2026 (no 30 de septiembre); y la fecha de actualización se muestra en hora de Colombia.

**Establecimientos**

- **CA-22:** Dado sedes activas y cerradas, cuando abre `/commercial/profile/establishments`,
  entonces ve "Activos" con nombre, dirección, municipio y relación, y "Cerrados" plegado con la
  fecha y el motivo; no hay botones de editar ni eliminar, y se ve "Cierra esta sede y registra la
  correcta".
- **CA-23:** Dado el formulario "Agregar sede", cuando la dirección contiene `http`, `www.` o `@`
  (en cualquier combinación de mayúsculas), entonces ve el error de la RN-14 y no se envía; con
  nombre, dirección, departamento, municipio y relación válidos, se registra y aparece en
  "Activos".
- **CA-24:** Dado una sede activa, cuando pulsa "Cerrar sede" sin motivo, entonces no se envía;
  con motivo, la sede pasa a "Cerrados" con ese motivo.
- **CA-25:** Dado que la API rechaza una sede con 400 (dirección repetida en el municipio),
  entonces se muestra su `message` y el modal sigue abierto con lo escrito.

**Transversales**

- **CA-26:** Dado "Mi perfil" en la vista Seller o en la Premium, entonces hay un bloque
  "Información tributaria y sedes" con enlaces a las dos pantallas nuevas.
- **CA-27:** Las dos `page.tsx` nuevas no empiezan por `'use client'`; `routeProtection.test.ts` y
  `routeInventory.test.ts` siguen en verde sin cambiar `src/middleware.ts`.
- **CA-28:** Ni el NIT, ni las direcciones, ni los montos, ni los textos de la ficha aparecen en
  `console.*`, en la URL ni en `localStorage`/`sessionStorage`.
- **CA-29:** Ningún texto de las pantallas de esta entrega dice que la ficha o el compromiso
  cambian el IVA, el régimen, la vocación, la comisión o el plan (RN-3), y ninguna opción de
  catálogo está escrita en el código (RN-4).
- **CA-30:** `npm run lint:ci`, `npm test`, `npm run build`, `npx tsc --noEmit` y
  `npm run audit:ci` en verde, sin dependencias nuevas y sin subir `.lint-max-warnings`.

## Base compartida que deja esta entrega (para B, C y D)

- Los **cuatro archivos de tipos** de `backend-contract.md` (sección 1) completos, en las rutas de
  `instrucciones.md` 3.1: `src/types/commercial/TaxProfile.types.ts`, `Expediente.types.ts`,
  `Declaration.types.ts` y `src/types/compliance/InformationRequest.types.ts`.
- `'TAX_PROFILE_PENDING'` en `OnboardingStep`, entre `DOCUMENTS_PENDING` y `CONTRACT_PENDING`.
- El **diccionario de textos y colores** (`src/lib/labels/taxCompliance.ts`) con toda la tabla de
  la sección 3 del contrato, y una insignia de estado que lo use.
- Servicios y hooks **solo** de lo que consume esta entrega: ficha, versiones, catálogo del
  empresario, establecimientos y `getDeclaration`. Los de expediente, solicitudes y compliance, y
  `useExpedienteUpload`, nacen en su entrega junto con su pantalla.
- Utilidades puras con prueba: pesos ↔ centavos y formato COP, solapamiento de ingresos, esquemas
  de ficha y de sede, conversión de rutas de `details`, y el 204 → `null` del servicio.
- `PagedResponse` no se toca en esta entrega (ningún endpoint de A es paginado).

## Fuera de alcance

- Compromiso en la aprobación del contrato, `approveContract` con cuerpo e `Idempotency-Key`
  (entrega B).
- Expediente documental, `useExpedienteUpload`, selector de soporte de ingresos, solicitudes de
  información y el enlace "Tienes una aclaración pendiente" (entrega C).
- Todas las pantallas y servicios de compliance (entrega D).
- Pruebas de navegador (Playwright) de estas pantallas: lo visual se comprueba a mano y se anota
  en el PR (excepción de P-17). El área `/commercial` no está hoy en el alcance de `e2e/`.
- Cambios en `src/middleware.ts` o en el `Sidebar`.
- Documentación en Notion: se ofrece al cierre.

## Requisitos no funcionales

- **Responsive:** las tres vistas funcionan desde 360 px de ancho. En móvil, las tablas editables
  de actividades y periodos pasan a tarjetas apiladas, y el formulario no tiene scroll
  horizontal.
- **Accesibilidad básica:** cada campo con su etiqueta; los errores asociados al campo; las
  preguntas Sí/No como grupos de radio con nombre; los modales se cierran con Escape y devuelven
  el foco; las secciones plegables son botones con estado expandido.
- **Volumen:** pocas actividades, periodos y sedes por empresario; sin paginación.
- **PII:** NIT, direcciones, montos de ingresos y textos de la ficha son datos del empresario: no
  van a `console.*`, a la URL ni al almacenamiento del navegador; los errores de axios no se
  imprimen completos (P-16). Solo el `publicId` (UUID) puede ir en una ruta, y aquí no hace falta.
- **Formularios:** react-hook-form con esquema zod (P-11). **Datos:** TanStack Query con una
  fábrica de claves por dominio (P-10).

## Preguntas abiertas

Ninguna bloquea el diseño. Decisiones ya tomadas con el usuario (2026-10-27):

- [x] Una spec por entrega; esta es la A.
- [x] Base compartida: todos los tipos; servicios y hooks solo de A.
- [x] Accesos: bloque en "Mi perfil" (Seller y Premium), sin tocar el `Sidebar`.
- [x] Soporte de ingresos: fuera de A (RN-11).
- [x] Sin Playwright en A.
- [ ] (Para C) Límite de tamaño de archivo del expediente: se asume el del onboarding (10 MB).
