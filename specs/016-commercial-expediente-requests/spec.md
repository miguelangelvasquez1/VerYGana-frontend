# 016 · Expediente documental y solicitudes de información del empresario (entrega C)

- **Estado:** Aprobada
- **Fecha:** 2026-10-29
- **Ticket:** —
- **Origen:** API · `docs/frontend/instrucciones-frontend-caracterizacion.md` (copiado en
  `specs/014-tax-profile-and-compliance-case/backend-contract.md`, secciones 0.2, 1.2, 1.4, 2, 3, 4.5,
  4.6 y 6) · numerales 4.7 y 4.8 del contrato. Controllers y servicios del repositorio de la API:
  `controllers/commercial/CommercialExpedienteController.java` (`/commercials/documents`),
  `controllers/inforequests/CommercialInformationRequestController.java`
  (`/commercials/information-requests`), `services/commercial/CommercialExpedienteDocumentServiceImpl.java`,
  `services/inforequests/InformationRequestServiceImpl.java` (`respond`, `notifyCommercial`),
  `dtos/inforequests/InformationRequestDTOs.java` (`RespondRequest`),
  `services/tax/TaxProfileServiceImpl.java` (`requireOwnedValidatedDocument`).

> Es la entrega **C** de cuatro (ver `specs/014-tax-profile-and-compliance-case/instrucciones.md`,
> sección 1, y las fases 5 y 6). Depende de la A (spec 014): reutiliza sus tipos
> (`Expediente.types.ts`, `src/types/compliance/InformationRequest.types.ts`), el diccionario de
> `src/lib/labels/taxCompliance.ts`, el `Dialog` y el `StatusBadge` compartidos, y la ficha
> tributaria (sección e). Para endpoints, campos y textos manda `backend-contract.md`; donde este
> documento lo precisa con lo que hace la API de verdad, manda este. Las rutas van en inglés (P-18)
> y no siguen las rutas en español que sugiere el backend.

## Problema

VERYGANA ya puede pedirle al empresario documentos, datos o aclaraciones (solicitudes de
información) y llevar su expediente documental con historial, revisión y vencimiento, pero el
empresario no tiene dónde verlo:

- no puede consultar qué documentos tiene vigentes, cuáles vencieron o qué observó VERYGANA, ni
  reemplazar uno vencido;
- no se entera de qué le piden ni por qué, y no puede responder. Una solicitud sin responder termina
  en un hallazgo que puede afectar su cuenta;
- la ficha tributaria (014) muestra "Tienes una aclaración pendiente" sin llevarlo a ningún lado, y
  los periodos de ingresos no pueden citar el documento que los soporta (RN-11 de la 014).

Las solicitudes llegan también **mientras el empresario sigue en el onboarding** (por ejemplo, con el
contrato en revisión, que es cuando se aclara el compromiso de formalización), y hoy todo
`/commercial/*` lo devuelve al onboarding: no tendría cómo verlas.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Empresario | `ROLE_COMMERCIAL` | Con el onboarding completo: consulta su expediente (vigentes e historial), abre cada documento, reemplaza un vigente o agrega uno de un tipo que no tiene. Siempre (también en el onboarding): ve sus solicitudes de información, su detalle y su historial, y responde las que esperan respuesta con una aclaración; con el onboarding completo, también con documentos. En la ficha tributaria elige el documento de soporte de cada periodo de ingresos. |

## Historias de usuario

- Como empresario, quiero ver mis documentos vigentes con su estado de revisión y vencimiento, para
  saber qué tengo al día.
- Como empresario, quiero reemplazar un documento vencido u observado sin perder el anterior, para
  mantener mi expediente actualizado.
- Como empresario, quiero saber qué me pide VERYGANA, por qué y para cuándo, para responder a tiempo.
- Como empresario que sigue en el registro, quiero ver y responder las aclaraciones que me piden sin
  tener que terminar el registro antes.
- Como empresario, quiero que quede claro que responder no cierra la solicitud, para no darla por
  resuelta antes de tiempo.
- Como empresario, quiero indicar qué documento soporta cada periodo de ingresos de mi ficha.

## Pantallas y flujo

### Rutas

