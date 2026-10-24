# 012 · Vistas del consumidor usables en celular

- **Estado:** Implementada y aprobada en revisión (ronda 3, 2026-10-24). Pendiente: PR y CI (U-2), pasada en celulares (U-3, CA-10) y check obligatorio en `main` (M-1).
- **Fecha:** 2026-10-23
- **Ticket:** SCRUM-<por crear>
- **Origen:** Propia del front · subida de requisitos mínimos (2026-10-23)

> El número `NNN` es propio del front y no tiene que coincidir con el de la API.

## Decisiones tomadas (2026-10-23)

- **Fila 1, "Participar ahora" del detalle de rifa:** se quita. El front no tiene un flujo para
  obtener tickets desde esa pantalla (en `raffleService` solo hay consultas y el reclamo del premio).
- **Filas 10 a 14:** "Contratar Plan" y "Recargar Ahora" quedan como "Próximamente". "Llamar
  Ahora", "Chat en Vivo" y los íconos de redes se ocultan mientras no haya teléfono, chat ni redes
  oficiales. `planRechargeService` es la recarga de billetera del comercial, no un plan de celular.
- **Landing (filas 2 a 9):** el visitante no sale de la landing hacia páginas que exigen sesión.
  Lo que necesita cuenta lleva a `/login` o `/register`, y "Ver Rifas Activas" baja a la sección
  `#rifas` de la misma página. **Los textos de los botones no cambian por ahora.**
- **Pruebas:** Playwright en el CI para el viewport, el área táctil y `/pet` (CA-1, CA-2 y CA-7).
  CA-3 y CA-4 se prueban con Vitest sobre el código. La dependencia nueva se aprueba en la
  Puerta 2 (P-1).
- **Dispositivos:** hay un Android y un iPhone reales. Antes del cierre se hace una pasada manual
  en los dos.

## Decisiones de la Puerta 2 (2026-10-23)

El usuario aprobó el plan con todas las recomendaciones de `plan.md`, de D-1 a D-13:

- **D-1 y D-2:** se agrega `@playwright/test` 1.64.1 como dependencia de desarrollo. Corre en un
  cuarto check del CI, "Pruebas en navegador", y Miguel tiene que agregarlo a la protección de `main`.
- **D-3:** se enmiendan P-13 y `CLAUDE.md` para admitir las pruebas de navegador en `e2e/`, con
  red solo local.
- **D-4:** las capturas de escritorio de CA-8 se hacen solo en local.
- **D-5:** ninguna excepción al mínimo de 44 px.
- **D-6:** la letra de 16 px en los campos se ajusta componente por componente.
- **D-7:** en `/pet` horizontal se mantienen las barras de la app.
- **Botones nuevos:**
  - D-8: "Empezar a Referir" lleva a `/register`.
  - D-9: se oculta la tarjeta de App Store / Google Play.
  - D-10: "Mis compras" lleva a `/explore/purchases`.
  - D-11: se ocultan "Privacidad" y "Ayuda" del login.
  - D-12: en las páginas sin sesión, el pie oculta los enlaces que piden sesión, y el teléfono se
    quita en todas.
  - D-13: las páginas que no se alcanzan en celular se agregan al menú de perfil del celular.
- **Bug encontrado en el Bloque 0 (decidido el 2026-10-23: se arregla aquí, en T19):**
  `purchases/[id]/confirmation` lee `useParams().purchaseId`, pero el segmento de la ruta se llama
  `id`. Por eso la página siempre muestra "ID de compra inválido". El arreglo trae su prueba que
  falla sin él (P-17).
- **Bug encontrado en la Ronda 1 de revisión (se arregla aquí, porque sin el arreglo no se
  cumplen CA-3, D-10 ni D-13):** en el celular, ningún enlace del menú de perfil navegaba.
  El evento global de "clic fuera" cerraba la hoja antes del clic, porque solo se tenía en cuenta
  el menú de escritorio. Se arregla en `NavBar.tsx` con su prueba (N-3 en `e2e/rn4.spec.ts`), que
  falla sin el arreglo (P-17).
- **CA-11:** Dada una compra recién hecha, cuando se abre `/purchases/<id>/confirmation`, entonces
  la página pide esa compra a la API y la muestra; no aparece "ID de compra inválido".

## Problema

Los requisitos mínimos subieron: el consumidor usa verYganar desde el celular y las vistas que
ve tienen que funcionar ahí. Hoy no es así de forma pareja.

- **Responsive desigual.** De 66 archivos de páginas y componentes del consumidor, 43 usan
  breakpoints (`sm:`, `md:`, `lg:`) y el resto no. Nadie probó cada pantalla en un celular chico.
- **Botones que no hacen nada.** El usuario los toca y no pasa nada. Algunos son la acción
  principal de la pantalla, como "Participar ahora" en el detalle de la rifa.
