# 001 · Origen del juego de mascotas por ambiente

- **Estado:** Aprobada
- **Fecha:** 2026-10-17
- **Ticket:** SCRUM-105
- **Origen:** API · specs/006-beta-deployment · SCRUM-77

> El número `NNN` es propio del front y no tiene que coincidir con el de la API. Esta spec llegó
> en `Borrador` desde el despliegue de la beta (T16 y bloque 5b de la spec 006 de la API) y se
> completó con quien trabaja el front el 2026-10-17.

## Problema

En `https://beta.verygana.com`, el juego de mascotas carga el build del bucket de **dev**, que
está configurado para hablar con `http://localhost:8080`. En beta el juego no llega a la API: no
carga el catálogo de la API de beta, no guarda el progreso ni las compras, y en el navegador
aparecen errores de red o el genérico "Unknown Error | HTTP: 500" de Unity (la petición nunca
sale).

Ya existe un build para beta, publicado en `https://mascotas-beta.verygana.com` (bucket
`verygana-pets-beta`) y apuntando a `https://api-beta.verygana.com`. El front no puede usarlo
porque el destino de `/pet-game` y `/pet-assets` está escrito fijo en `next.config.ts`, y
cambiarlo ahí rompería dev: el equipo usa el build de dev contra su API local en el 8080.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Consumidor | `ROLE_CONSUMER` | Abre el juego de mascotas, compra ítems y espera que el progreso se guarde. |
| Diseñador de juegos | `ROLE_GAME_DESIGNER` | Abre la vista previa de una escena (`ScenePreviewModal`), que carga el mismo build. |
| Desarrollador del equipo | — | Corre el front en local con el build de dev contra su API en el 8080. |
| Quien despliega la beta | — | Construye la imagen del front con los valores de beta. |

## Historias de usuario

- Como consumidor de la beta, quiero que el juego de mascotas guarde mi progreso y mis compras
  para no perderlos al recargar.
- Como desarrollador, quiero seguir usando el build de dev en local sin configurar nada nuevo.
- Como quien despliega, quiero elegir qué build de mascotas usa una imagen al construirla, sin
  tocar el código, y que la construcción me avise si se me olvida.

## Pantallas y flujo

- Rutas afectadas: `/pet-game/*` (el build) y `/pet-assets/*` (assets de escena). No cambian de
  nombre ni de rol; solo cambia el origen al que el front las reenvía.
- No hay rutas nuevas: no cambia el `matcher` de `src/middleware.ts` ni `routeAccess.ts`.
- `NEXT_PUBLIC_PET_GAME_URL` (la URL del `index.html` que cargan `usePetSession.ts` y
  `ScenePreviewModal.tsx`) no cambia: sigue apuntando a `/pet-game/…` del propio front.

### Estados de pantalla

No aplica: no hay pantallas ni componentes nuevos. Lo visible es el juego de mascotas que ya
existe.

## Contrato con la API

No cambia. El juego habla con la API usando la `baseUrl` de su propio
`StreamingAssets/network_config.json` (en el build de beta, `https://api-beta.verygana.com`).

**Dependencia de la API (configuración, no código):** `PETS_ASSET_BASE_URL` de beta tiene que
ser `https://beta.verygana.com/pet-assets` en Infisical para que los assets de escena pasen por
este front. Lo ajusta el equipo de la API; sin eso no se cumple CA-3.

## Reglas de negocio

- RN-1: El origen del build de mascotas se elige **al construir** el front con la variable
  `NEXT_PUBLIC_PET_GAME_ORIGIN`. Es una dirección pública, no un secreto (P-3); lleva el prefijo
  `NEXT_PUBLIC_` para poder entrar como argumento de build sin apartarse de P-20.
- RN-2: Sin la variable, fuera de Docker (`npm run dev`, `next build` en local o en el CI), el
  comportamiento es exactamente el de hoy: el bucket de dev. Nadie del equipo tiene que cambiar
  nada para seguir trabajando en local.
- RN-3: `/pet-game` y `/pet-assets` siempre van al mismo origen.
- RN-4: En la imagen Docker la variable es **obligatoria**: el `Dockerfile` falla antes del
  build si falta, con un mensaje que la nombra, igual que con las otras `NEXT_PUBLIC_*`.