| Ruta | Archivo | Quién llega y desde dónde |
|------|---------|---------------------------|
| `/commercial/profile/documents` (nueva) | `src/app/commercial/profile/documents/page.tsx` | "Mi expediente" en la tarjeta de accesos de "Mi perfil". |
| `/commercial/profile/information-requests` (nueva) | `src/app/commercial/profile/information-requests/page.tsx` | Ítem "Solicitudes de información" del Sidebar (con insignia), tarjeta de "Mi perfil", enlace "Tienes una aclaración pendiente" de la ficha, y las notificaciones de RN-14. |
| `/commercial/profile/information-requests/[requestPublicId]` (nueva) | `src/app/commercial/profile/information-requests/[requestPublicId]/page.tsx` | Desde la lista. `requestPublicId` es un UUID (no es dato personal). |
| `/commercial-onboarding` (existente) | — | Se agrega el aviso de solicitudes de RN-12 y la consulta y respuesta de solicitudes sin salir del onboarding. |
| `/commercial/profile/tax-info` y el paso "Ficha tributaria" del onboarding (existentes, 014) | — | Selector de soporte por periodo (RN-15) y enlace de la aclaración pendiente (RN-13). |

- Las tres rutas nuevas cuelgan del prefijo `/commercial`, ya protegido para `ROLE_COMMERCIAL` en
  `src/middleware.ts` y `routeAccess.ts`: no hace falta tocar el `matcher` (P-4). La API autoriza
  los datos (P-5).
- Las páginas nuevas son de servidor y solo renderizan un componente de cliente (P-2).
- Las páginas de `/commercial/*` siguen redirigiendo al onboarding si no está completo (comportamiento
  actual de `DashboardLayout`). Por eso, antes de `COMPLETED`, las solicitudes se ven **dentro** de
  `/commercial-onboarding` (RN-12). Si el plan necesita una subruta de `/commercial-onboarding`,
  debe clasificarla en `routeAccess.ts`; la preferencia es no crear una ruta nueva.

### Flujo: expediente (`/commercial/profile/documents`)

1. Se pide la lista del expediente. Se agrupa por tipo de documento, en el orden del diccionario
   (`COMMERCIAL_DOCUMENT_TYPE_LABELS`); un tipo sin documentos no se muestra.
2. Por cada tipo, **arriba el vigente** (`status = VALIDATED`): nombre del archivo, "Cargado el
   {uploadedAt}", insignia de revisión (`DOCUMENT_REVIEW_LABELS`; `null` = "Sin revisar"), insignia
   "Vencido" si `expired`, "Vence el {expiresAt}" si tiene vencimiento, y las observaciones
   (`reviewNotes`) si las hay. Botones "Ver" y "Reemplazar".
3. **Debajo, "Historial"** plegado por defecto, con los `SUPERSEDED` de ese tipo: nombre, "Reemplazado el
   {supersededAt}" y "Ver". Los estados `PENDING` y `ORPHANED` no se muestran.
4. **"Reemplazar":** abre un diálogo con el aviso "El documento anterior quedará en tu historial", el
   selector de archivo (PDF, JPG o PNG, máximo 10 MB) y "Subir". Al subir: preparar (con
   `replacesDocumentId` = id del vigente y el mismo tipo), subir el archivo a la URL firmada y
   confirmar (RN-4). Al terminar, la lista se vuelve a pedir y el nuevo queda como vigente.
5. **"Agregar documento":** botón en la cabecera. Abre un diálogo con el selector de tipo (solo los
   tipos **sin** vigente) y el de archivo. Sube sin `replacesDocumentId`. Si todos los tipos tienen
   vigente, el botón no aparece.
6. **"Ver":** abre el documento en una pestaña nueva (RN-5).
7. No hay eliminar ni editar.

### Flujo: solicitudes (`/commercial/profile/information-requests` y detalle)

1. **Lista**, ordenada por `issuedAt` (la más reciente arriba), con dos pestañas: "Pendientes"
   (`OPEN`, `OBSERVED`, `RESPONDED`) e "Historial" (`CLOSED_SATISFIED`, `CLOSED_WITH_FINDING`,
   `CANCELLED`). La pestaña activa puede ir en `?tab=`. Cada tarjeta: insignia de estado
   (`REQUEST_STATUS_LABELS_COMMERCIAL`), tipo (`TRIGGER_LABELS`), motivo (`reason`), "Enviada el
   {issuedAt}" y "Responder antes del {dueDate}" si la hay. Clic → detalle.
