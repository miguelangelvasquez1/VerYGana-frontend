# 017 · Compliance: cola y revisión de fichas, revisión de documentos y caso del empresario (entrega D, parte 1)

- **Estado:** Aprobada
- **Fecha:** 2026-11-02
- **Ticket:** —
- **Origen:** API · `docs/frontend/instrucciones-frontend-caracterizacion.md` (copiado en
  `specs/014-tax-profile-and-compliance-case/backend-contract.md`, secciones 0.2, 3, 5.1 a 5.4 y 6) ·
  numerales 1.7, 4.7 y 4.8 del contrato. Controllers y servicios del repositorio de la API:
  `controllers/tax/ComplianceTaxProfileController.java` (`/compliance/tax-profiles`),
  `controllers/compliance/ComplianceExpedienteController.java`
  (`/compliance/commercials/{id}/documents`, `/compliance/commercial-documents/{id}/review`),
  `controllers/declarations/DeclarationController.java` (historial del compromiso),
  `controllers/inforequests/ComplianceInformationRequestController.java` (solo las lecturas de
  requerimientos, hallazgos e incidencias), `services/tax/TaxProfileServiceImpl.java`
  (`getForCompliance`, `getVersionForCompliance`, `reviewSection`) y
  `services/commercial/CommercialExpedienteDocumentServiceImpl.java` (`review`).

> Es la primera mitad de la entrega **D** (ver `specs/014-tax-profile-and-compliance-case/instrucciones.md`,
> sección 1, y las fases 7, 8 y 9). La segunda mitad (fases 10 y 11: crear y revisar requerimientos,
> hallazgos, incidencias, alertas, reglas de alerta y catálogo tributario) va en la spec **018**.
> Depende de A, B y C (specs 014, 015 y 016): reutiliza sus tipos (`src/types/commercial/TaxProfile.types.ts`,
> `Expediente.types.ts`, `Declaration.types.ts`, `src/types/compliance/InformationRequest.types.ts`), el
> diccionario `src/lib/labels/taxCompliance.ts`, el `Dialog` y el `StatusBadge` compartidos, la agrupación
> del expediente y la apertura de "Ver" de la 016 (`src/lib/expediente/`). Las rutas van en inglés (P-18)
> y no siguen las rutas en español que sugiere el backend.

## Problema

La API ya guarda la ficha tributaria que envía el empresario, su expediente documental y el historial de
su compromiso de formalización, y permite a compliance revisarlos. Pero el oficial de cumplimiento no tiene
ninguna pantalla para hacerlo:

- no ve qué fichas están por revisar ni puede abrir una;
- no puede marcar cada sección de la ficha como verificada, observada o "no aplica". Mientras no la observe,
  el empresario no sabe qué aclarar (la 014 ya le muestra las observaciones, pero nadie las puede crear);
- no puede comparar la versión actual de la ficha con una anterior para ver qué cambió;
- no puede revisar los documentos del expediente: aceptar, observar o rechazar, registrar el titular y la
  vigencia. Sin esa revisión los documentos quedan "sin revisar" para siempre;
- no tiene un lugar que reúna todo lo de un empresario (ficha, documentos, compromiso, requerimientos,
  hallazgos e incidencias).

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Oficial de cumplimiento | `ROLE_COMPLIANCE_OFFICER` | Ve la cola de fichas, revisa secciones, compara versiones, revisa documentos y consulta el caso del empresario con sus seis pestañas. |
| Administrador | `ROLE_ADMIN` | Nada: la API responde 403 a todo `/compliance/**` de este contrato, y el middleware ya no lo deja entrar a `/compliance`. |
| Empresario | `ROLE_COMMERCIAL` | Nada nuevo aquí. Ve el resultado de estas revisiones en las pantallas de la 014 y la 016. |

## Historias de usuario

- Como oficial de cumplimiento, quiero ver las fichas tributarias pendientes de revisión, para atenderlas en orden.
- Como oficial de cumplimiento, quiero revisar cada sección de la ficha y dejar una observación cuando algo
  no cuadra, para que el empresario sepa exactamente qué aclarar.
- Como oficial de cumplimiento, quiero comparar la ficha actual con una versión anterior, para ver qué
  cambió el empresario después de una observación.
