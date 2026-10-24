# 011 · Deuda de seguridad y datos personales encontrada en la revisión del front

- **Estado:** Borrador
- **Fecha:** 2026-10-23
- **Ticket:** SCRUM-<por crear> (épica SCRUM-14)
- **Origen:** Propia del front · sale de la revisión de la spec 010 (ronda 3, 2026-10-12)

> El número `NNN` es propio del front y no tiene que coincidir con el de la API. Esta spec reúne
> lo que la revisión de la spec 010 encontró en `src/` y dejó fuera de su primera entrega. Es un
> repo público: aquí va el **qué** y el **por qué**; el detalle archivo por archivo va en el plan.
> Varios puntos piden un cambio coordinado con la API: quedan marcados como **dependencia de la
> API** y no se suponen hechos.

## Problema

La revisión del front encontró cinco familias de problemas que hoy no rompen nada visible, pero
que exponen datos del usuario o permiten saltarse controles del front:

1. **Sesión del front sin verificar.** El front acepta el token de la API sin comprobar su
   firma. Cualquiera puede fabricar una sesión del front con el rol que quiera y entrar a
   pantallas de otros roles (vacías, porque los datos los protege la API) y a la descarga por
   proxy, que solo exige sesión.
2. **Contenido ajeno bajo el dominio propio.** La pantalla de juego carga en un iframe la URL
   que llegue en la dirección, sin comprobar que sea de un host de juegos propio, y acepta
   mensajes del iframe sin comprobar su origen. Leído en el código, sin probar contra un servidor.
3. **Credenciales y datos personales en URLs.** El token de acceso, las credenciales de partida
   (de juegos y de mascotas), el correo, el teléfono y la cédula viajan en la dirección de
   peticiones o páginas. Quedan en el historial del navegador, en la cabecera `Referer` y en los
   logs de acceso de la API, del proxy y del CDN. Incumple P-16 de la constitución del front y
   el principio 5 de la de la API.
4. **Datos sensibles en la consola y en logs.** Hay un token y una URL firmada de subida en
   `console.log`, unas 120 llamadas a `console.*` sin revisar (alguna puede volcar la cabecera
   `Authorization`), y el middleware registra ruta y rol en cada petición.
5. **Rutas sin protección y otros cabos sueltos.**
   - 25 páginas de consumidor y `/plans` no pasan por el middleware.
   - `/commercial/[id]`, que es una página del consumidor, le exige rol comercial.
   - La ruta `/unauthorized` a la que se redirige no existe.
   - Una página de servidor pide datos a la API sin tiempo límite.
   - Hay valores por defecto `http://localhost:8080` en código que corre en producción.
   - Las excepciones de auditoría de `xlsx` y `postcss` vencen el 2026-11-30, y ese día el CI se
     pone en rojo si nadie las revisa.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Consumidor | `ROLE_CONSUMER` | Juega, ve mascotas, rifas, compras y su perfil. Es el más expuesto: sus datos y credenciales de partida van en URLs. |
| Comercial | `ROLE_COMMERCIAL` | Paneles de campañas, productos y mascotas. |
| Administrador | `ROLE_ADMIN` | Paneles de administración; hoy alcanzables con una sesión falsificada (sin datos). |
| Diseñador | `ROLE_GAME_DESIGNER` | Descarga recursos por proxy con URL firmada. |
| Visitante | sin sesión | Puede abrir la pantalla de juego con cualquier URL y fabricar una sesión del front. |

## Historias de usuario

- Como consumidor, quiero que mis datos personales y mis credenciales no queden en el historial
  ni en logs de terceros, para que nadie pueda reutilizarlos.
- Como equipo, queremos que una sesión del front solo exista si la API la emitió, para que las
  pantallas por rol sean una protección real y no solo de presentación.
- Como equipo, queremos que la pantalla de juego solo muestre juegos de nuestros hosts, para que
  nadie use nuestro dominio para mostrar contenido ajeno.

## Pantallas y flujo