2. **Detalle**, en este orden:
   1. Cabecera: insignia de estado, tipo, "Enviada el …", "Responder antes del …" si la hay.
   2. **Banner de tono** si el tipo es `MISSING_MANIFESTATION`, `EXPRESS_REFUSAL` o `INCIDENT` (RN-10).
   3. **Qué te pedimos:** cada ítem con su `description` y, si la hay, "Respuesta esperada:
      {acceptableResponse}". Si es `DOCUMENT`, el tipo de documento y el botón "Cargar documento"
      (RN-8). Si trae `linkedDocumentId`: "Ya tenemos un documento de este tipo en tu expediente;
      VERYGANA revisará si es suficiente".
   4. **Por qué:** `reason` y `relationToOperation`.
   5. **Conversación:** línea de tiempo con las respuestas del empresario (`responses`: texto, documentos
      adjuntos por nombre y fecha de recepción) y las revisiones de VERYGANA (`reviews`: resultado
      "Suficiente"/"Insuficiente", nota y fecha), en orden cronológico. Si la solicitud está cerrada,
      al final "Cerrada el {closedAt}" y `closingNotes` si las hay.
   6. **Formulario de respuesta**, solo si el estado es `OPEN` u `OBSERVED` (RN-6): área de texto
      "Aclaración" (máximo 2000, con contador), la lista de documentos cargados en esta respuesta (cada
      uno con "Quitar") y "Enviar respuesta".
3. Tras enviar: mensaje "Recibimos tu respuesta. VERYGANA la revisará; la solicitud se cierra cuando
   termine la revisión" (RN-7). El detalle se actualiza con el nuevo estado y la respuesta en la
   conversación, y el formulario desaparece.

### Flujo: solicitudes durante el onboarding (RN-12)

1. En `/commercial-onboarding`, si hay solicitudes en `OPEN` u `OBSERVED`, aparece un aviso arriba del
   paso actual: "VERYGANA te envió {N} solicitud(es) de información" con el botón "Ver solicitudes".
   Sin solicitudes pendientes no se muestra nada.
2. "Ver solicitudes" muestra la misma lista y el mismo detalle que en el perfil, sin salir del
   onboarding, con una forma de volver al paso. El paso del onboarding no pierde lo que el usuario
   tenía.
3. En el detalle, antes de `COMPLETED`, solo se responde con aclaración: en los ítems `DOCUMENT`, en
   vez de "Cargar documento" va la nota "Podrás cargar este documento cuando termines tu registro.
   Mientras tanto, puedes responder con una aclaración." (RN-9).

### Estados de pantalla

**Expediente**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto de tres grupos. |
| Onboarding no completo | No aplica: `DashboardLayout` redirige al onboarding antes de llegar. Si la API responde el 400 de "El expediente se actualiza después de terminar el registro" al preparar una carga, se muestra su `message`. |
| Vacío | "Aún no tienes documentos en tu expediente." y "Agregar documento". |
| Error (red, 5xx) | "No pudimos cargar tu expediente." y "Reintentar". |
| Sin permiso (403) | "No tienes permiso para ver este expediente." Sin reintento. |
| Subiendo | En el diálogo: "Subir" deshabilitado con indicador; no se puede cerrar el diálogo a mitad de la subida. |
| Error al subir | En el diálogo, el `message` de la API (400 de tamaño, tipo, documento ya no vigente) o "No pudimos subir el documento. Intenta de nuevo"; el archivo elegido se conserva y "Subir" vuelve a empezar desde el principio (RN-4). |
| Éxito | El diálogo se cierra, la lista se actualiza y un aviso "Documento cargado". |

**Lista de solicitudes**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto de tres tarjetas. |
| Vacío | Pestaña "Pendientes": "No tienes solicitudes pendientes." Pestaña "Historial": "Aún no tienes solicitudes cerradas." |
| Error (red, 5xx) | "No pudimos cargar tus solicitudes." y "Reintentar". |
| Sin permiso (403) | "No tienes permiso para ver estas solicitudes." |
| Éxito | Tarjetas de la pestaña activa. |