- Como oficial de cumplimiento, quiero revisar cada documento vigente del expediente y registrar su titular
  y su vigencia, para dejar constancia de que el documento corresponde al empresario.
- Como oficial de cumplimiento, quiero ver en una sola página todo lo de un empresario, para entender su
  caso antes de pedirle información o registrar un hallazgo (estas dos acciones llegan con la 018).

## Pantallas y flujo

Todas las rutas son nuevas y cuelgan de `/compliance`, que el middleware ya protege por prefijo con
`ROLE_COMPLIANCE_OFFICER` (P-4). No hace falta tocar el `matcher`: `routeProtection.test.ts` las clasifica
solas por el prefijo. Son páginas de servidor que delegan lo interactivo en componentes de cliente (P-2), y
leen `params` y `searchParams` con `await` (P-6).

1. **Menú de compliance** (`ComplianceLayout.tsx`, `NAV`): se agrega "Fichas tributarias" con un ícono de
   `lucide-react`. Las otras cuatro entradas que pide el backend ("Requerimientos", "Alertas", "Catálogo
   tributario" y "Reglas de alerta") llegan con la 018, junto con sus pantallas.
2. **`/compliance/tax-profiles`** (cola de fichas, sección 5.1):
   - Tabla paginada con empresa, estado (insignia), versión y fecha de la última actualización.
   - Filtro por estado: "Enviada" (`SUBMITTED`, por defecto), "Observada" (`OBSERVED`), "Revisada"
     (`REVIEWED`) y "Todas" (sin filtro).
   - El estado y la página van en la URL (`?status=`, `?page=`), así que un enlace o el botón "atrás"
     conservan la vista. Ningún dato personal en la URL.
   - Al hacer clic en una fila se abre la revisión de esa ficha (punto 3).
3. **`/compliance/tax-profiles/[commercialPublicId]`** (revisión de la ficha, sección 5.2):
   - **Cabecera:** empresa, NIT, estado de la ficha, versión vigente y vocación empresarial
     (`commercialActivityType`) con la nota fija "Solo para contrastar: la ficha no modifica la vocación".
     Botón "Ver caso del empresario" (punto 5).
   - **Por cada una de las ocho secciones (a a h)**, en dos columnas en escritorio y una sola en móvil:
     - a la izquierda, lo que declaró el empresario en la versión vigente. En a), el enlace "Ver RUT" que
       abre el documento con la misma lógica de "Ver" de la 016 (URL de menos de 5 minutos), resuelto con
       la lista de documentos del empresario. En e), la tabla de ingresos con su concepto, periodo, valor
       en pesos y alcance. En f), el número de sedes declarado y el historial de establecimientos
       (activos y cerrados, con fecha y motivo de cierre);
     - a la derecha, el último resultado de revisión de la sección (o "Pendiente de revisión"), su nota y
       fecha, y los botones "Verificar", "Observar" y "No aplica".
   - "Observar" pide una nota obligatoria en un diálogo antes de enviar. "Verificar" y "No aplica" se
     envían con una nota opcional desde el mismo diálogo.
   - Tras revisar, la pantalla se actualiza con la respuesta de la API, que trae el estado general de la
     ficha recalculado (por ejemplo, pasa a "Con observaciones" en cuanto una sección se observa, y a "Revisada"
     cuando las ocho tienen revisión y ninguna está observada).
   - **Comparar con versión…:** un selector con las versiones anteriores (número y fecha de envío). Al
     elegir una, se muestra lado a lado la versión elegida y la vigente, sección por sección, con los
     campos que cambian resaltados. Solo se revisa la versión vigente: la vista de comparación no tiene
     botones de revisión. Si la ficha tiene una sola versión, el selector no aparece.
