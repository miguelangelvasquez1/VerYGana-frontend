# 013 · Mascota a pantalla completa y Juegos en la barra del celular

- **Estado:** Implementada y aprobada en revisión (ronda 3, 2026-10-24). Pendiente: pasada en celulares (U-1, CA-10), PR y CI.
- **Fecha:** 2026-10-24
- **Ticket:** SCRUM-<por crear>
- **Origen:** Propia del front · pasada en celular después de la spec 012 (2026-10-24)

> El número `NNN` es propio del front y no tiene que coincidir con el de la API.

## Decisiones tomadas (2026-10-24)

- **Mascota en horizontal:** pantalla completa. En un celular en horizontal se ocultan la barra
  superior y la inferior de la app, y queda un botón flotante para salir. Esto **reemplaza la
  decisión D-7 de la spec 012** ("en `/pet` horizontal se mantienen las barras") y el riesgo R-8 de
  su plan, que preveía que el juego quedara en unos 230 px de alto.
- **Juegos en la barra inferior del celular:** "Juegos" entra en la barra inferior en el lugar de
  "Rifas". Rifas pasa al menú de Perfil del celular, donde hoy no está.
- **"Salir" de la mascota lleva a `/home`.**
- **`/games/play` en horizontal también va a pantalla completa**, con el mismo criterio que la
  mascota y su botón "Volver" de siempre, que lleva a `/games`.
- **Bug de `/ads` que entra en esta spec:** en el celular no se alcanza el botón "Me gusta" del
  final del anuncio. Lo reportó el usuario el 2026-10-24. Se arregla aquí, con su prueba que falla
  sin el arreglo (P-17). El usuario no precisó si el botón queda tapado/cortado o si no responde
  al toque, ni en qué orientación: la prueba de CA-12 cubre las dos causas y las dos orientaciones.

## Decisiones de la Puerta 2 (2026-10-24)

El usuario aprobó el plan con todas las recomendaciones de `plan.md`, de D-1 a D-7:

- **D-1:** la pantalla completa se resuelve con la variante CSS `immersive`, que usa `:has()`, y no
  con lógica en `NavBar` según la ruta.
- **D-2:** "Salir" y "Volver" van arriba a la izquierda, dentro del área segura. Se confirma en CA-10.
- **D-3:** no se activa `viewport-fit=cover`.
- **D-4:** el anuncio de prueba por defecto pasa a un WebM local de 10 s.
- **D-5:** se quitan los dos `console.log` de `VideoAdPlayer` (P-16).
- **D-6:** se guardan en el repositorio tres medios de prueba mínimos, en `e2e/fixtures/media/`.
- **D-7:** que `/games/play` recargue el juego al girar es previo a esta spec y queda fuera de ella.
  En CA-10, "el giro sin recarga" se comprueba solo en `/pet`.

## Problema

En un celular, la mascota (`/pet`) se ve muy chica. En horizontal, que es como se juega, las dos
barras de la app ocupan unos 128 px: la de arriba con el logo, el carrito y las notificaciones, y
la de abajo con la navegación. En un teléfono de 360 px de alto el juego queda en unos 230 px.

Además, en el celular no hay una forma visible de llegar a los juegos patrocinados (el botón
"¡Jugar ahora!" de `/games`). La barra inferior tiene Inicio, Anuncios, Rifas, Mascota, Productos y
Perfil. A `/games` solo se llega abriendo Perfil y buscando "Juegos" en la lista. Quien prueba la
app en el celular cree que los juegos no existen.

Por último, en `/ads`, al terminar un anuncio aparece el aviso "¡Anuncio completado!" con el botón
"Me gusta", que da la recompensa. En el celular el usuario no logra tocar ese botón, así que no
puede cobrar el anuncio.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Consumidor | `ROLE_CONSUMER` | Juega la mascota a pantalla completa en horizontal. Llega a Juegos desde la barra inferior. Llega a Rifas desde el menú de Perfil. |

En escritorio (≥ 1024 px, barra superior de escritorio) no cambia nada.

## Historias de usuario