**Detalle de solicitud**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto. |
| No encontrada (404, o `requestPublicId` que no es UUID) | "No encontramos esta solicitud." y "Volver a mis solicitudes". |
| Error (red, 5xx) | "No pudimos cargar la solicitud." y "Reintentar". |
| Sin permiso (403) | "No tienes permiso para ver esta solicitud." |
| Esperando respuesta (`OPEN`/`OBSERVED`) | Todo lo del flujo, con formulario. Si es `OBSERVED`, la última revisión "Insuficiente" se resalta arriba del formulario. |
| En revisión o cerrada | Sin formulario. `RESPONDED`: "Tu respuesta está en revisión por VERYGANA." |
| Enviando | "Enviar respuesta" deshabilitado con indicador; área de texto, "Cargar documento" y "Quitar" deshabilitados. |
| Error al enviar | `message` del 4xx (por ejemplo "Este requerimiento no está esperando una respuesta suya", o un documento que dejó de estar vigente) o "No pudimos enviar tu respuesta. Intenta de nuevo"; se conservan el texto y los documentos. Si el 400 es por estado, el detalle se vuelve a pedir. |

**Selector de soporte (ficha, sección e)**

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | El selector deshabilitado con "Cargando documentos…". |
| Sin documentos vigentes | Solo la opción "Sin soporte". |
| Error | El selector con "Sin soporte" (y "Documento guardado" si el periodo ya traía soporte, CA-23) y la nota "No pudimos cargar tus documentos"; no bloquea el envío de la ficha. |

## Contrato con la API

| Endpoint | Método | Rol | Entrada (DTO) | Salida (DTO) | Errores y qué ve el usuario |
|----------|--------|-----|---------------|--------------|-----------------------------|
| `/commercials/documents` | GET | `ROLE_COMMERCIAL` | — | `ExpedienteDocument[]` (`VALIDATED` y `SUPERSEDED`, más recientes primero) | Error de la lista (estados arriba). Funciona también antes de `COMPLETED` (lo usa el selector de soporte). |
| `/commercials/documents/prepare-upload` | POST | `ROLE_COMMERCIAL` | `ExpedienteDocumentUploadRequest` (`documentType`, `originalFileName`, `contentType` PDF/JPEG/PNG, `sizeBytes`, `replacesDocumentId?`) | `DocumentUploadPermission` (`documentId`, `permission.uploadUrl`, `expiresInSeconds`) | 400 si el onboarding no está `COMPLETED`, si pasa de 10 MB, si el tipo de archivo no es válido, o si el documento a reemplazar no es vigente o es de otro tipo: se muestra el `message`. |
| `uploadUrl` (Cloudflare R2) | PUT | — | El archivo, con `Content-Type` igual al declarado y **sin** `Authorization` | — | Fallo de red o de R2: "No pudimos subir el documento. Intenta de nuevo". |
| `/commercials/documents/{documentId}/confirm` | POST | `ROLE_COMMERCIAL` | — | `ExpedienteDocument` | 400 "Este documento ya fue confirmado o descartado" o "El documento que intenta reemplazar ya no está vigente. Recargue el expediente": se muestra el `message` y la lista se vuelve a pedir. |
| `/commercials/information-requests` | GET | `ROLE_COMMERCIAL` | — | `InformationRequest[]` (más recientes primero; `communications` vacío) | Error de la lista. Funciona antes de `COMPLETED`. |
| `/commercials/information-requests/{requestPublicId}` | GET | `ROLE_COMMERCIAL` | — | `InformationRequest` | 404 o de otro empresario: "No encontramos esta solicitud". |
| `/commercials/information-requests/{requestPublicId}/responses` | POST | `ROLE_COMMERCIAL` | `RespondRequest` (`message?` ≤ 2000, `documentIds?`; al menos uno) | `InformationRequest` | 400 "Este requerimiento no está esperando una respuesta suya", "Escriba una aclaración o adjunte al menos un documento" o "El documento N no está vigente en su expediente": se muestra el `message`. |
| `PUT /commercials/tax-profile` (existente, 014) | PUT | `ROLE_COMMERCIAL` | Cada periodo de `incomeReports` con `supportDocumentId` (vigente del empresario o `null`) | `TaxProfileResponse` | 400 "El documento N no está vigente en su expediente": `message` del envío, como en la 014. |