4. **Revisión de documentos** (sección 5.3), dentro de la pestaña "Documentos" del caso (punto 5):
   - La lista del expediente del empresario agrupada como en la 016 (vigente arriba e historial debajo por
     tipo), con insignias de revisión y de vencimiento, titular, fechas de expedición y de vencimiento, y
     notas de la última revisión. "Ver" abre el documento igual que en la 016.
   - En cada documento **vigente** hay un botón "Revisar" que abre un diálogo con:
     - **Resultado:** Aceptar, Observar o Rechazar (obligatorio).
     - **NIT o cédula del titular:** obligatorio al aceptar RUT, Cámara de Comercio, certificación bancaria
       o cédula del representante; opcional en los demás casos. Ayuda: "Escríbelo como figura en el
       documento; se compara con el empresario". Máximo 30 caracteres.
     - **Fecha de expedición** (opcional).
     - **Casilla "El documento tiene vigencia comprobable"**: solo si se marca aparece y se envía la
       **fecha de vencimiento**, que es obligatoria entonces y no puede ser anterior a la de expedición.
     - **Notas:** obligatorias al observar o rechazar; máximo 1000 caracteres.
   - Los documentos del historial (reemplazados) no tienen "Revisar".
5. **`/compliance/commercials/[commercialPublicId]`** (caso del empresario, sección 5.4):
   - Cabecera con la empresa y el NIT (los da la ficha; si el empresario no tiene ficha, solo
     "Empresario" y sin NIT), y seis pestañas. La pestaña activa va en `?tab=` (`tax-profile`,
     `documents`, `commitment`, `requests`, `findings`, `incidents`; por defecto `tax-profile`).
   - **Ficha tributaria:** resumen (estado, versión vigente, fecha, cuántas secciones están verificadas, en "no aplica",
     observadas y pendientes) y el botón "Abrir revisión de la ficha" (punto 3). Si la API responde 404,
     "El empresario todavía no ha enviado la ficha tributaria".
   - **Documentos:** la vista del punto 4.
   - **Compromiso:** línea de tiempo del compromiso de formalización, de la más reciente a la más
     antigua: estado (con el texto del diccionario), "Contrato v{contractVersion}", fecha, representante
     legal que actuó (o "Sistema" si no hay) y el detalle.
   - **Requerimientos:** lista de solo lectura de los requerimientos del empresario, con tipo, estado,
     emitido por ("Sistema" o "Compliance"), fecha de emisión y vencimiento, de la más reciente a la más
     antigua y paginada. El detalle y el botón "Nuevo requerimiento" llegan con la 018.
   - **Hallazgos:** historial de solo lectura (fecha, hecho observado, clasificación, gravedad, si es
     subsanable, medida y estado de cuenta aplicado si lo hubo). "Registrar hallazgo" llega con la 018.
   - **Incidencias:** historial de solo lectura (fecha, contexto, descripción, si la reportó el sistema).
     "Registrar incidencia" llega con la 018.
   - Se llega con el botón "Ver caso del empresario" de la revisión de la ficha, a la que se llega desde
     la cola. Con la 018 se suma el acceso desde la cola de requerimientos y las alertas. No
     se crea un listado de comerciales (decisión del 2026-11-02).

### Estados de pantalla

**Cola de fichas**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto de la tabla con el filtro ya visible. |
| Vacío | "No hay fichas {en este estado}." con el filtro activo; con "Todas", "Todavía no hay fichas tributarias enviadas." |
| Error (red, 5xx) | "No pudimos cargar las fichas tributarias." y botón "Reintentar". |
| Sin permiso | 401 lo resuelve el interceptor (sesión). 403: "No tienes permiso para ver esta sección." |
| Éxito | La tabla y la paginación ("Página N de M", anterior y siguiente). |

**Revisión de la ficha**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto de la cabecera y de las secciones. |
| Vacío / 404 | "El empresario todavía no ha enviado la ficha tributaria." con enlace a la cola. Un `commercialPublicId` que no es UUID muestra lo mismo sin llamar a la API. |
| Error (red, 5xx) | "No pudimos cargar la ficha tributaria." y "Reintentar". |
| Sin permiso | Igual que la cola. |
| Enviando una revisión | El botón pulsado queda deshabilitado con indicador; los demás botones de esa sección también. |
| Éxito | Ficha, revisiones por sección y comparador. Tras revisar, aviso breve "Revisión guardada" y la sección actualizada. |
| Error al revisar | El diálogo no se cierra y muestra el mensaje de la API (por ejemplo, "Indique la observación para que el empresario pueda aclararla."); con red caída, "No pudimos guardar la revisión. Intenta de nuevo." |
| Error al cargar una versión anterior | Bajo el selector: "No pudimos cargar la versión N." con "Reintentar"; la ficha vigente sigue visible. |

