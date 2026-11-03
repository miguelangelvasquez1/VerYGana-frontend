# 018 · Compliance: requerimientos, hallazgos, incidencias, alertas, reglas y catálogo (entrega D, parte 2)

- **Estado:** Aprobada
- **Fecha:** 2026-11-02
- **Ticket:** —
- **Origen:** API · `docs/frontend/instrucciones-frontend-caracterizacion.md` (copiado en
  `specs/014-tax-profile-and-compliance-case/backend-contract.md`, secciones 1.4, 2, 3, 5.5 a 5.10 y 6) ·
  numerales 1.7, 4.7 y 4.8 del contrato. Controllers y servicios del repositorio de la API:
  `controllers/inforequests/ComplianceInformationRequestController.java` (requerimientos, hallazgos,
  incidencias, alertas y reglas), `controllers/tax/ComplianceTaxProfileController.java` (catálogo),
  `services/inforequests/InformationRequestServiceImpl.java` y `ComplianceCaseServiceImpl.java`.

> Segunda mitad de la entrega **D** (fases 10 y 11 de `instrucciones.md`). Depende de la 014 a la 017: reutiliza
> sus tipos (`src/types/compliance/InformationRequest.types.ts`, `src/types/commercial/TaxProfile.types.ts`), el
> diccionario `src/lib/labels/taxCompliance.ts`, el `Dialog` con foco atrapado, el `StatusBadge`, la línea de
> tiempo de solicitudes de la 016 y el caso del empresario de la 017. Para endpoints, campos y textos manda
> `backend-contract.md`; donde este documento lo precisa con lo que hace la API, manda este. Rutas en inglés (P-18).

## Problema

La 017 dejó al oficial de cumplimiento viendo la ficha, los documentos y el historial del empresario, pero sin
poder actuar: no puede pedir información, revisar lo que el empresario responde, anular una solicitud, registrar
un hallazgo o una incidencia, atender las alertas automáticas, configurar las reglas que las generan ni mantener
el catálogo tributario que alimenta los selectores de la ficha. Hoy esas acciones solo se pueden hacer llamando a
la API a mano, y el catálogo vacío deja los selectores de la ficha del empresario en "Aún no disponible".

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer |
|-------|-------------------|--------------------------|
| Oficial de cumplimiento | `ROLE_COMPLIANCE_OFFICER` | Todo lo de esta spec. |
| Administrador y demás roles | — | Nada: el middleware ya protege `/compliance` por prefijo y la API responde 403. |
| Empresario | `ROLE_COMMERCIAL` | Nada nuevo aquí; ve las solicitudes y sus revisiones en las pantallas de la 016. |

## Pantallas y flujo

Todas las rutas nuevas cuelgan de `/compliance` (protegido por prefijo, P-4: no se toca el `matcher`). Páginas de
servidor que delegan en componentes de cliente (P-2) y leen `params`/`searchParams` con `await` (P-6).

1. **Menú** (`ComplianceLayout.tsx`, `NAV`): se agregan "Requerimientos", "Alertas", "Reglas de alerta" y
   "Catálogo tributario", con íconos de `lucide-react` (el mismo `NAV` alimenta el riel y el cajón que ya existen).

2. **Cola de requerimientos — `/compliance/information-requests`** (5.5):
   - Tabla paginada (20) con empresa, tipo (`TRIGGER_LABELS`), estado (insignia, textos de compliance), emitido por
     ("Sistema" / "Compliance"), fecha de emisión y vencimiento.
   - Filtro por estado: los seis estados de la API con los textos de compliance del diccionario ("Por revisar" =
     `RESPONDED`, por defecto) más "Todos" (sin filtro). Estado y página en la URL (`?status=`, `?page=`). Sin filtro por empresario aquí (ya está en la pestaña del caso).
   - Clic o Enter en una fila → detalle.