- Afectadas: inicio de sesión, registro, verificación de correo, desbloqueo de cuenta, juegos
  (`/games`, `/games/play`), mascotas (`/pet`), rifas (resultados, ganador y en vivo), compras,
  notificaciones en tiempo real, imágenes con autenticación, recursos del diseñador, productos
  del administrador.
- Nuevas: `/unauthorized` (o la ruta que se decida) para el rol equivocado.
- Las 25 páginas de consumidor que entren al middleware obligan a actualizar el `matcher` de
  `src/middleware.ts` y la tabla de `__tests__/middleware/routeAccess.ts` (`UNPROTECTED_PENDING`
  debe quedar vacía o con su motivo).

### Estados de pantalla

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Igual que hoy. |
| Vacío | No aplica. |
| Error (red, 5xx) | La página de rifa en vivo muestra un error legible si la API no responde a tiempo, en vez de quedar colgada. |
| Sin permiso (401, 403, rol equivocado) | Sesión inválida o falsificada: se cierra y se va al inicio de sesión. Rol equivocado: `/unauthorized` con un mensaje en español y un enlace a su inicio. |
| Éxito | Igual que hoy, sin datos personales en la barra de direcciones. |

## Contrato con la API

| Cambio | Dependencia de la API | Qué pide |
|--------|-----------------------|----------|
| Token de acceso fuera de la URL (imágenes autenticadas, flujo de notificaciones, descargas del admin) | **Sí** | Cookie httpOnly o ticket de un solo uso y corta duración para las peticiones que no pueden llevar cabecera (`<img>`, `EventSource`). |
| Credenciales de partida fuera de la URL (juegos y mascotas) | **Sí, y de los builds de Unity** | Un ticket de partida de un solo uso que el juego canjee, o pasar las credenciales por `postMessage` con origen comprobado. Hay que acordarlo con quien mantiene los builds. |
| Teléfono, correo y cédula fuera de la query (rifas y compras) | **Sí** | Que `RaffleWinnerController` y `PurchaseItemController` reciban esos datos en el cuerpo (`POST`) o los tomen del usuario autenticado. Hoy la API incumple su principio 5. |
| Verificación de la firma del token en el front | No (ya existe la clave pública) | Exponer o documentar la clave pública con la que el front verifica la firma, si no está ya disponible. |

- Ejemplos con datos ficticios: ningún correo, cédula, teléfono ni token reales.

## Reglas de negocio

- RN-1: El front solo crea o renueva una sesión si la firma del token de la API es válida y no
  está vencido. Un token con firma inválida no genera sesión, ni siquiera de solo lectura.
- RN-2: La pantalla de juego solo carga URLs de los hosts de juegos configurados por ambiente
  (lista cerrada, sin comodines), y solo atiende mensajes del iframe cuyo origen esté en esa
  lista. Cualquier otra URL muestra un error y no carga nada.
- RN-3: Ningún token, credencial de partida, correo, teléfono, cédula, dirección ni dato
  bancario aparece en una URL del navegador ni en la query de una petición a la API. Si un dato
  tiene que pasar de una pantalla a otra, va en el cuerpo, en `sessionStorage` enmascarado o se
  vuelve a pedir a la API.
- RN-4: El código de `src/` no escribe en la consola tokens, URLs firmadas, cabeceras ni cuerpos
  de petición o de error completos. El middleware no registra ruta y rol en cada petición.
- RN-5: Toda página de consumidor exige sesión de consumidor en el middleware, salvo las que el
  equipo declare públicas con su motivo. `/commercial/[id]` (perfil público de un comercial visto
  por el consumidor) exige rol consumidor, no comercial.
- RN-6: Toda petición del servidor a la API tiene tiempo límite y trata la respuesta no exitosa.
  Ninguna URL de la API tiene `localhost` como respaldo en código que se despliega: si falta la
  variable, el build o el arranque fallan con un mensaje claro.