- Notificaciones: la API crea notificaciones internas con título "Solicitud de información de
  VERYGANA" (al enviar una solicitud) y "Tu respuesta tiene observaciones" (al revisarla como
  insuficiente). Llegan por el canal de notificaciones existente y **no traen tipo ni enlace**.
- Los 401, 402, 503 y el 400 de cambio de plan los trata el interceptor global de
  `src/lib/api/client.ts`. El `PUT` a R2 no pasa por `apiClient` (igual que
  `OnboardingService.uploadDocumentFile`).

### Dependencias de la API

- **DEP-1 · Identificador en las notificaciones.** Para no depender del texto del título (RN-14), la
  notificación debería traer un tipo (por ejemplo `INFORMATION_REQUEST_SENT`,
  `INFORMATION_REQUEST_OBSERVED`) y el `requestPublicId`, para llevar directo al detalle. No bloquea
  esta entrega; se anota para la API.

## Reglas de negocio

- **RN-1 · Sin eliminar (L-10):** el expediente no tiene eliminar ni editar. Un documento solo se
  reemplaza, y el anterior queda en el historial.
- **RN-2 · Reemplazo del mismo tipo:** "Reemplazar" envía `replacesDocumentId` = id del vigente y su
  mismo `documentType`. "Agregar documento" solo ofrece tipos sin vigente; para un tipo con vigente
  se usa "Reemplazar".
- **RN-3 · Archivo:** PDF, JPG o PNG, máximo 10 MB (el mismo límite del onboarding,
  `MAX_DOCUMENT_SIZE_BYTES`). Se valida en el front antes de preparar la carga, con los mensajes
  "Formato no permitido. Usa PDF, JPG o PNG" y "El archivo supera el tamaño máximo de 10MB". La API
  vuelve a validar y su `message` se muestra tal cual.
- **RN-4 · Carga en tres pasos:** preparar → subir a la URL firmada → confirmar. Si cualquier paso
  falla, el archivo no cuenta: se muestra el error y el reintento empieza desde preparar. La lógica es
  una sola, reutilizable por el expediente y por la respuesta a una solicitud.
- **RN-5 · URL de descarga (P-16):** `downloadUrl` dura 5 minutos. Al pulsar "Ver" se usa una URL de
  hace menos de 5 minutos o la lista se vuelve a pedir antes de abrirla. Se abre directo en una pestaña
  nueva, sin pasar por una ruta propia del front; nunca se guarda, se registra ni se pone en la query
  de una ruta del front. Igual para `uploadUrl`.
- **RN-6 · Solo se responde lo que espera respuesta:** el formulario existe solo en `OPEN` u
  `OBSERVED`. Exige una aclaración (recortada, no vacía) o al menos un documento; con ninguno de los
  dos, "Enviar respuesta" muestra "Escribe una aclaración o adjunta al menos un documento". Aclaración
  ≤ 2000 caracteres. Evita el doble envío (P-11).
- **RN-7 · Responder no cierra (L-11):** tras responder, el estado pasa a "En revisión por VERYGANA" y
  se muestra el mensaje del flujo. Ningún texto dice que la solicitud quedó resuelta o cerrada; solo
  VERYGANA la cierra. Cargar un documento al expediente tampoco responde la solicitud: hay que enviar
  la respuesta.
- **RN-8 · "Cargar documento" desde un ítem:** sube un documento del tipo que pide el ítem al
  expediente (reemplaza el vigente de ese tipo si existe, con el aviso de RN-1; si no, lo agrega) y lo
  añade a la lista de documentos de esta respuesta. Los documentos de la respuesta son solo los
  cargados en ella; no se eligen documentos que ya estaban en el expediente (para eso está el aviso
  de `linkedDocumentId`).
- **RN-9 · Antes de `COMPLETED` solo aclaración:** la API no deja cargar al expediente hasta terminar
  el registro, así que en el onboarding no se ofrece "Cargar documento" (nota del flujo) y la respuesta
  va solo con texto.