3. **Detalle de requerimiento — `/compliance/information-requests/[requestPublicId]`** (5.5):
   - Cabecera: empresa (enlace "Ver caso del empresario"), tipo, estado, emitido por, fechas; si viene de una regla,
     "Regla {ruleCode} v{ruleVersion}".
   - Motivo, relación con la operación, ítems (con tipo de documento, campo o sede, descripción y respuesta
     aceptable), y la línea de tiempo de respuestas y revisiones (la misma lógica de la 016). Los documentos
     adjuntos de una respuesta se nombran por su tipo y se abren con "Ver" (lista de documentos del caso, 017).
   - **Comunicaciones:** canal, fecha e insignia "Enviada" / "Falló". Si alguna falló: su `errorDetail` y el aviso
     "El empresario podría no haber recibido la notificación; no lo trates como falta de respuesta".
   - **Acciones según estado:**
     - `RESPONDED`: "Suficiente" y "Insuficiente" (este último con nota obligatoria) en un diálogo.
     - `OPEN`, `RESPONDED` u `OBSERVED`: "Anular" con motivo obligatorio y confirmación.
     - Cualquier estado no cerrado: "Registrar hallazgo" (punto 5) con el requerimiento ya enlazado; la API cierra
       el requerimiento con el hallazgo.
     - Cerrado o anulado: sin acciones; se ve "Cerrada el …" y las notas de cierre.