**Caso del empresario** (cada pestaña carga sus datos por separado; un error en una no tumba las demás)

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto dentro de la pestaña activa. |
| Vacío | Ficha: "El empresario todavía no ha enviado la ficha tributaria." · Documentos: "El empresario no tiene documentos en su expediente." · Compromiso: "No hay manifestaciones registradas." · Requerimientos: "No hay requerimientos para este empresario." · Hallazgos: "No hay hallazgos registrados." · Incidencias: "No hay incidencias registradas." |
| Error (red, 5xx) | "No pudimos cargar {la pestaña}." y "Reintentar", solo en esa pestaña. |
| Sin permiso | Igual que la cola. |
| Empresario inexistente | Si la API responde 404 o 400 en las lecturas, o el `commercialPublicId` no es UUID (sin llamar a la API), "No encontramos este empresario." en la pestaña. No se muestra el mensaje de la API: llega en inglés y con el UUID. |
| Éxito | La pestaña con sus datos. |

**Diálogo "Revisar documento"**

| Estado | Qué se muestra |
|--------|----------------|
| Inválido | Mensajes bajo cada campo al intentar enviar (ver RN-5); el botón "Guardar revisión" no llama a la API. |
| Enviando | "Guardar revisión" deshabilitado con indicador; el diálogo no se cierra con Escape, el fondo ni la X. |
| Éxito | Se cierra, aviso "Revisión guardada" y la lista se actualiza. |
| Error 400 | El diálogo sigue abierto con lo escrito y muestra el mensaje de la API tal cual, por ejemplo "El titular del documento no corresponde al empresario. Márquelo como OBSERVED o REJECTED." (ver RN-6). |
| Error de red / 5xx | "No pudimos guardar la revisión. Intenta de nuevo."; el diálogo sigue abierto. |

## Contrato con la API

Todo con `ROLE_COMPLIANCE_OFFICER` (`@PreAuthorize` en cada controller). Los tipos ya existen en el front
desde la 014; donde este documento y `backend-contract.md` discrepen, manda el controller.

| Endpoint | Método | Entrada | Salida | Errores y qué ve el usuario |
|----------|--------|---------|--------|-----------------------------|
| `/compliance/tax-profiles?status=&page=&size=` | GET | `status` opcional (`SUBMITTED`, `OBSERVED`, `REVIEWED`); `page` desde 0; `size` 20 por defecto; orden `updatedAt` descendente | `PagedResponse<TaxProfileSummary>` (`data`, `meta.page`, `meta.totalPages`, `meta.hasNext`, `meta.hasPrevious`, …) | Red/5xx: error de la cola. |
| `/compliance/tax-profiles/{commercialPublicId}` | GET | UUID | `ComplianceTaxProfileResponse` | 404 "El empresario todavía no ha enviado la ficha tributaria." → vista vacía. |
| `/compliance/tax-profiles/{commercialPublicId}/versions/{n}` | GET | UUID, número de versión | `TaxProfileVersionDetail` | 404 "Versión N de la ficha no encontrada." → error bajo el selector. |
| `/compliance/tax-profiles/{commercialPublicId}/sections/{section}/review` | POST | `SectionReviewRequest` (`result`: `VERIFIED`, `OBSERVED` o `NOT_APPLICABLE`; `notes` obligatorio con `OBSERVED`) | `ComplianceTaxProfileResponse` con el estado recalculado | 400 "Indique la observación…" → en el diálogo. Solo revisa la versión vigente. |
| `/compliance/commercials/{commercialPublicId}/documents` | GET | UUID | `ExpedienteDocument[]` (vigentes e historial, con `downloadUrl` de 5 minutos) | Empresario inexistente: 404 o 400 → "No encontramos este empresario.". |
| `/compliance/commercial-documents/{documentId}/review` | POST | `DocumentReviewRequest` (`result`, `holderIdentification` ≤ 30, `issuedAt`, `expiresAt`, `notes` ≤ 1000) | `ExpedienteDocument` | 400 con mensaje (ver RN-6). |
| `/compliance/commercials/{commercialPublicId}/declarations/FORMALIZATION_COMMITMENT` | GET | UUID | `Manifestation[]` | Red/5xx: error de la pestaña. |
| `/compliance/information-requests?commercialPublicId=&page=&size=` | GET | UUID; sin `status` | `PagedResponse<RequestView>`, orden `issuedAt` descendente | Red/5xx: error de la pestaña. |
| `/compliance/commercials/{commercialPublicId}/findings` | GET | UUID | `FindingView[]` | Red/5xx: error de la pestaña. |
| `/compliance/commercials/{commercialPublicId}/incidents` | GET | UUID | `IncidentView[]` | Red/5xx: error de la pestaña. |
| `/compliance/tax-catalog` | GET | — | `CatalogEntry[]` (activos y retirados) | Si falla, los códigos se muestran solos, sin etiqueta, y la revisión sigue funcionando. |