- **Sin entrada a la sesión en celular.** En la barra sin sesión, "Iniciar sesión" está oculto en
  pantallas chicas (`hidden md:block`) y solo queda "Crear cuenta". Quien ya tiene cuenta no
  encuentra cómo entrar desde la landing.
- **Botones dentro de enlaces.** Muchos botones van metidos dentro de un `<Link>`. Funcionan, pero
  es HTML inválido y lectores de pantalla y teclado lo tratan mal.
- **Mascotas.** La vista de mascotas (`/pet`) es el juego de Unity en un iframe, con un aviso de
  "Gira tu teléfono" en vertical. Hay que comprobar que el marco, el aviso y los estados de carga
  y error funcionan en celular.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Consumidor | `ROLE_CONSUMER` | Todas las vistas del grupo `(consumer)`, desde el celular. |
| Visitante | sin sesión | Landing, inicio de sesión, registro y verificación, desde el celular. |
| Comercial, administrador, diseñador | `ROLE_COMMERCIAL`, `ROLE_ADMIN`, `ROLE_GAME_DESIGNER` | Sin cambios: sus vistas se usan en computador (ver RN-6). |

## Historias de usuario

- Como consumidor, quiero usar todas las pantallas desde mi celular sin hacer zoom ni deslizar de
  lado, para jugar, participar en rifas y comprar donde esté.
- Como consumidor, quiero que cada botón que veo haga algo, para no pensar que la app está rota.
- Como visitante con cuenta, quiero encontrar "Iniciar sesión" desde el celular.

## Pantallas y flujo

Alcance, aprobado el 2026-10-23:

- **Las 26 páginas del grupo `(consumer)`:**
  - `ads`, `checkout`, `commercial/[id]`, `forum`, `home`, `pet`, `support`, `surveys`.
  - `explore/` (`favorites`, `gamification`, `participations`, `profile`, `profile/edit`,
    `purchases`, `referrals`, `transactions`).
  - `games` y `games/play`.
  - `plans/mobile-plans`.
  - `products` y `products/[id]`.
  - `purchases/[id]/confirmation`.
  - `raffles`, `raffles/[id]`, `raffles/[id]/live` y `raffles/[id]/results`.
- **Además:** la landing (`/`), `/login`, `/register` y `/verify`.
- **Barras, pie y componentes compartidos que aparecen en esas páginas.**
- **Fuera:** `/plans` (fuera del grupo `(consumer)`), las vistas de comercial, admin y diseñador,
  y la interfaz dentro del juego de Unity.
- No se crean rutas nuevas.

### Estados de pantalla

En cada página del alcance, a 360 px:

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | El indicador cabe en pantalla y no mueve el contenido al terminar. |
| Vacío | El mensaje y su acción caben en pantalla y la acción funciona. |
| Error (red, 5xx) | Mensaje legible, sin desbordar, con reintento si la pantalla ya lo tiene. |
| Sin permiso (401, 403, rol equivocado) | Igual que hoy (lo trata la spec 011). |
| Éxito | Sin scroll horizontal, sin texto cortado y con los botones al alcance del dedo. |

## Contrato con la API

No cambia nada en la API. Si un botón de la lista de RN-4 se decide "conectar" y necesita un
endpoint que no existe, se marca como **dependencia de la API** y se pide en una spec allá.

## Reglas de negocio

- RN-1: **Ancho mínimo de 360 px.** Toda página del alcance se ve y se usa completa desde 360 px
  de ancho, en vertical: sin scroll horizontal, sin texto ni botones cortados o encimados.
  También se prueba a 390 px (iPhone actual) y a 768 px (tablet), y el escritorio no se rompe.
- RN-2: **Táctil.** Todo elemento que se toca mide al menos 44 × 44 px y está separado de sus
  vecinos lo suficiente para no tocar dos a la vez. Nada depende del `hover` para mostrarse o
  funcionar.
- RN-3: **Formularios en celular.** Cada campo usa el teclado que le corresponde (numérico para
  teléfono y cédula, correo para correo). El campo enfocado queda visible encima del teclado. Los
  textos tienen al menos 16 px para que iOS no haga zoom al enfocar.
- RN-4: **Ningún botón muerto.** Cada botón o enlace sin acción del alcance termina en uno de tres
  destinos, decididos uno por uno en la tabla de abajo:
  - **Conectar:** hace lo que promete.
  - **Ocultar:** se quita.
  - **Próximamente:** se ve deshabilitado, con ese texto, y no parece tocable.
- RN-5: **Botones y enlaces bien formados.** Navegar es un enlace y una acción es un botón;
  nunca un botón dentro de un enlace. Al tocar, cambia de estado visible.