4. **Crear requerimiento** (5.6): diálogo grande que se abre desde la pestaña "Requerimientos" del caso
   ("Nuevo requerimiento") y desde una alerta ("Abrir requerimiento"). El empresario va fijo. Campos:
   - tipo (`trigger`, selector con el diccionario; si viene de una alerta, preseleccionado con el de la alerta);
   - motivo (obligatorio, ≤ 1000, ayuda "Explica el hecho concreto que origina la solicitud");
   - relación con la vinculación o el funcionamiento (obligatoria, ≤ 1000, ayuda "¿Qué requisito se evalúa con esta
     información?");
   - plazo (fecha opcional, ayuda "Solo si una regla aplicable fija un plazo");
   - ítems (al menos uno, lista dinámica): tipo (Documento, Campo, Aclaración); si Documento, tipo de documento
     (obligatorio) y sede opcional (sedes activas del empresario); si Campo, ruta del campo (obligatoria, ≤ 100);
     descripción (obligatoria, ≤ 500) y respuesta aceptable (≤ 500). No existe una opción de "actualizar toda la
     información".
   - Si viene de una alerta, se envía `alertId`.
   - Al crear: aviso "Requerimiento enviado" y se abre su detalle.

5. **Registrar hallazgo** (5.7): diálogo que se abre desde la pestaña "Hallazgos" del caso y desde el detalle del
   requerimiento. Campos: hecho observado (obligatorio, ≤ 2000), evidencia (≤ 2000), clasificación, gravedad,
   afectación (obligatoria, ≤ 1000), "¿Es subsanable?" (Sí/No sin respuesta marcada), fundamento contractual
   (obligatorio, ≤ 1000), medida y alcance de la medida (≤ 500). Reglas en RN-4 a RN-7. Al guardar: aviso
   "Hallazgo registrado" y, si la cuenta cambió, "Estado de la cuenta aplicado: {estado}".

6. **Registrar incidencia**: diálogo desde la pestaña "Incidencias" del caso, con contexto (obligatorio, ≤ 100, tope de la API) y
   descripción (obligatoria), y requerimiento relacionado opcional (selector con los requerimientos del empresario).

7. **Alertas — `/compliance/alerts`** (5.8):
   - Lista paginada con el interruptor "Solo pendientes" activado por defecto (en la URL, `?all=1` cuando se apaga).
   - Cada alerta: fecha, empresa (enlace al caso), tipo, "Regla {code} v{n}" o "Evento del expediente" si no hay
     regla, y el `message` **completo**, sin recortar.
   - "Ver datos": `dataUsedJson` como tabla clave/valor (claves que terminan en `Cents` formateadas en pesos); si no
     se puede leer, "No pudimos leer los datos de la alerta".
   - Sin revisar: "Marcar revisada" (nota obligatoria, ≤ 1000) y "Abrir requerimiento" (punto 4).
   - Revisada: la nota, la fecha y, si hay `requestPublicId`, el enlace al requerimiento.

8. **Reglas de alerta — `/compliance/alert-rules`** (5.9):
   - Agrupadas por `code`: la versión activa arriba con sus parámetros (ventana en días, % mínimo de crecimiento y
     ventas mínimas en pesos, leídos de `paramsJson`) y el historial de versiones plegado.
   - "Nueva regla" y "Nueva versión" (en un grupo, con el código fijo): código (`/^[A-Z0-9_]{3,50}$/`), tipo fijo
     "Crecimiento de ventas en VERYGANA entre dos ventanas iguales", descripción (obligatoria, ≤ 500), fundamento (obligatorio,
     ≤ 500), ventana en días (≥ 7), % mínimo (≥ 0,01) y ventas mínimas en pesos (≥ 0). **Los tres umbrales arrancan
     vacíos.** Si el código ya existe: "Se creará la versión N+1 y la actual se desactivará". Nota fija: "La regla
     solo ve operaciones en VERYGANA; sus alertas son informativas".
   - "Desactivar" en la versión activa, con confirmación.

9. **Catálogo tributario — `/compliance/tax-catalog`** (5.10):
   - Pestañas por tipo de catálogo (`TaxCatalogType`, con el diccionario de la 014); tabla con código, etiqueta,
     fundamento, vigencia (desde / hasta) e insignia "Activo" / "Retirado".
   - "Agregar código": tipo (el de la pestaña), código (≤ 30), etiqueta (≤ 200), fundamento (obligatorio, ≤ 500),
     "Vigente desde" (obligatoria).
   - "Retirar" en los activos: pide "Vigente hasta" (no anterior a "Vigente desde").
   - Sin editar ni borrar. Nota fija: "Un código no se edita: se retira y se crea uno nuevo".

10. **Caso del empresario (017):** las pestañas Requerimientos, Hallazgos e Incidencias ganan su botón de crear
    ("Nuevo requerimiento", "Registrar hallazgo", "Registrar incidencia") y cada requerimiento de la lista abre su
    detalle. Esto reemplaza la RN-10 de la 017.

### Estados de pantalla

| Pantalla | Cargando | Vacío | Error (red, 5xx) | 404 / id inválido |
|---|---|---|---|---|
| Cola de requerimientos | Esqueleto con el filtro visible | "No hay requerimientos {en este estado}." | "No pudimos cargar los requerimientos." + "Reintentar" | — |
| Detalle | Esqueleto | — | "No pudimos cargar el requerimiento." + "Reintentar" | "No encontramos este requerimiento." + volver a la cola (sin llamar a la API si no es UUID) |
| Alertas | Esqueleto | "No hay alertas pendientes." / "No hay alertas." | "No pudimos cargar las alertas." + "Reintentar" | — |
| Reglas | Esqueleto | "Todavía no hay reglas de alerta." + "Nueva regla" | "No pudimos cargar las reglas." + "Reintentar" | — |
| Catálogo | Esqueleto | "No hay códigos en este catálogo." + "Agregar código" | "No pudimos cargar el catálogo." + "Reintentar" | — |

Todos los diálogos de acción: validación bajo cada campo sin llamar a la API; mientras envían, botón deshabilitado
con indicador y el diálogo no se cierra (Escape, fondo, X); un 400 muestra el `message` de la API tal cual en el
diálogo, con lo escrito conservado; red/5xx, "No pudimos guardar. Intenta de nuevo."; 403, "No tienes permiso para
ver esta sección.".

## Contrato con la API

Todo con `ROLE_COMPLIANCE_OFFICER`. Tipos ya existentes en el front desde la 014 (`InformationRequest.types.ts`,
`CatalogEntryRequest`, `RetireCatalogEntryRequest`). Los 401, 402, 503 y el 400 de plan los trata el interceptor.

| Endpoint | Método | Entrada | Salida | Errores que ve el usuario |
|---|---|---|---|---|
| `/compliance/information-requests?status=&commercialPublicId=&page=&size=` | GET | filtros opcionales | `PagedResponse<InformationRequest>` | error de la cola |
| `/compliance/information-requests/{id}` | GET | UUID | `InformationRequest` (con `communications`) | 404 → "No encontramos este requerimiento." |
| `/compliance/information-requests` | POST | `CreateInformationRequest` | `InformationRequest` | 400 "Ya hay un requerimiento abierto idéntico ({publicId}). No se crea otro." (RN-2), "Indique qué tipo de documento se pide.", "Indique qué campo se pide actualizar.", alerta de otro empresario o ya revisada |
| `/compliance/information-requests/{id}/review` | POST | `ReviewInformationRequest` | `InformationRequest` | 400 "Solo se revisa un requerimiento con una respuesta pendiente de revisión.", "Indique qué falta…" |
| `/compliance/information-requests/{id}/cancel` | POST | `CancelInformationRequest` | `InformationRequest` | 400 "El requerimiento ya está cerrado." |
| `/compliance/findings` | POST | `FindingRequest` | `Finding` | 400 de medidas no permitidas o sin negativa expresa (la API valida lo mismo que RN-4 y RN-5) |
| `/compliance/incidents` | POST | `IncidentRequest` | `Incident` | 400 con `message` |
| `/compliance/alerts?pendingOnly=&page=&size=` | GET | `pendingOnly` (por defecto `true`) | `PagedResponse<Alert>` | error de la lista |
| `/compliance/alerts/{id}/review` | POST | `AlertReviewRequest` | `Alert` | 400 "La alerta ya fue revisada." |
| `/compliance/alert-rules` | GET / POST | — / `AlertRuleRequest` | `AlertRule[]` / `AlertRule` | 400 "Parámetros de regla inválidos" |
| `/compliance/alert-rules/{id}/deactivate` | POST | — | `AlertRule` | 400 con `message` |
| `/compliance/tax-catalog` | GET / POST | — / `CatalogEntryRequest` | `CatalogEntry[]` / `CatalogEntry` | 400 con `message` (código repetido, etc.) |
| `/compliance/tax-catalog/{id}/retire` | POST | `RetireCatalogEntryRequest` | `CatalogEntry` | 400 con `message` |
| Lecturas de la 017 (documentos, compromiso, hallazgos, incidencias, ficha) | GET | — | — | ya resueltas en la 017 |

**Dependencias de la API:** ninguna bloqueante. Nota: el `publicId` del requerimiento duplicado solo viene dentro del
texto del `message`; el front lo extrae con una expresión de UUID (RN-2). Lo ideal sería un campo propio en el error.

## Reglas de negocio

- **RN-1 (L-12) · Ítems concretos:** al menos un ítem; Documento exige tipo de documento, Campo exige ruta; no hay
  opción de "actualizar toda la información".
- **RN-2 · Duplicado:** ante el 400 de requerimiento idéntico se muestra el mensaje y, si contiene un UUID, el botón
  "Abrir el requerimiento existente".
- **RN-3 · Revisión de respuesta:** "Suficiente" y "Insuficiente" solo en `RESPONDED`; "Insuficiente" exige nota (no
  vacía tras recortar). "Anular" solo en `OPEN`, `RESPONDED` u `OBSERVED`, con motivo obligatorio.
- **RN-4 (L-13) · Medidas limitadas:** con clasificación `SUBSANABLE_ERROR` o `ISOLATED_INCONSISTENCY` solo se
  permiten "Sin medida" y "Advertencia"; las demás opciones quedan deshabilitadas con la nota "Una inconsistencia
  aislada o un error subsanable no justifican restringir ni suspender". Si se cambia la clasificación con una medida
  ya no permitida elegida, la medida se vacía. La regla vive en una función pura con prueba.
- **RN-5 · Negativa expresa:** la clasificación `EXPRESS_REFUSAL` solo se habilita si el historial del compromiso
  del empresario (lectura de la 017) tiene alguna `EXPRESS_REFUSAL`; si no, deshabilitada con "No hay una negativa
  expresa registrada". Si el historial no cargó, también deshabilitada.
- **RN-6 · Medidas que cambian la cuenta:** con `PREVENTIVE_RESTRICTION` o `SUSPENSION`, antes de enviar se abre un
  diálogo rojo: "Esta medida cambiará de inmediato el estado de la cuenta de **{empresa}** a **{Restricción preventiva
  | Suspensión}**. Quedará registrada con su fundamento. ¿Confirmas?". "Confirmar" solo se habilita cuando el oficial
  escribe el nombre exacto de la empresa (sin distinguir mayúsculas ni espacios de los extremos). Decisión del usuario
  (2026-11-02).
