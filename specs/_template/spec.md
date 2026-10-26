# <NNN> · <Nombre de la funcionalidad>

- **Estado:** Borrador | Aprobada | Implementada
- **Fecha:** AAAA-MM-DD
- **Ticket:** SCRUM-<n>
- **Origen:** Propia del front | API · specs/<NNN>-<slug> · SCRUM-<n>

> El número `NNN` es propio del front y no tiene que coincidir con el de la API. Si la spec
> llegó desde el flujo de la API, llega en `Borrador`: quien trabaje el front la revisa, la
> completa y la aprueba antes de planificarla.

## Problema

Qué le pasa hoy a quién y por qué importa, visto desde la pantalla. Sin hablar de la solución
técnica.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| | `ROLE_…` | |

## Historias de usuario

- Como <actor>, quiero <acción> para <beneficio>.

## Pantallas y flujo

- Rutas afectadas (nuevas o existentes), desde dónde se llega y a dónde se va.
- Si la ruta es nueva y exige un rol: dilo aquí. Obliga a actualizar el `matcher` de
  `src/middleware.ts` y la tabla de `__tests__/middleware/routeAccess.ts`.

### Estados de pantalla

Para cada pantalla o componente nuevo, qué ve el usuario en cada estado (marca "No aplica" y el
motivo si alguno no existe):

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | |
| Vacío | |
| Error (red, 5xx) | |
| Sin permiso (401, 403, rol equivocado) | |
| Éxito | |

## Contrato con la API

Lo que el front consume. Si algo no existe todavía en la API, márcalo como **dependencia de la
API**; no lo supongas.

| Endpoint | Método | Rol | Entrada (DTO) | Salida (DTO) | Errores y qué ve el usuario |
|----------|--------|-----|---------------|--------------|-----------------------------|
| | | `ROLE_…` | | | |

- Los 401, 402, 503 y el 400 de cambio de plan los trata el interceptor global de
  `src/lib/api/client.ts`: indica solo lo que la pantalla hace distinto.
- Ejemplos con datos ficticios: ningún correo, cédula, teléfono ni token reales.

## Reglas de negocio

- RN-1: …
- Validaciones del formulario, límites, textos de error en español, qué pasa al reenviar.

## Criterios de aceptación

- **CA-1:** Dado <contexto>, cuando <acción>, entonces <resultado observable>.
- **CA-2:** Dado …, cuando falla <la API o una validación>, entonces …

## Fuera de alcance

- …

## Requisitos no funcionales

- Responsive, accesibilidad básica, volumen de datos (paginación o scroll infinito), PII
  involucrada y dónde no debe aparecer (logs de consola, URLs, `localStorage`).

## Preguntas abiertas

- [ ] …