- Como consumidor en el celular, quiero que la mascota ocupe toda la pantalla en horizontal para
  verla y jugarla bien.
- Como consumidor en el celular, quiero salir de la mascota sin tener que adivinar cómo.
- Como consumidor en el celular, quiero ver "Juegos" en la barra de abajo para encontrar los juegos
  patrocinados.

## Pantallas y flujo

Rutas existentes, ninguna nueva. No se toca el `matcher` del middleware ni `routeAccess.ts`.

### `/pet` en el celular

"Celular" aquí es el mismo criterio de la spec 012: ancho menor de 1024 px (donde se ven las barras
del celular) y puntero táctil. Una ventana angosta de escritorio no se comporta como celular.

1. **En vertical**, se ve igual que hoy: las dos barras y, encima del juego, el aviso "Gira tu
   teléfono". Desde aquí el usuario navega con la barra inferior como siempre.
2. **Al girar a horizontal**, desaparecen la barra superior y la inferior, y el marco del juego
   ocupa toda la pantalla: el alto y el ancho visibles, respetando el área segura del equipo (la
   muesca y la barra de gestos).
3. **En horizontal** hay un botón flotante "Salir" en una esquina, sobre el juego, con fondo
   semitransparente. No tapa el centro del juego y se puede tocar con el dedo (44 × 44 px).
4. **Al tocar "Salir"**, va a `/home`. **Al volver a vertical**,
   reaparecen las dos barras sin recargar la página.
5. **El juego no se recarga al girar.** Hoy el iframe de Unity sigue montado al rotar porque pesa
   unos 75 MB. Ocultar y mostrar las barras no lo puede desmontar ni recargar.

### Barra inferior del celular

- Queda así, en este orden: **Inicio, Anuncios, Juegos, Mascota, Productos, Perfil** (seis íconos,
  igual que hoy). "Juegos" toma el lugar de "Rifas".
- "Juegos" lleva a `/games`. Se marca como activo en `/games` y en sus subrutas.
- El ícono y el estilo son los de los demás elementos de la barra. Se usa el ícono de juegos que ya
  usan la barra de escritorio y el menú de Perfil.

### Menú de Perfil del celular

- Se agrega **"Rifas"** (`/raffles`). "Juegos" se queda en el menú, como hoy.

### `/games/play` en el celular

- En vertical no cambia: el juego ya ocupa toda la pantalla, girado.
- En horizontal se ocultan las dos barras y el juego ocupa toda la pantalla, con el botón "Volver"
  (a `/games`) visible y de 44 × 44 px. Hoy calcula su alto restando las barras: deja de hacerlo
  en horizontal.

### `/ads` en el celular: botón "Me gusta"

- Al terminar un anuncio, el aviso "¡Anuncio completado!" y su botón "Me gusta" se ven completos,
  dentro de la pantalla y por encima de la barra inferior, en vertical y en horizontal.
- Ningún otro elemento queda encima del botón: los botones "Visitar" y "Compartir" del celular no
  lo tapan ni le roban el toque.
- La página no queda más alta que la pantalla: el espacio de la barra inferior se reserva una sola
  vez.
- Diagnóstico inicial del coordinator (lo confirma la prueba, no se da por hecho): (1) en el celular,
  "Visitar" y "Compartir" van en una capa superior (`z-30`) a la del aviso (`z-20`), a la derecha y
  a media altura, y pueden quedar encima del botón; (2) el alto de la página resta la barra superior
  y además se reserva dos veces la inferior (el layout y la página), así que el contenido desborda
  la pantalla, y el contenedor tiene `touch-none`, que impide desplazarse arrastrando sobre el
  anuncio.

### Estados de pantalla

| Estado | Qué se muestra |
|--------|----------------|
| Cargando (`/pet`) | En horizontal, "Preparando tu mascota…" a pantalla completa, sin barras, con "Salir" visible. |
| Vacío | No aplica: la mascota siempre muestra el juego o un error. |
| Error (`/pet`) | En horizontal, el mensaje de error y "Reintentar" a pantalla completa, sin barras, con "Salir" visible. "Salir" no tapa "Reintentar". |
| Sin permiso | Igual que hoy: lo resuelven la API y el interceptor (401 → `/login`). |
| Éxito | Juego a pantalla completa en horizontal. Barra inferior con "Juegos". |