- **RN-7 · Remisión a terminación:** con `TERMINATION_REFERRAL` se muestra "No cambia el estado de la cuenta; remite
  el caso al procedimiento de terminación".
- **RN-8 (L-7) · Alertas informativas:** el `message` de la alerta se muestra completo; ningún texto presenta una
  alerta como sanción ni como incumplimiento.
- **RN-9 (L-14) · Umbrales sin valores por defecto:** los tres umbrales de una regla arrancan vacíos; los montos se
  escriben en pesos y se envían en centavos (utilidad de la 014).
- **RN-10 · Catálogo inmutable:** no hay editar ni borrar; retirar exige "Vigente hasta" ≥ "Vigente desde".
- **RN-11 · Cachés (P-10):** crear, revisar o anular un requerimiento invalida la cola, el detalle y la pestaña de
  requerimientos del caso; un hallazgo invalida los hallazgos del caso y, si viene de un requerimiento, ese
  requerimiento y la cola; una incidencia, las incidencias del caso; revisar una alerta o abrir un requerimiento
  desde ella, la lista de alertas; las reglas y el catálogo invalidan su lista. Crear o retirar un código invalida
  también el catálogo de la ficha de compliance (017).
- **RN-12 (P-11) · Formularios:** react-hook-form + zod, sin doble envío.
- **RN-13 (P-16) · Datos personales:** los textos de motivos, hallazgos, evidencias, notas y `dataUsedJson` no van a
  `console.*`, a la URL ni al almacenamiento. En la URL solo UUID, `status`, `page`, `tab` y `all`.