- Los 401, 402, 503 y el 400 de cambio de plan los trata el interceptor global de `src/lib/api/client.ts`.
- Fechas: `ZonedDateTime` llega como texto ISO con zona; `LocalDate` como `AAAA-MM-DD` y se envía igual.
- El documento se identifica por su `id` numérico interno (así lo expone la API); el empresario, por su
  `publicId` UUID. El número de sección va en el path con el nombre del enum (`A_RUT`, …).

- **Dependencias de la API:** ninguna para esta parte. Nota (no bloquea): para un empresario inexistente la
  API responde 404 con un mensaje en inglés que incluye el UUID (o 400 en algunos casos); el front muestra
  siempre su propio texto, "No encontramos este empresario." (decisión del 2026-11-02).

## Reglas de negocio

- **RN-1 (vocación):** la vocación empresarial se muestra solo para contrastar, siempre con la nota fija.
  Ninguna acción de estas pantallas la cambia ni cambia la condición tributaria.
- **RN-2 (solo la versión vigente):** solo se revisan las secciones de la versión vigente. La comparación con
  una versión anterior es de solo lectura.
- **RN-3 (estado de la ficha):** el front no calcula el estado general: pinta el que devuelve la API tras
  cada revisión. Una sección sin revisión en la versión vigente se muestra "Pendiente de revisión".
- **RN-4 (revisión de sección):** "Observar" exige una nota no vacía (sin contar espacios). La nota se manda
  recortada; una nota vacía en "Verificar" o "No aplica" no se manda.
- **RN-5 (revisión de documento, validación en el formulario con zod):**
  - resultado obligatorio;
  - titular obligatorio (no vacío tras recortar) si el resultado es Aceptar y el tipo es RUT, Cámara de
    Comercio, certificación bancaria o cédula del representante; máximo 30 caracteres siempre;
  - si se marca "vigencia comprobable", la fecha de vencimiento es obligatoria y no puede ser anterior a la
    de expedición; si no se marca, `expiresAt` no se envía aunque se haya escrito antes;
  - notas obligatorias (no vacías tras recortar) al observar o rechazar; máximo 1000 caracteres;
  - los campos vacíos no se mandan en el cuerpo.
- **RN-6 (errores de la revisión de documento):** un 400 de la API se muestra tal cual en el diálogo. En
  particular "El titular del documento no corresponde al empresario…": el revisor debe cambiar el resultado a
  Observar o Rechazar; el front no lo hace por él. Tras un 400 "Solo se revisan documentos vigentes…" la
  lista del expediente se vuelve a leer (otro revisor o el empresario la cambió).
- **RN-7 (doble envío):** los dos formularios de revisión usan react-hook-form con `zodResolver` y evitan el
  doble envío (botón deshabilitado y guarda mientras la petición está en curso) (P-11).
- **RN-8 (cachés):** revisar una sección actualiza la ficha con la respuesta y deja desactualizada la cola de
  fichas (cambia el estado); revisar un documento deja desactualizada la lista de documentos de ese
  empresario. La cola, la ficha, cada versión y cada pestaña del caso tienen su propia clave (P-10).
- **RN-9 (datos personales, P-16):** el NIT, el titular del documento, el nombre del representante legal y la
  `downloadUrl` nunca van a `console.*`, a mensajes de error propios del front, a la URL ni a
  `localStorage`/`sessionStorage`. Las únicas URL con datos son `/compliance/tax-profiles/{UUID}` y
  `/compliance/commercials/{UUID}?tab=…`, y la cola con `?status=` y `?page=`.