- RN-7: Las excepciones de auditoría se revisan antes de su fecha (`reviewBy`). Al vencer, se
  renuevan con justificación y aprobación escritas o se elimina la dependencia.

## Criterios de aceptación

- **CA-1:** Dado un token con la firma alterada o de otra clave, cuando se intenta iniciar o
  renovar sesión con él, entonces el front no crea sesión y el usuario queda sin acceso a
  ninguna ruta protegida. Hay prueba automática que falla si se quita la verificación.
- **CA-2:** Dada una sesión válida de consumidor, cuando abre una ruta de administrador,
  comercial o diseñador, entonces llega a `/unauthorized` y esa página existe.
- **CA-3:** Dada `/games/play` con una URL de un host que no está en la lista del ambiente,
  cuando se abre, entonces no se crea el iframe y se muestra un error. Dado un mensaje de un
  origen fuera de la lista, entonces se ignora. Ambos con prueba automática.
- **CA-4:** Dado cualquier flujo de juego, mascotas, imágenes autenticadas, notificaciones,
  rifas, compras, registro o desbloqueo, cuando se recorre en el navegador, entonces ni la barra
  de direcciones ni las peticiones a la API llevan token, credencial de partida, correo, teléfono
  ni cédula en la URL. Los casos que dependen de la API se cierran cuando la API entregue su
  parte; mientras tanto quedan declarados en P-16 de la constitución.
- **CA-5:** Dado `src/`, cuando se busca `console.` con tokens, URLs firmadas, cabeceras o
  errores de axios completos, entonces no hay ninguno. Una regla de lint o una prueba lo impide
  a futuro.
- **CA-6:** Dado el inventario de rutas, cuando corre la prueba de protección, entonces
  `UNPROTECTED_PENDING` está vacía o cada entrada tiene su motivo, y `/commercial/[id]` aparece
  como ruta de consumidor.
- **CA-7:** Dada una API que no responde, cuando se abre la rifa en vivo, entonces la página
  responde dentro del tiempo límite con un error legible.
- **CA-8:** Dado un despliegue sin la variable de la URL de la API, cuando arranca o se
  construye, entonces falla con un mensaje claro en vez de apuntar a `localhost`.
- **CA-9:** Dado el 2026-11-30, cuando corre el CI, entonces las excepciones de `xlsx` y
  `postcss` ya fueron revisadas (renovadas con aprobación o eliminadas) y el CI sigue en verde.

## Fuera de alcance

- La deuda de estilo que la constitución ya declara: `'use client'` de más, peticiones sin
  TanStack Query, formularios sin react-hook-form, `<img>` sin `next/image`, avisos de lint, la
  ruta `/terminos` e identificadores en español. Se baja con el tope de lint y en specs propias.
- El token de un solo uso en el enlace para crear la contraseña del diseñador: es lo habitual en
  enlaces por correo y P-16 lo admite.
- El diseño visual y el responsive de las páginas de consumidor (spec 012).

## Requisitos no funcionales

- Prioridad sugerida: primero RN-1 y RN-2 (se pueden usar desde fuera sin nada de la víctima),
  después RN-3 y RN-4, y por último RN-5 a RN-7. RN-7 tiene fecha fija: 2026-11-30.
- Sin datos reales en pruebas ni ejemplos.
- Lo que dependa de la API se pide con una spec en la API y se enlaza aquí.

## Preguntas abiertas

- [ ] ¿Se hace todo en una spec o se parte en entregas (RN-1 y RN-2 primero)?
- [ ] Token fuera de la URL: ¿cookie httpOnly o ticket de un solo uso? Lo decide quien lleve la
      API.
- [ ] Credenciales de partida: ¿ticket de un solo uso o `postMessage`? Hay que acordarlo con
      quien mantiene los builds de Unity.
- [ ] ¿Qué páginas de consumidor deben seguir siendo públicas (por ejemplo, un catálogo visible
      sin sesión)?
- [ ] ¿Se confirma en vivo el problema de `/games/play` antes de planificar, o se arregla
      directamente?