## Criterios de aceptación

**Menú y requerimientos**

- **CA-1:** Dado un oficial, cuando abre `/compliance`, entonces ve en el menú "Requerimientos",
  "Alertas", "Reglas de alerta" y "Catálogo tributario", y cada una lleva a su ruta.
- **CA-2:** Dada la cola, entonces arranca en "Por revisar" (`status=RESPONDED`); al cambiar el filtro o la página la
  URL lo refleja y se conserva al recargar; "Todos" no envía `status`; una fila se abre con clic o Enter.
- **CA-3:** Dado el detalle, entonces ve cabecera, motivo, relación, ítems, línea de tiempo y comunicaciones; si una
  comunicación falló, ve su detalle y el aviso de "podría no haber recibido la notificación".
- **CA-4:** Dado un requerimiento `RESPONDED`, cuando marca "Insuficiente" sin nota, no se llama a la API; con nota, se
  envía `{ result: 'INSUFFICIENT', notes }` y el estado se actualiza; "Suficiente" envía solo `{ result }` si no hay
  nota. En otros estados esos botones no aparecen.
- **CA-5:** Dado un requerimiento abierto, cuando pulsa "Anular" sin motivo, no se envía; con motivo, queda anulado y
  sin acciones. Dado uno cerrado o anulado, no hay acciones.
- **CA-6:** Dado el detalle con un id inexistente o que no es UUID, entonces ve "No encontramos este
  requerimiento." (sin llamar a la API si no es UUID).

**Crear requerimiento**

- **CA-7:** Dado el diálogo desde el caso, cuando intenta enviar sin motivo, sin relación, sin ítems, con un ítem
  Documento sin tipo o con un ítem Campo sin ruta, entonces ve el error bajo el campo y no se llama a la API.
- **CA-8:** Dado un envío válido, entonces el cuerpo lleva el empresario del caso, sin claves vacías, y al crearse se
  abre su detalle.
- **CA-9:** Dado que la API responde el 400 de requerimiento idéntico, entonces ve el mensaje y "Abrir el
  requerimiento existente", que lleva a su detalle.
- **CA-10:** Dado "Abrir requerimiento" desde una alerta, entonces el diálogo trae el empresario y el tipo de la
  alerta y el envío lleva `alertId`; al crearse, la alerta aparece revisada con el enlace al requerimiento (según lo
  que devuelva la API).

**Hallazgos e incidencias**

- **CA-11:** Dada la clasificación "Error subsanable" o "Inconsistencia aislada", entonces solo "Sin medida" y
  "Advertencia" se pueden elegir y se ve la nota de RN-4; si había otra medida elegida, se vacía.
- **CA-12:** Dado un empresario sin negativa expresa en su historial, entonces "Negativa expresa" está deshabilitada
  con "No hay una negativa expresa registrada"; con una negativa expresa, se puede elegir.
- **CA-13:** Dada la medida "Restricción preventiva" o "Suspensión", cuando pulsa "Registrar", entonces se abre el
  diálogo rojo y "Confirmar" solo se habilita al escribir el nombre de la empresa; "Cancelar" no envía nada.