- **RN-10 · Tono (L-5, L-7):** para `MISSING_MANIFESTATION`, `EXPRESS_REFUSAL` e `INCIDENT`, banner
  informativo (no rojo): "Esta solicitud es una aclaración sobre el compromiso de formalización. No es
  una sanción." Ningún texto de esta entrega presenta una solicitud como sanción.
- **RN-11 · Insignia de pendientes:** el número de solicitudes en `OPEN` u `OBSERVED`, calculado desde
  la lista (no hay endpoint de conteo). Con cero no se muestra. Va en el ítem "Solicitudes de
  información" del Sidebar comercial y en el acceso de "Mi perfil". Se actualiza al responder.
- **RN-12 · Solicitudes en el onboarding:** ver el flujo. El aviso cuenta igual que RN-11. Ver o
  responder solicitudes no cambia el paso del onboarding ni lo que el usuario tenía en él.
- **RN-13 · Aclaración pendiente de la ficha:** el texto "Tienes una aclaración pendiente" de la ficha
  (014, `src/lib/taxProfile/display.ts`) pasa a ser un enlace a
  `/commercial/profile/information-requests`.
- **RN-14 · Notificaciones:** en el panel de notificaciones, una notificación cuyo título es
  exactamente "Solicitud de información de VERYGANA" o "Tu respuesta tiene observaciones" lleva, al
  hacer clic, a `/commercial/profile/information-requests` (si el onboarding no está completo, el
  layout lo lleva al onboarding, donde está el aviso de RN-12). Las demás notificaciones no cambian.
  Los títulos van en una constante única para cambiarlos cuando llegue DEP-1.
- **RN-15 · Soporte de ingresos (cierra RN-11 de la 014):** en la sección e) de la ficha, cada periodo
  tiene un selector "Documento de soporte" con "Sin soporte" (valor por defecto en un periodo nuevo) y
  los documentos **vigentes** del empresario, como "{tipo} — {nombre del archivo}". Al editar, se
  preselecciona el `supportDocumentId` de la versión; si ese documento ya no está vigente, el selector
  lo muestra como "Documento ya no vigente", y el usuario debe elegir otro o "Sin soporte" antes de
  enviar (la API rechaza un soporte no vigente). Desde el selector no se carga un archivo nuevo. Aplica
  en el perfil y en el paso del onboarding.
- **RN-16 · Fechas:** las `YYYY-MM-DD` (`dueDate` de la solicitud, `expiresAt` del documento) se
  formatean desde la cadena; las de hora (`issuedAt`, `closedAt`, `receivedAt` y `reviewedAt` de la
  solicitud, `uploadedAt` y `supersededAt` del documento) se muestran en hora de Colombia (utilidades de la
  014). Corregido el 2026-10-29: en la API, el `issuedAt` de la solicitud es fecha con hora (C-1 del plan).
- **RN-17 · Invalidaciones (P-10):** confirmar una carga deja desactualizada la lista del expediente y
  los documentos del onboarding; responder deja desactualizados la lista y el detalle de solicitudes
  (y con ello la insignia).

## Criterios de aceptación

**Expediente**

- **CA-1:** Dado un empresario con el onboarding completo y documentos de varios tipos, cuando abre
  "Mi expediente", entonces ve un grupo por tipo con el vigente arriba (nombre, fecha, insignia de
  revisión, "Vencido" si corresponde, "Vence el …" y observaciones) y el historial plegado, y no ve
  `PENDING` ni `ORPHANED`.
- **CA-2:** Dado un vigente, cuando pulsa "Reemplazar", entonces ve "El documento anterior quedará en
  tu historial"; al subir un archivo válido, se envía `replacesDocumentId` con el id del vigente y el
  mismo tipo, y al terminar el nuevo es el vigente y el anterior aparece en el historial.
- **CA-3:** Dado que existen tipos sin vigente, cuando pulsa "Agregar documento", entonces el selector
  solo ofrece esos tipos y la carga va sin `replacesDocumentId`; si todos tienen vigente, el botón no
  aparece.
- **CA-4:** Dado un archivo de otro formato o de más de 10 MB, cuando lo elige, entonces ve el mensaje
  de RN-3 y no se pide permiso de carga a la API.