## Contrato con la API

No hay cambios. Se consumen los mismos endpoints que hoy (`POST /pet/session/init` para la
mascota). Sin dependencias de la API.

## Reglas de negocio

- **RN-1 · Pantalla completa solo en celular horizontal.** En `/pet`, con el celular en horizontal,
  no se ven la barra superior ni la inferior de la app. En vertical se ven las dos. En escritorio no
  cambia nada.
- **RN-2 · Sin recarga.** Girar el teléfono, en cualquier sentido y las veces que sea, no recarga ni
  reinicia el juego.
- **RN-3 · Salida siempre visible.** En horizontal, el botón "Salir" está visible en los tres
  estados (cargando, error y juego), mide al menos 44 × 44 px (D-5 de la spec 012) y queda dentro
  del área segura.
- **RN-4 · Sin barras de scroll.** En horizontal, ni la página ni el marco del juego tienen scroll
  (igual que RN-7 de la spec 012).
- **RN-5 · Barra inferior.** Seis elementos: Inicio, Anuncios, Juegos, Mascota, Productos y Perfil.
  Cada uno mide al menos 44 × 44 px a 360 px de ancho.
- **RN-6 · Rifas sigue accesible en el celular** desde el menú de Perfil, y desde los enlaces que ya
  tiene `/home`.
- **RN-7 · Lo demás de la spec 012 sigue valiendo.** El resto de vistas, el área táctil y el
  viewport no cambian.
- **RN-8 · `/games/play` horizontal.** Igual que RN-1, RN-3 y RN-4, con "Volver" en lugar de
  "Salir". En vertical no cambia.
- **RN-9 · "Me gusta" alcanzable.** En `/ads`, en un celular, el botón "Me gusta" del final del
  anuncio está completo dentro de la parte visible de la pantalla, sin nada encima, y responde al
  primer toque. Vale para video e imagen, en vertical y en horizontal.

## Criterios de aceptación

- **CA-1:** Dada `/pet` en un celular (360 × 740) en horizontal, cuando carga el juego, entonces no
  se ven la barra superior ni la inferior de la app, y el marco del juego mide lo mismo que la
  ventana visible, sin scroll.
- **CA-2:** Dada `/pet` en un celular en vertical, cuando carga, entonces se ven las dos barras y el
  aviso "Gira tu teléfono", igual que hoy.
- **CA-3:** Dada `/pet` en horizontal con el juego cargado, cuando el teléfono pasa a vertical y
  vuelve a horizontal, entonces el iframe del juego es el mismo (no se volvió a crear ni a cargar) y
  las barras aparecen y desaparecen según la orientación.
- **CA-4:** Dada `/pet` en horizontal, en cada estado (cargando, error y juego), entonces el botón
  "Salir" está visible, mide al menos 44 × 44 px y, al tocarlo, lleva a `/home`. En
  error, "Salir" no se superpone a "Reintentar".
- **CA-5:** Dada `/pet` en escritorio (1280 × 800), entonces se ve igual que hoy: la barra de
  escritorio y el juego en su marco, sin botón "Salir".
- **CA-6:** Dada cualquier página del consumidor en un celular (360 de ancho), entonces la barra
  inferior muestra, en orden, Inicio, Anuncios, Juegos, Mascota, Productos y Perfil, cada uno de al
  menos 44 × 44 px, y "Juegos" lleva a `/games`.
- **CA-7:** Dada `/games` en un celular, entonces "Juegos" se ve activo en la barra inferior.
- **CA-8:** Dado el menú de Perfil abierto en un celular, entonces aparece "Rifas" y al tocarlo
  lleva a `/raffles`.
- **CA-9:** Las puertas de la spec 012 siguen en verde con estos cambios: las pruebas de navegador
  existentes (ajustadas a la nueva barra y al nuevo comportamiento de `/pet`), las capturas de
  escritorio sin diferencias, `npm test`, `lint:ci` sin subir el tope, `build`, `tsc` y `audit:ci`.