- **CA-14:** Dada "Remisión a terminación", entonces ve la nota de RN-7 y se envía sin diálogo rojo.
- **CA-15:** Dado un hallazgo guardado que cambió la cuenta, entonces ve "Estado de la cuenta aplicado: …" y el
  hallazgo aparece en la pestaña; si venía de un requerimiento, este se ve cerrado.
- **CA-16:** Dado el diálogo de hallazgo sin hecho, afectación, fundamento o respuesta a "¿Es subsanable?", entonces
  no se envía y ve el error bajo cada campo.
- **CA-17:** Dada la pestaña Incidencias, cuando registra una con contexto y descripción, entonces aparece en la
  lista; sin alguno de los dos, no se envía.

**Alertas, reglas y catálogo**

- **CA-18:** Dadas alertas, entonces "Solo pendientes" arranca activado; al apagarlo se ven también las revisadas;
  cada alerta muestra el `message` completo y "Evento del expediente" si no tiene regla.
- **CA-19:** Dado "Ver datos", entonces ve una tabla clave/valor con los montos en pesos; con un JSON ilegible, ve
  "No pudimos leer los datos de la alerta" sin romper la página.
- **CA-20:** Dado "Marcar revisada" sin nota, no se envía; con nota, la alerta pasa a revisada (y sale de la lista si
  "Solo pendientes" está activo).
- **CA-21:** Dadas reglas con varias versiones, entonces se ven agrupadas por código con la activa arriba y sus
  parámetros legibles (días, %, pesos).
- **CA-22:** Dado "Nueva regla", entonces los tres umbrales arrancan vacíos; un código inválido, ventana < 7, % <
  0,01 o ventas negativas bloquean el envío; con un código existente se ve "Se creará la versión N+1 y la actual se
  desactivará"; las ventas se envían en centavos.
- **CA-23:** Dado "Desactivar", entonces pide confirmación y, al confirmar, la regla queda inactiva.
- **CA-24:** Dado el catálogo, entonces hay una pestaña por tipo con su tabla e insignias; "Agregar código" exige
  fundamento y "Vigente desde"; "Retirar" exige "Vigente hasta" no anterior a "Vigente desde"; no hay editar ni
  borrar y se ve la nota de RN-10.

**Transversales**

- **CA-25:** Con otro rol o sin sesión y `MIDDLEWARE=ACTIVE`, las cinco rutas nuevas sacan al usuario;
  `routeProtection.test.ts` las clasifica sin tocar el middleware.
- **CA-26:** Todos los diálogos de acción evitan el doble envío, no se cierran mientras envían y muestran el `message`
  de un 400 conservando lo escrito.
- **CA-27:** Motivos, hechos, evidencias, notas y `dataUsedJson` no aparecen en la consola, la URL ni el almacenamiento.
- **CA-28:** `npm test`, `npm run lint:ci` (sin subir el tope), `npm run build`, `npx tsc --noEmit` y `npm run audit:ci`
  como antes o mejor, sin dependencias nuevas.

## Fuera de alcance

- Un listado general de comerciales en compliance, y crear un requerimiento desde la cola (no hay empresario fijo).
- Filtro por empresario en la cola de requerimientos (está en la pestaña del caso).
- Editar o borrar hallazgos, incidencias, reglas o códigos del catálogo.
- Pruebas de navegador (Playwright): compliance no está en `e2e/`; Vitest y comprobación manual.
- Documentación en Notion: se ofrece al cierre de la entrega D.

## Requisitos no funcionales

- **Solo escritorio (decisión del usuario, 2026-11-02):** el módulo de compliance se usa desde computador. No se diseña ni se comprueba para móvil; el objetivo es escritorio desde 1280 px. Los diálogos largos (crear requerimiento, hallazgo) tienen scroll interno para caber en la altura de la ventana.
- **Accesibilidad:** pestañas del catálogo con `tablist`/`tab`; filas enfocables con Enter; diálogos con foco atrapado
  (el de la 017); opciones deshabilitadas con su motivo visible como texto.
- **Volumen:** cola y alertas paginan con la API (20); reglas y catálogo llegan completos.
- **Estilo:** el de las pantallas de compliance (`ComplianceLayout`, colores `cmp-*`).

## Preguntas abiertas

- [x] Una spec o dos → una sola (2026-11-02).
- [x] Confirmación de medidas que cambian la cuenta → escribir el nombre de la empresa (2026-11-02).