- **CA-5:** Dado que la subida a R2 o la confirmación fallan, cuando ve el error, entonces el archivo
  sigue elegido y "Subir" vuelve a preparar la carga desde el principio; si la API responde 400, se
  muestra su `message`.
- **CA-6:** Dado un documento cuya lista se pidió hace más de 5 minutos, cuando pulsa "Ver", entonces
  la lista se vuelve a pedir y se abre la URL nueva en otra pestaña; la URL no aparece en la barra de
  una ruta del front, ni en la consola ni en el almacenamiento.
- **CA-7:** Dado el expediente, entonces no existe ninguna acción de eliminar o editar.

**Solicitudes**

- **CA-8:** Dado un empresario con solicitudes en varios estados, cuando abre "Solicitudes de
  información", entonces "Pendientes" muestra las `OPEN`, `OBSERVED` y `RESPONDED`, "Historial" las
  cerradas y anuladas, ordenadas de la más reciente a la más antigua, cada una con insignia, tipo,
  motivo, fecha de envío y fecha límite si la hay.
- **CA-9:** Dado el detalle de una solicitud, entonces ve qué se pide (con "Respuesta esperada" y el
  aviso de `linkedDocumentId` cuando aplican), por qué, y la conversación en orden cronológico.
- **CA-10:** Dada una solicitud `OPEN` u `OBSERVED`, cuando envía solo una aclaración, solo documentos
  o ambos, entonces se envía `{ message, documentIds }` sin las claves vacías, se muestra el mensaje de
  RN-7, el estado pasa a "En revisión por VERYGANA" y el formulario desaparece.
- **CA-11:** Dado el formulario vacío (o con solo espacios), cuando pulsa "Enviar respuesta", entonces
  ve "Escribe una aclaración o adjunta al menos un documento" y no se llama a la API; con 2001
  caracteres no se puede enviar.
- **CA-12:** Dado un ítem `DOCUMENT` con el onboarding completo, cuando usa "Cargar documento",
  entonces el documento se carga al expediente del tipo del ítem (reemplazando el vigente si existe) y
  aparece en la lista de la respuesta con "Quitar"; la solicitud no cambia de estado hasta enviar.
- **CA-13:** Dada una solicitud `RESPONDED` o cerrada, entonces no hay formulario; las `RESPONDED`
  muestran "Tu respuesta está en revisión por VERYGANA".
- **CA-14:** Dada una solicitud `MISSING_MANIFESTATION`, `EXPRESS_REFUSAL` o `INCIDENT`, entonces el
  detalle muestra el banner "No es una sanción" de RN-10; con otro tipo no aparece.
- **CA-15:** Dado que la API responde 400 al enviar (por ejemplo, la solicitud ya no espera
  respuesta), entonces se ve su `message`, se conservan el texto y los documentos, y si el error es por
  estado el detalle se vuelve a pedir; con red o 5xx se ve el texto genérico.
- **CA-16:** Dado un doble clic en "Enviar respuesta", entonces sale una sola petición.
- **CA-17:** Dado un `requestPublicId` inexistente, de otro empresario o que no es UUID, entonces se ve
  "No encontramos esta solicitud" con el enlace de vuelta.

**Onboarding, menú y notificaciones**

- **CA-18:** Dado un empresario en el onboarding con 2 solicitudes `OPEN`/`OBSERVED`, cuando abre
  `/commercial-onboarding`, entonces ve "VERYGANA te envió 2 solicitudes de información" y puede ver y
  responder con aclaración sin salir del onboarding; los ítems `DOCUMENT` muestran la nota de RN-9 en
  vez de "Cargar documento"; al volver, sigue en el mismo paso. Sin pendientes, no hay aviso.
- **CA-19:** Dado un empresario con el onboarding completo y 3 solicitudes `OPEN`/`OBSERVED`, entonces
  el ítem "Solicitudes de información" del Sidebar y el acceso de "Mi perfil" muestran 3; tras
  responder una, muestran 2; con 0, no hay insignia.
- **CA-20:** Dada una notificación con título "Solicitud de información de VERYGANA" o "Tu respuesta
  tiene observaciones", cuando hace clic en ella, entonces llega a la lista de solicitudes; otra
  notificación se comporta como antes.