- RN-6: **Las vistas de otros roles no se tocan.** Comercial, admin y diseñador se usan en
  computador: no se invierte en su responsive y tampoco se quita el que tienen. Quitarlo no
  ahorra recursos, porque Tailwind solo incluye las clases que se usan.
- RN-7: **Mascotas.** En `/pet` el marco del juego ocupa la pantalla disponible sin barras de
  scroll. En vertical se ve el aviso de girar el teléfono, y en horizontal se ve el juego. Los
  estados de carga y error se leen a 360 px. El tamaño del juego dentro del iframe lo decide el
  build de Unity: si falla ahí, se reporta a quien mantiene los builds.
- RN-8: **Rendimiento en celular.** Las imágenes del alcance cargan al tamaño de la pantalla
  (`next/image` o `srcset`), no al de escritorio. Ninguna página del alcance pesa más que hoy
  (First Load JS de `next build`, comparado con `baseline.md`). La única excepción es el código de
  `next/image` (unos 6 kB) en las páginas que pasan a usarlo por esta misma regla. Cualquier otra
  subida se explica o se corrige. (Precisado con el usuario el 2026-10-24.)

### Botones y enlaces sin acción encontrados (decididos el 2026-10-23)

Búsqueda del 2026-10-23: botones sin `onClick` ni `type="submit"` y enlaces a `#`. Los que están
dentro de un `<Link>` sí navegan y van a RN-5, no a esta tabla. Antes del plan se completa la
búsqueda pantalla por pantalla en el celular: puede haber más, como botones con un `onClick`
vacío. Un botón muerto que aparezca en esa búsqueda y no esté en la tabla se decide con el usuario
antes de tocarlo (no se le asigna destino por defecto).

| # | Dónde | Texto | Decisión |
|---|-------|-------|----------|
| 1 | Detalle de rifa (`RaffleDetail`) | "Participar ahora" | **Ocultar** (se quita) |
| 2 | Landing, portada | "Empezar Ahora" | Conectar a `/register` |
| 3 | Landing, portada | "Ver Rifas Activas" | Conectar a la sección `#rifas` de la landing |
| 4 | Landing, rifas | "Participar Ahora" | Conectar a `/login` |
| 5 | Landing, rifas | "Ver Todas las Rifas" | Conectar a `/login` |
| 6 | Landing, tienda | "Agregar al Carrito" | Conectar a `/login` |
| 7 | Landing, tienda | "Ver Toda la Tienda" | Conectar a `/login` |
| 8 | Landing, cierre | "Crear Cuenta Gratis" | Conectar a `/register` |
| 9 | Landing, cierre | "Descargar App" | **Ocultar** mientras no haya app publicada |
| 10 | Planes móviles | "Llamar Ahora" | **Ocultar** (no hay número oficial) |
| 11 | Planes móviles | "Chat en Vivo" | **Ocultar** (no hay chat) |
| 12 | Planes móviles (`PlanCard`) | "Contratar Plan" | **Próximamente** |
| 13 | Planes móviles (`RechargeCard`) | "Recargar Ahora" | **Próximamente** |
| 14 | Lateral de anuncios (`Sidebar`) | Tres íconos de redes con enlace a `#` | **Ocultar** (no hay redes oficiales) |
| 15 | Barra sin sesión | "Iniciar sesión", oculto en celular | Mostrar en celular (no es un botón muerto, pero falta en el flujo) |

Los textos de los botones de la landing no cambian (decisión del 2026-10-23).

## Criterios de aceptación

- **CA-1:** Dada cada página del alcance con datos de prueba, cuando se abre a 360 px, a 390 px y
  a 768 px, entonces no hay scroll horizontal (el ancho del documento no pasa el del viewport).
  Queda una prueba automática por página que falla si aparece el desborde.
- **CA-2:** Dada cada página del alcance a 360 px, cuando se mide cada elemento interactivo
  visible, entonces todos miden al menos 44 × 44 px o tienen esa área táctil.
- **CA-3:** Dada la tabla de RN-4 aprobada, cuando se toca cada elemento, entonces hace lo que su
  fila dice. Una prueba automática falla si en el alcance aparece un `<button>` sin acción, sin
  `type="submit"` y sin estar deshabilitado, o un enlace a `#`.
- **CA-4:** Dado el alcance, cuando se busca un `<button>` dentro de un `<a>` o de un `<Link>`,
  entonces no hay ninguno. Hay prueba o regla de lint.
- **CA-5:** Dada la landing en un celular sin sesión, cuando se busca cómo entrar, entonces
  "Iniciar sesión" está visible sin abrir menús ocultos.
- **CA-6:** Dados los formularios de login, registro, verificación, perfil, checkout y soporte a
  360 px, cuando se enfoca un campo, entonces aparece el teclado que corresponde, la página no
  hace zoom y el campo queda visible.