- **RN-10 (solo lectura en el caso):** las pestañas Requerimientos, Hallazgos e Incidencias no tienen
  acciones en esta spec. No se muestran botones deshabilitados ni "próximamente".
- **RN-11 (medidas en hallazgos):** en el historial, la medida, la clasificación y la gravedad se muestran
  con los textos del diccionario de la 014; si un hallazgo cambió el estado de la cuenta, se muestra
  "Estado de la cuenta aplicado: {estado}".
- **RN-12 (códigos tributarios):** régimen, responsabilidades RUT, condiciones de IVA e INC y método de
  facturación se muestran como "código — etiqueta" con el catálogo tributario (incluidos los retirados, para
  versiones anteriores). Un código que no esté en el catálogo, o el catálogo caído, se muestra solo con el
  código (decisión del 2026-11-02).
- **RN-13 (versión que cambia durante la revisión):** si la respuesta de una revisión de sección trae una
  versión vigente distinta de la que el oficial estaba viendo, se muestra "La ficha cambió a la versión N
  mientras la revisabas. Revisa de nuevo las secciones." y la pantalla pasa a la versión nueva (decisión del
  2026-11-02).
- **RN-14 (textos del estado):** el estado de la ficha usa los textos del diccionario de la 014 ("En
  revisión", "Con observaciones", "Revisada"); los botones del filtro de la cola dicen "Enviada",
  "Observada", "Revisada" y "Todas" (decisión del 2026-11-02).

## Criterios de aceptación

**Menú y cola**

- **CA-1:** Dado un oficial de cumplimiento, cuando abre `/compliance`, entonces ve "Fichas tributarias" en el
  menú lateral (escritorio y móvil), y al pulsarlo llega a `/compliance/tax-profiles` con el filtro en
  "Enviada".
- **CA-2:** Dada la cola, cuando cambia el filtro a "Observada" o pasa a la página 2, entonces la URL refleja
  `?status=OBSERVED` y `?page=…`, la tabla muestra lo que devuelve la API para esos parámetros, y al recargar
  o volver atrás se conserva la vista. "Todas" no manda `status`.
- **CA-3:** Dada la cola sin resultados, cuando carga, entonces ve el mensaje vacío del filtro activo; dada la
  API caída, ve "No pudimos cargar las fichas tributarias." con "Reintentar", que vuelve a pedir.
- **CA-4:** Dada una fila, cuando hace clic (o Enter con el foco en ella), entonces abre
  `/compliance/tax-profiles/{commercialPublicId}`.

**Revisión de la ficha**

- **CA-5:** Dada una ficha enviada, cuando abre su revisión, entonces ve empresa, NIT, estado, versión
  vigente, la vocación con la nota "Solo para contrastar: la ficha no modifica la vocación", y las ocho
  secciones con lo declarado y su último resultado o "Pendiente de revisión".
- **CA-6:** Dada la sección a), cuando pulsa "Ver RUT", entonces abre el documento RUT de la versión vigente
  con la misma lógica de "Ver" de la 016 (URL de menos de 5 minutos o una nueva). Si el documento ya no
  está en el expediente, el enlace no aparece y se lee "Documento ya no vigente".
- **CA-7:** Dada la sección e), entonces ve cada periodo de ingresos con concepto, periodo, valor en pesos
  (con separador de miles) y alcance con el texto del diccionario; dada la f), ve el número de sedes
  declarado y el historial de establecimientos con los cerrados marcados.
- **CA-8:** Dada una sección, cuando pulsa "Observar" e intenta enviar sin nota (o solo espacios), entonces el
  diálogo muestra "Escribe la observación para el empresario." y no llama a la API; con nota, envía
  `{ result: 'OBSERVED', notes }` y la sección y el estado general se actualizan con la respuesta
  (la ficha pasa a "Con observaciones").
- **CA-9:** Dada una sección, cuando pulsa "Verificar" o "No aplica" sin nota, entonces se envía solo
  `{ result }`; con las ocho secciones verificadas o "no aplica" y ninguna observada, el estado que devuelve
  la API ("Revisada") se ve en la cabecera, y al volver a la cola la ficha aparece con ese estado.