- **CA-10:** Pasada manual en el Android y el iPhone reales: la mascota y `/games/play` a pantalla
  completa en horizontal, "Salir" y "Volver" visibles, el giro sin recarga, "Juegos" en la barra
  inferior hasta tocar "¡Jugar ahora!", y "Me gusta" en `/ads` al final de un anuncio, en vertical y
  en horizontal.
- **CA-11:** Dada `/games/play` en un celular en horizontal, entonces no se ven las barras de la
  app, el juego ocupa la ventana visible sin scroll, y "Volver" está visible, mide al menos
  44 × 44 px y lleva a `/games`. En vertical, se ve igual que hoy.
- **CA-12:** Dada `/ads` en un celular (360 × 740 en vertical y 740 × 360 en horizontal), cuando
  termina un anuncio (de video y de imagen), entonces el botón "Me gusta" está completo dentro de la
  parte visible de la pantalla y por encima de la barra inferior, el elemento que recibe un toque en
  su centro es el propio botón, y al tocarlo se llama al endpoint de "me gusta" que usa hoy. La
  página no tiene más alto que la pantalla. La prueba falla con el código de hoy.

## Fuera de alcance

- La pantalla completa del navegador (Fullscreen API) para ocultar también la barra de direcciones.
  En iPhone no funciona con un iframe. Se descartó por eso.
- Cambiar el contenido de `/games` o el juego patrocinado en sí.
- Las tabletas en horizontal (≥ 1024 px usan la barra de escritorio).
- Cambios en el build de Unity.
- Cambiar el flujo de "me gusta" o la recompensa de `/ads`: solo se arregla que el botón se alcance.

## Requisitos no funcionales

- Responsive: celulares de 360 a 932 px de ancho en horizontal; Android (Chrome) e iPhone (Safari).
- Accesibilidad: "Salir" tiene nombre accesible y se ve sobre el fondo oscuro del juego.
- Rendimiento: el cambio de orientación no provoca la recarga del iframe (RN-2).
- PII: no se toca. El iframe de la mascota sigue con su URL actual (deuda (e) de P-16, sin cambios).
- Sin dependencias nuevas.

## Preguntas abiertas

- [x] ¿A dónde lleva "Salir"? A `/home` (2026-10-24).
- [x] ¿También `/games/play` en horizontal? Sí (2026-10-24).

## Resultados de la pasada en celulares

Pasada manual de CA-10 (la llena el usuario, paso U-1). En cada celda escribe "Cumple" o el defecto
encontrado. Con la beta o con `next start` en la red local, la API levantada y una cuenta de consumidor
de pruebas.

| Comprobación | Android (modelo, Chrome N) | iPhone (modelo, iOS N) | Notas |
|--------------|----------------------------|------------------------|-------|
| `/pet` en horizontal: sin barras, juego de borde a borde | | | |
| "Salir" visible en cargando (modo avión al entrar) y lleva a `/home` | | | |
| "Salir" visible en error y lleva a `/home` | | | |
| "Salir" visible con el juego en marcha y lleva a `/home` | | | |
| Girar varias veces en `/pet` sin recarga (la mascota no reinicia; D-7: solo en `/pet`) | | | |
| `/pet` en vertical: barras y aviso de girar | | | |
| `/games/play` en horizontal: sin barras, "Volver" lleva a `/games` | | | |
| Barra inferior con Juegos resaltado hasta tocar "¡Jugar ahora!" | | | |
| Rifas desde el menú de Perfil | | | |
| `/ads`: "Me gusta" al final de un video, en vertical | | | |
| `/ads`: "Me gusta" al final de un video, en horizontal | | | |
| `/ads`: "Me gusta" al final de una imagen, en vertical | | | |
| `/ads`: "Me gusta" al final de una imagen, en horizontal | | | |
| "Salir" (`/pet`) no tapa botones del juego real (D-2, R-7) | | | |
| "Volver" (`/games/play`) no tapa botones del juego real (D-2, R-7) | | | |