- **CA-21:** Dada la ficha con "Tienes una aclaración pendiente" (014), entonces ese texto es un enlace
  a la lista de solicitudes.

**Ficha tributaria**

- **CA-22:** Dado un periodo nuevo de la sección e), entonces su selector de soporte arranca en "Sin
  soporte" y ofrece solo los documentos vigentes; al enviar, el periodo lleva el `supportDocumentId`
  elegido o `null`.
- **CA-23:** Dada una versión cuyo periodo tenía un soporte que ya no está vigente, cuando la edita,
  entonces el selector muestra "Documento ya no vigente" y no deja enviar hasta elegir otro o "Sin
  soporte"; si la lista de documentos falla o sigue cargando, el selector ofrece "Sin soporte" y, si el
  periodo ya traía un soporte, también "Documento guardado" (seleccionado y enviado con el mismo
  `supportDocumentId`; la API decide al enviar), y la ficha se puede enviar. Ajustado el 2026-10-29
  (D-5 del plan, decisión del usuario): así la versión nueva no pierde el soporte en silencio.

**Transversales**

- **CA-24:** Dado el uso de estas pantallas, entonces en `console.*`, URLs del front, `localStorage` y
  `sessionStorage` no aparecen `downloadUrl`, `uploadUrl`, `holderIdentification`, el texto de las
  respuestas ni el contenido de las solicitudes (P-16).
- **CA-25:** Dado el cambio completo, entonces `npm test`, `npm run lint:ci` (sin avisos nuevos),
  `npm run build`, `npx tsc --noEmit` y `npm run audit:ci` pasan como antes o mejor, sin dependencias
  nuevas, y `routeProtection.test.ts` clasifica las páginas nuevas.

## Fuera de alcance

- Todas las pantallas de compliance: revisión de documentos, requerimientos, hallazgos, alertas
  (entrega D, spec 017).
- Elegir documentos ya existentes del expediente como adjuntos de una respuesta (RN-8).
- Cargar documentos al expediente antes de `COMPLETED` (lo impide la API).
- El enlace directo de la notificación al detalle de la solicitud (DEP-1).
- Cambiar la redirección de `DashboardLayout` al onboarding.
- Pruebas de navegador (Playwright) de estas pantallas: el área `/commercial` no está en `e2e/`; lo
  visual se comprueba a mano (excepción de P-17).
- Documentación en Notion: se ofrece al cierre de las cuatro entregas.

## Requisitos no funcionales

- **Responsive:** todo funciona desde 360 px. Las tarjetas y la línea de tiempo se apilan; los
  diálogos de carga caben en pantalla y se usan con teclado (foco, Escape salvo mientras sube).
- **Accesibilidad:** los grupos plegables y las pestañas se manejan con teclado y tienen nombre
  accesible; las insignias no dependen solo del color.
- **Volumen:** las listas no vienen paginadas de la API; se muestran completas.
- **PII (P-16):** el expediente trae `holderIdentification` (identificación del titular), que no se
  muestra al empresario en esta entrega y nunca va a logs, URLs ni almacenamiento. `downloadUrl` y
  `uploadUrl` son URL firmadas (RN-5). El texto de las respuestas, los motivos y los nombres de
  archivo no van a `console.*` ni a almacenamiento.
- Sin dependencias nuevas (P-1). Formularios con react-hook-form y zod (P-11). Datos con TanStack Query
  (P-10).

## Preguntas abiertas

- [x] Acceso a solicitudes antes de `COMPLETED`: también en el onboarding, solo con aclaración
  (decidido 2026-10-29).
- [x] Entradas y la insignia: Sidebar y "Mi perfil" (decidido 2026-10-29).
- [x] Notificaciones: por título, con DEP-1 para la API (decidido 2026-10-29).
- [x] Selector de soporte de ingresos: entra en la 016 (decidido 2026-10-29).
- [x] Límite de archivo del expediente: 10 MB, el mismo del onboarding (comprobado en la API:
  `commercial.onboarding.documents.max-size-bytes`).
- [ ] ¿El panel de notificaciones existe en `/commercial-onboarding`? Si no, RN-14 solo aplica en el
  panel comercial y en el onboarding basta el aviso de RN-12 (lo confirma el planner; no bloquea).