- **CA-10:** Dada una revisión en curso, cuando pulsa dos veces, entonces se manda una sola petición; si la
  API responde 400 o falla la red, el diálogo sigue abierto con la nota escrita y el mensaje
  correspondiente.
- **CA-11:** Dada una ficha con dos o más versiones, cuando elige "Comparar con versión 1", entonces ve lado a
  lado la versión 1 y la vigente, sección por sección, con los campos distintos resaltados (incluidos
  ingresos y actividades agregados, quitados o cambiados) y sin botones de revisión; dada una sola versión,
  el selector no aparece.
- **CA-12:** Dada una ficha inexistente (404) o un id que no es UUID, cuando abre la revisión, entonces ve "El
  empresario todavía no ha enviado la ficha tributaria." con enlace a la cola (sin llamar a la API si no es
  UUID).

**Revisión de documentos**

- **CA-13:** Dado el caso del empresario en la pestaña Documentos, entonces ve el expediente agrupado por tipo,
  con el vigente arriba, el historial debajo, las insignias de revisión y de vencimiento, el titular, las
  fechas y las notas; solo los vigentes tienen "Revisar".
- **CA-14:** Dado un RUT vigente, cuando elige "Aceptar" sin titular e intenta guardar, entonces ve "Escribe el
  NIT o la cédula del titular." y no se llama a la API; dado un documento de tipo "Otro", aceptar sin titular
  sí se permite.
- **CA-15:** Dado el diálogo, cuando elige "Observar" o "Rechazar" sin notas, entonces ve "Escribe la
  observación o el motivo del rechazo." y no se llama a la API.
- **CA-16:** Dado el diálogo, cuando marca "vigencia comprobable" y pone un vencimiento anterior a la
  expedición, entonces ve "El vencimiento no puede ser anterior a la expedición."; cuando desmarca la casilla
  después de escribir un vencimiento, entonces `expiresAt` no viaja en el cuerpo.
- **CA-17:** Dado un titular que la API no reconoce, cuando guarda "Aceptar", entonces el diálogo sigue abierto
  con lo escrito y muestra tal cual "El titular del documento no corresponde al empresario. Márquelo como
  OBSERVED o REJECTED."; al cambiar a "Observar" con nota y guardar, la revisión se registra.
- **CA-18:** Dada una revisión guardada, entonces el diálogo se cierra, aparece "Revisión guardada" y el
  documento muestra el nuevo estado, titular, fechas y notas sin recargar la página; mientras se guarda, el
  diálogo no se puede cerrar y el botón no admite un segundo envío.

**Caso del empresario**

- **CA-19:** Dado un empresario, cuando abre `/compliance/commercials/{id}`, entonces ve la cabecera y las seis
  pestañas; al cambiar de pestaña la URL refleja `?tab=…`, y al recargar se abre la misma pestaña. Un
  `?tab=` desconocido abre "Ficha tributaria".
- **CA-20:** Dada la pestaña Ficha tributaria, entonces ve el resumen (estado, versión, fecha y conteo de
  secciones verificadas, observadas, en "no aplica" y pendientes, que suman ocho) y "Abrir revisión de la ficha"; sin ficha (404), ve "El
  empresario todavía no ha enviado la ficha tributaria." y las demás pestañas siguen funcionando.
- **CA-21:** Dada la pestaña Compromiso, entonces ve las manifestaciones de la más reciente a la más antigua
  con estado, "Contrato v{n}", fecha, representante legal o "Sistema" y detalle.
- **CA-22:** Dadas las pestañas Requerimientos, Hallazgos e Incidencias, entonces ve sus historiales con los
  campos de "Pantallas y flujo" (requerimientos paginados) y ningún botón para crear; un hallazgo que cambió
  la cuenta muestra "Estado de la cuenta aplicado: …".
- **CA-23:** Dada una pestaña cuya API falla, cuando la abre, entonces ve su mensaje de error con "Reintentar"
  y las demás pestañas cargan con normalidad.
- **CA-24:** Dada la revisión de la ficha, cuando pulsa "Ver caso del empresario", entonces llega al caso de
  ese empresario en la pestaña Ficha tributaria.