- RN-5: Si la variable está definida pero su valor no es un origen `https://` (solo esquema y
  host), la construcción falla con un mensaje claro en español que nombra la variable, en vez
  de generar reescrituras rotas o caer a dev en silencio. Es inválido: vacía o solo espacios,
  sin esquema, con `http://`, o con ruta, query, `#` o credenciales. Solo la variable
  **ausente** usa dev (RN-2). Los espacios alrededor de un valor válido se recortan.
- RN-6: La imagen de beta se construye con `https://mascotas-beta.verygana.com`. El comando de
  construcción documentado (comentario del `Dockerfile`) y la tabla de variables de `CLAUDE.md`
  incluyen la variable nueva. `up-front.sh` no se versiona en esta spec (frente G de la
  spec 010).

## Criterios de aceptación

- **CA-1:** Dado el front sin `NEXT_PUBLIC_PET_GAME_ORIGIN`, cuando se construye, entonces
  `/pet-game/:path*` y `/pet-assets/:path*` se reescriben al bucket de dev, igual que hoy.
- **CA-2:** Dado el front construido con `NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com`,
  cuando se pide `/pet-game/StreamingAssets/network_config.json`, entonces se sirve el del
  bucket de beta, cuya `baseUrl` es `https://api-beta.verygana.com`.
- **CA-3:** Dada esa misma construcción, cuando se pide un asset por `/pet-assets/…`, entonces
  sale del bucket de beta (mismo origen que `/pet-game`, RN-3).
- **CA-4:** Dada la imagen de beta desplegada (y la dependencia de la API resuelta), cuando un
  consumidor compra un ítem en el juego de mascotas y recarga la página, entonces la compra y el
  progreso siguen ahí. *Verificación manual en beta.*
- **CA-5:** Dado un origen con barra final (`https://mascotas-beta.verygana.com/`), cuando se
  construye, entonces los destinos son los mismos que sin ella (no aparece `//` en la ruta).
- **CA-6:** Dado un valor inválido (vacío, solo espacios, sin esquema, con `http://`, o con
  ruta, query, `#` o credenciales), cuando se construye, entonces la construcción falla con un
  mensaje en español que nombra `NEXT_PUBLIC_PET_GAME_ORIGIN`.
- **CA-7:** Dado `docker build` sin `--build-arg NEXT_PUBLIC_PET_GAME_ORIGIN`, cuando se
  construye la imagen, entonces falla antes de `npm run build` con un mensaje que nombra la
  variable.
- **CA-8:** La imagen no recibe secretos nuevos: el único argumento nuevo es
  `NEXT_PUBLIC_PET_GAME_ORIGIN`, una dirección pública (P-3, P-20).
- **CA-9:** Las tres puertas de CI siguen en verde sin definir la variable nueva en `ci.yml`
  (RN-2).

## Fuera de alcance

- Publicar o cambiar el build de mascotas (ya publicado en `verygana-pets-beta`).
- Cambios de la API (`PETS_ASSET_BASE_URL` se ajusta en Infisical, no aquí).
- El origen de los juegos de marca (`games-beta.verygana.com`), que sale de la API.
- Versionar o automatizar `up-front.sh` y la construcción de la imagen (frente G de la spec 010).
- Llevar el cambio a la rama `beta-front`: la spec se trabaja en `spec-010-quality-gates` y el
  paso a `beta-front` lo hace el usuario con git.

## Requisitos no funcionales

- Con `output: 'standalone'`, las reescrituras quedan fijas en `next build`: la variable tiene
  que existir durante la construcción, no al arrancar el contenedor.
- La lógica que arma los destinos se puede probar en Vitest con entorno `node`, sin red (P-13).
- PII: ninguna. La variable es una dirección pública.

## Preguntas abiertas

Ninguna. Decisiones del 2026-10-17:

- [x] Nombre de la variable: `NEXT_PUBLIC_PET_GAME_ORIGIN` (cumple P-20 sin enmendarla).
- [x] En el `Dockerfile` es obligatoria; fuera de Docker se usa dev por defecto.
- [x] `up-front.sh` no se versiona; basta con documentar el argumento.
- [x] Rama: `spec-010-quality-gates`.
- [x] RN-5 (valor inválido hace fallar el build) confirmada por el usuario. Spec aprobada en la Puerta 1 el 2026-10-17.
- [x] Puerta 2 (2026-10-17): RN-5 y CA-6 precisados con D-1 (vacía = inválida; solo ausente usa dev) y D-2 (solo origen) del plan; D-3 autoriza editar `CLAUDE.md`.