- **CA-7:** Dada `/pet` en un celular, cuando está en vertical, entonces se ve el aviso de girar.
  Cuando está en horizontal, el juego ocupa la pantalla sin barras de scroll. Cargando y error se
  leen completos.
- **CA-8:** Dadas las vistas de comercial, admin y diseñador, cuando se compara con `main`,
  entonces no cambiaron (salvo componentes compartidos, que siguen viéndose igual en escritorio).
- **CA-9:** Dado el CI, cuando corre, entonces las pruebas automáticas de CA-1, CA-2, CA-3, CA-4 y CA-7
  corren en él, dentro del límite de 10 minutos por job, y
  el tope de avisos de lint no sube.
- **CA-10:** Dada la implementación terminada, cuando se recorre el alcance en un Android y un
  iPhone reales siguiendo una lista de comprobación, entonces cada página cumple RN-1 a RN-3 y
  RN-7. El resultado de cada página queda anotado en la spec.

## Fuera de alcance

- Las vistas de comercial, admin y diseñador (RN-6), y `/plans`.
- La interfaz dentro del juego de Unity (mascotas y juegos de marca).
- Rediseño visual, colores, logos o textos, salvo lo necesario para que quepa.
- Modo oscuro y app nativa.
- La protección de las páginas de consumidor en el middleware (spec 011, RN-5).

## Requisitos no funcionales

- **Navegadores:** Chrome para Android y Safari para iOS, en las dos últimas versiones mayores.
- **Accesibilidad básica:** contraste legible, foco visible y botones con texto o `aria-label`.
- **PII:** sin cambios. No se agregan datos personales a URLs ni a `localStorage` (P-16).
- **Pruebas:** las de viewport necesitan un navegador real (Playwright o similar). Sería una
  dependencia nueva del front: el plan la justifica según la constitución del front.

## Preguntas abiertas

- [x] Tabla de RN-4: decidida fila por fila (ver "Decisiones tomadas").
- [x] Teléfono, chat y redes oficiales: no hay; las filas 10, 11 y 14 se ocultan.
- [x] Pruebas de navegador: Playwright en el CI. La dependencia se aprueba en la Puerta 2.
- [x] Celulares reales: hay un Android y un iPhone, y se usan en una pasada manual antes del cierre.

## Resultados de la pasada en celulares

Pasada manual del paso U-3 (CA-10). Se hace en el Android y en el iPhone reales, con la beta o con
`next start` en la red local y la API levantada, con una cuenta de consumidor de pruebas. Por cada
página, en vertical (y en horizontal en `/pet` y `/games/play`):

1. **RN-1:** no hay scroll de lado; ningún texto ni botón cortado o encimado; cargando, vacío y error
   (si se pueden provocar) caben.
2. **RN-2:** cada botón y enlace se toca con el pulgar sin pegarle al vecino; nada necesita `hover`
   (menús, tooltips, botones que solo aparecen al pasar el ratón); al tocar, cambia de estado.
3. **RN-3** (login, registro, verificación, perfil, checkout, soporte y el reclamo de premio): el
   teclado que aparece es el del campo (correo, numérico, teléfono); la página no hace zoom al
   enfocar; el campo enfocado queda visible encima del teclado; se puede enviar.
4. **RN-4:** las filas de la tabla y los N-n decididos hacen lo que dicen.
5. **RN-7 (`/pet`):** en vertical, el aviso de girar; en horizontal, el juego sin barras de scroll;
   "Preparando tu mascota…" y el error (modo avión) se leen completos.
6. Barra inferior y menú de perfil: se llega a cada página del alcance (según N-6).

Se anota "Cumple" o el defecto encontrado. Un defecto vuelve como tarea nueva antes del cierre.

| Página | Android (modelo, Chrome N) | iPhone (modelo, iOS N) | Notas |
|--------|----------------------------|------------------------|-------|
| Equipo | | | |
| `/` | | | |
| `/login` | | | |
| `/register` | | | |
| `/verify` | | | |
| `/ads` | | | |
| `/checkout` | | | |
| `/commercial/[id]` | | | |
| `/forum` | | | |
| `/home` | | | |
| `/pet` | | | |
| `/support` | | | |
| `/surveys` | | | |
| `/explore/favorites` | | | |
| `/explore/gamification` | | | |
| `/explore/participations` | | | |
| `/explore/profile` | | | |
| `/explore/profile/edit` | | | |
| `/explore/purchases` | | | |
| `/explore/referrals` | | | |
| `/explore/transactions` | | | |
| `/games` | | | |
| `/games/play` | | | |
| `/plans/mobile-plans` | | | |
| `/products` | | | |
| `/products/[id]` | | | |
| `/purchases/[id]/confirmation` | | | |
| `/raffles` | | | |
| `/raffles/[id]` | | | |
| `/raffles/[id]/live` | | | |
| `/raffles/[id]/results` | | | |