**Transversales**

- **CA-25:** Dado un usuario con otro rol (o sin sesión) y `MIDDLEWARE=ACTIVE`, cuando abre cualquiera de las
  tres rutas nuevas, entonces el middleware lo saca como ya hace con `/compliance`, y
  `routeProtection.test.ts` clasifica las tres páginas.
- **CA-26:** En todo el recorrido, el NIT, el titular, el nombre del representante y la `downloadUrl` no
  aparecen en la consola, en `localStorage`/`sessionStorage` ni en la barra de direcciones (RN-9).
- **CA-27:** `npm test`, `npm run lint:ci` (sin subir `.lint-max-warnings`), `npm run build`, `npx tsc
  --noEmit` y `npm run audit:ci` quedan como antes o mejor, sin dependencias nuevas, y las pruebas de
  navegador existentes siguen pasando.
- **CA-28:** Dada una revisión de la ficha abierta en la versión N, cuando el empresario envía la versión N+1
  y el oficial revisa una sección, entonces ve "La ficha cambió a la versión N+1 mientras la revisabas.
  Revisa de nuevo las secciones." y la pantalla muestra la versión N+1 (RN-13).
- **CA-29:** Dada la revisión de la ficha, entonces el régimen, las responsabilidades, las condiciones y el
  método de facturación se ven como "código — etiqueta"; con el catálogo caído se ven solo los códigos y la
  revisión sigue funcionando (RN-12).

## Fuera de alcance

- Spec 018: cola y detalle de requerimientos, crear requerimiento, revisar ("Suficiente"/"Insuficiente") y
  anular, registrar hallazgo (con sus reglas de medidas), registrar incidencia, alertas, reglas de alerta,
  catálogo tributario y las cuatro entradas del menú que les corresponden.
- Un listado general de comerciales en compliance.
- Enlaces "Ver caso" desde KYC o contratos.
- Pruebas de navegador (Playwright) de las pantallas nuevas: compliance no está en el alcance de `e2e/`
  (decisión del 2026-11-02). Las pruebas son de lógica con Vitest y comprobación manual.
- Editar la ficha o los documentos desde compliance, o revisar versiones anteriores.

## Requisitos no funcionales

- **Responsive:** las tres pantallas funcionan en móvil (360 px) y escritorio. En móvil, la revisión de la
  ficha va en una columna (lo declarado y, debajo, la revisión de cada sección), la comparación de versiones
  apila las dos versiones por sección y las tablas se desplazan horizontalmente o pasan a tarjetas. Siguen el
  estilo de las pantallas de compliance existentes (`ComplianceLayout`, colores `cmp-*`).
- **Accesibilidad:** pestañas con roles de `tablist`/`tab`/`tabpanel` y teclado (flechas); filas de la
  cola enfocables con Enter; diálogos con foco atrapado y título; los campos resaltados en la comparación
  no dependen solo del color (llevan una marca de texto, por ejemplo "Cambió").
- **Volumen:** la cola y los requerimientos del caso paginan con la API (20 por página). Documentos,
  compromiso, hallazgos e incidencias llegan completos.
- **PII:** ver RN-9 y CA-26. La cola muestra solo la empresa (no el NIT).
- **Tiempos:** las peticiones van por `apiClient` (30 s); no hay llamadas salientes de servidor nuevas.

## Preguntas abiertas

- [x] ¿Una spec o varias para la entrega D? → Dos: 017 (fases 7 a 9) y 018 (fases 10 y 11). Decidido el 2026-11-02.
- [x] ¿Qué pestañas del caso entran? → Las seis; Requerimientos, Hallazgos e Incidencias en solo lectura, sus acciones en la 018. Decidido el 2026-11-02.
- [x] ¿Desde dónde se llega al caso? → Desde la cola y la revisión de fichas; con la 018, también desde requerimientos y alertas. Sin listado de comerciales. Decidido el 2026-11-02.
- [x] ¿Entra el comparador de versiones? → Sí. Decidido el 2026-11-02.
- [x] ¿Pruebas de navegador? → No en esta spec: Vitest y comprobación manual. Decidido el 2026-11-02.
