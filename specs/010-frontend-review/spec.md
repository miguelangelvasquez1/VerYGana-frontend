# 010 · Revisión del front: dejarlo listo para desplegar con buenas prácticas

- **Estado:** Primera entrega (frentes A, B y la parte marcada de C) implementada, aprobada en
  revisión (ronda 3, 2026-10-12) y en `main` desde el commit `f9cfa9f` (2026-10-17); los tres
  checks pasaron en GitHub el 2026-10-18. Falta confirmar la protección de `main` (M-1) y el PR
  de prueba (U-6). La deuda de `src/` encontrada en la revisión pasa a `specs/011-security-and-pii-debt`
  del front. Entregas siguientes (frentes D a G) sin empezar.
- **Fecha:** 2026-10-06 (actualizada 2026-10-12)
- **Ticket:** SCRUM-106 (épica SCRUM-14)
- **Repositorio afectado:** el front (`VerYGana-frontend`, Next.js) y, en una parte pequeña, el
  flujo de specs de la API (ver frente A). Las specs del front pasan a vivir en el repositorio
  del front; esta se mueve allá como parte de la primera entrega.

## Decisiones tomadas (2026-10-12)

- **Primera entrega:** frentes A y B completos y la parte de C que protege lo ya arreglado
  (pruebas de la política de descargas y de la protección de rutas por rol). D, E, F y G quedan
  para después, cada uno en su propia spec.
- **Las specs del front viven en el repositorio del front**, con su carpeta `specs/` y sus
  agentes, versionados en git.
- **Los agentes del front se copian de los de la API y se adaptan**, y sus reglas siguen el
  estándar recomendado por la industria para las tecnologías del front (ver RN-8).
- **Cuando una funcionalidad de la API cambia algo que el front consume, el flujo de la API deja
  escrita la spec de lo que se espera del front** (ver RN-9).
- **Miguel es el administrador del repositorio del front** y es quien activa la protección de `main`.

## Decisiones de la Puerta 2 (2026-10-12)

Plan aprobado con las recomendaciones del `plan.md` (D-1 a D-10):

- **D-1 · `postcss`:** segunda excepción escrita para sus dos avisos altos (GHSA-6g55-p6wh-862q y
  GHSA-r28c-9q8g-f849). Al planificar se comprobó que el `postcss` anidado en Next es de
  severidad alta, no solo `xlsx`; RN-10 y CA-16 se corrigieron para nombrar los dos paquetes.
  La revisión de esta excepción va atada a la decisión de pasar a Next 16.
- **D-2:** `vitest` aprobada como única dependencia de desarrollo nueva.
- **D-3:** se trabaja en `/Users/nicolascastro/Desktop/VerYganar-frontend-beta`, rama
  `spec-010-quality-gates`, creada por el usuario en el commit `53b866c`. No se creó un worktree
  aparte. `beta-front` ya llegó a `origin/main` (también en `53b866c`, que agrega sobre `2b792d0`
  un cambio en `next.config.ts`), así que la rama de trabajo nace de `main` y el prerrequisito
  de subir `beta-front` quedó cumplido.
- **D-4:** fecha de revisión de las excepciones: 2026-11-30. Una excepción vencida hace fallar el CI.
- **D-5 y D-6:** la spec se traslada al front conservando el número `010` y tal cual, sin recortar
  la descripción del frente D.
- **D-7:** las páginas de consumidor sin protección de middleware y la página `/commercial/[id]`
  bloqueada para el consumidor van a una spec aparte. Aquí las pruebas describen el
  comportamiento de hoy y no lo cambian.
- **D-8:** versionar los agentes, la plantilla y las specs de la API queda fuera de esta spec.
- **D-9:** se modifican `CLAUDE.md` y los agentes de la API para RN-9.
- **D-10:** un PR que baja los avisos de lint sin bajar el tope falla.

## Problema

Para sacar la beta (spec 006) hubo que arreglar el front con prisa, y lo que se encontró
muestra que hoy **nada impide que un cambio roto o inseguro llegue a `main`**:

- `main` no compilaba para producción (errores de tipos, una página vacía, páginas sin el
  envoltorio que Next exige) y nadie lo sabía, porque no había CI.
- 30 imports usaban una carpeta con las mayúsculas mal escritas: funcionaba en los Mac del
  equipo y fallaba en Linux, que es donde se despliega.
- Next estaba en una versión con vulnerabilidades críticas conocidas.
- Una ruta del servidor (`/api/proxy-download`) descargaba cualquier dirección sin sesión ni
  límites: permitía alcanzar servicios internos y servir páginas ajenas desde el dominio propio.
- `/admin` y `/compliance` cargaban sin sesión, y las páginas para que un diseñador fije su
  contraseña nunca funcionaron con la protección de rutas activa.
- El repositorio no tiene ningún test, ni un flujo de trabajo definido como el de la API
  (spec, plan, implementación con test primero y revisión).

Eso se corrigió lo justo para desplegar (rama `beta-front`, commit `2b792d0`; revisión en
`specs/006-beta-deployment/review-front.md`). Quedó deuda conocida y, sobre todo, quedó sin
resolver la causa: el front no tiene puertas de calidad. Si no se ponen, la próxima versión
vuelve a llegar al despliegue en el mismo estado.

## Actores y roles

| Actor | Rol | Qué cambia para él |
|-------|-----|--------------------|
| Desarrolladores (Nicolás, Miguel, Helen, Pablo) | dev | Trabajan el front con el mismo flujo que la API; un PR que no compila, no pasa tests o trae una vulnerabilidad alta no se puede mergear. |
| Quien despliega (hoy Nicolás) | dev | Despliega una imagen construida de forma repetible desde un commit de `main`, sin pasos manuales frágiles. |
| Usuarios del front | consumidor, comercial, diseñador, admin, oficial de cumplimiento | No reciben una versión con rutas sin proteger ni con fallos que un test habría atrapado. |
| Nestor | negocio | Puede mostrar la beta sin que un cambio de última hora la rompa. |

## Historias de usuario

- Como desarrollador, quiero que el CI me diga en el PR si rompí la compilación, los tests o
  la seguridad, para no enterarme el día del despliegue.
- Como desarrollador, quiero agentes configurados para el front (planner, implementer,
  reviewer) y un `CLAUDE.md` versionado, para trabajar con el mismo flujo de specs que en la API.
- Como quien despliega, quiero construir y publicar la imagen del front con un procedimiento
  repetible y documentado, para no depender de mi máquina ni de pasos de memoria.
- Como equipo, queremos pruebas automáticas de los flujos que más duelen si fallan (registro,
  inicio de sesión, protección por rol), para cambiar el front sin miedo.

## Alcance

Siete frentes. **En la primera entrega entran A, B y la parte marcada de C**; el resto queda
descrito aquí como mapa y se especifica aparte cuando le toque.

- **A · Flujo de trabajo y agentes (primera entrega).** `CLAUDE.md` del front versionado (hoy
  existe uno sin seguimiento), un documento de principios innegociables del front (equivalente
  a `docs/constitution.md`), la carpeta `specs/` con su plantilla y los agentes configurados
  para ese repositorio, copiados de los de la API y adaptados. Además, el flujo de la API gana
  un paso: cuando una funcionalidad cambia lo que el front consume, deja escrita la spec del front.
- **B · CI como puerta (primera entrega).** El CI básico ya existe en la rama `beta-front`
  (lint con tope de avisos, build y tipos). Falta que sea requisito de merge y que la auditoría
  de dependencias bloquee.
- **C · Pruebas (primera entrega: solo las unitarias de la política de descargas y las de
  protección de rutas por rol).** Tres niveles: unitarias para la lógica sin interfaz (política de descargas,
  lectura del token, manejo de errores, cliente de la API), de componentes para los formularios
  de registro e inicio de sesión, y un recorrido corto de punta a punta contra la beta
  (registro, inicio de sesión y una página por rol).
- **D · Deuda de seguridad.** El front acepta un token sin verificar su firma (se puede
  fabricar una sesión de cualquier rol; los datos los protege la API). `xlsx` tiene una
  vulnerabilidad alta sin corrección publicada en npm. Queda un `postcss` vulnerable dentro de
  Next que solo se corrige pasando a Next 16, lo que obliga a migrar el linter.
- **E · Deuda de calidad.** 360 avisos de lint, 190 de ellos por `any`. No existe la página
  `/unauthorized` a la que se redirige. El middleware escribe un log por cada petición.
- **F · Configuración por ambiente.** Dominios de almacenamiento fijos en el código (mascotas
  e imágenes), valores por defecto que apuntan a `localhost`, y variables sin documentar. Se
  cruza con SCRUM-105 (buckets de R2).
- **G · Despliegue repetible.** Construcción y publicación de la imagen automatizadas, con
  la etiqueta del commit y sin secretos dentro.

## Reglas

- RN-1: Un cambio no llega a `main` del front si no compila para producción, si falla un test
  o si introduce un error de lint.
- RN-2: El número de avisos de lint solo puede bajar: el tope del CI se reduce a medida que se
  corrigen y nunca se sube.
- RN-3: Ningún secreto queda dentro de la imagen, del repositorio ni de una variable pública
  (`NEXT_PUBLIC_*`). Los secretos del front viven en su propio proyecto de Infisical.
- RN-4: Toda ruta que exige un rol está protegida por el middleware, y existe una prueba
  automática que lo comprueba rol por rol.
- RN-5: Lo que se despliega corresponde a un commit de `main`, construido por el mismo
  procedimiento cada vez.
- RN-6: Todo bug arreglado trae la prueba que falla sin el arreglo (misma regla que la API).
- RN-7: Idioma: código en inglés; comentarios, commits, documentación y textos para el usuario
  en español (misma regla que la API).
- RN-8: Los principios del front y las reglas de sus agentes salen de las prácticas recomendadas
  por la documentación oficial de las tecnologías que usa el front, en la versión instalada, y
  cada regla técnica indica de dónde sale. Donde el equipo se aparte de la recomendación, queda
  escrito el motivo.
- RN-9: Una funcionalidad de la API que agrega o cambia algo que el front consume (un endpoint,
  un campo, un error, un rol o un flujo) no se da por cerrada sin una spec en el repositorio del
  front que diga qué se espera de él. Esa spec la escribe el flujo de la API, queda en borrador
  y la aprueba quien trabaje el front. Si la funcionalidad no toca al front, la spec de la API
  lo dice de forma explícita.
- RN-10: Mientras exista una vulnerabilidad alta sin corrección disponible, la auditoría solo
  puede bloquear si esa vulnerabilidad tiene una excepción escrita con motivo y fecha de revisión.
  Hoy son dos casos: `xlsx` (sin corrección en npm) y el `postcss` anidado en Next (solo se
  corrige pasando a Next 16). La excepción es por aviso, no por paquete.

## Criterios de aceptación

**Primera entrega:** CA-1, CA-2, CA-3, CA-4, CA-8, CA-12, CA-13, CA-14, CA-15 y CA-16.
**Entregas posteriores:** CA-5, CA-6, CA-7, CA-9, CA-10 y CA-11.

- **CA-1:** Dado un PR hacia `main` del front que rompe la compilación, los tipos o el lint,
  cuando se abre, entonces el CI falla y GitHub no permite el merge.
- **CA-2:** Dado un PR que aumenta el número de avisos de lint, cuando corre el CI, entonces falla.
- **CA-3:** Dado un PR que agrega una dependencia con una vulnerabilidad alta o crítica,
  cuando corre el CI, entonces la auditoría falla y bloquea el merge.
- **CA-4:** Dada cada ruta protegida por rol, cuando se pide sin sesión o con un rol que no
  corresponde, entonces no carga; y existe una prueba automática que lo comprueba para todas.
- **CA-5:** Dado un token cuya firma no es válida, cuando se intenta iniciar sesión en el front
  con él, entonces el front no crea sesión.
- **CA-6:** Dados los flujos de registro e inicio de sesión, cuando se corren las pruebas,
  entonces cubren el camino feliz y los errores principales (credenciales inválidas, reCAPTCHA
  rechazado, cuenta sin verificar).
- **CA-7:** Dada la beta desplegada, cuando se corre el recorrido de punta a punta, entonces
  completa el inicio de sesión y abre una página de cada rol.
- **CA-8:** Dado un desarrollador nuevo con el repositorio clonado, cuando sigue el `CLAUDE.md`,
  entonces puede levantar el front, correr las pruebas y usar el flujo de specs con los agentes.
- **CA-9:** Dado un commit de `main`, cuando se ejecuta el procedimiento de publicación,
  entonces produce una imagen etiquetada con ese commit, sin secretos, que arranca.
- **CA-10:** Dado el código del front, cuando se busca un dominio de almacenamiento o una
  dirección de `localhost` fija, entonces no aparece ninguna: todas salen de configuración
  documentada.
- **CA-11:** Dada la auditoría de dependencias de producción, cuando corre, entonces no reporta
  vulnerabilidades altas ni críticas, o las que queden tienen una excepción escrita con su
  motivo y fecha de revisión.
- **CA-12:** Dada la política de descargas de `/api/proxy-download`, cuando se corren las
  pruebas del repositorio, entonces cubren los casos que hoy solo se probaron a mano (destinos
  permitidos, destinos internos, esquemas no permitidos, límites) y corren en el CI.
- **CA-13:** Dado el documento de principios del front y sus agentes, cuando se revisan,
  entonces cada regla técnica indica la recomendación oficial de la que sale y la versión de la
  tecnología a la que aplica, y las excepciones tienen su motivo escrito.
- **CA-14:** Dada una funcionalidad de la API que cambia algo que el front consume, cuando el
  flujo de specs de la API llega al cierre, entonces existe en `specs/` del repositorio del
  front una spec en borrador con lo que se espera del front, y la spec de la API la referencia.
- **CA-15:** Dada una funcionalidad de la API que no toca al front, cuando se escribe su spec,
  entonces lo dice de forma explícita y no se crea ninguna spec en el front.
- **CA-16:** Dadas las vulnerabilidades altas conocidas de `xlsx` y del `postcss` anidado en
  Next, cuando la auditoría pasa a ser bloqueante, entonces cada aviso tiene su excepción escrita
  con motivo y fecha de revisión, y el CI de `main` queda en verde sin haber bajado el umbral
  para el resto de dependencias ni para avisos nuevos de esos mismos paquetes.

## Fuera de alcance

- Rediseño de la interfaz o cambios de funcionalidad.
- Corregir de una sola vez los 190 `any`: se reducen por partes bajo RN-2.
- Cambios en la API. Lo que el front necesite de ella se registra aparte (por ejemplo la
  marca `Secure` de la cookie de refresh, P-31 de la spec 006).
- Separar los buckets de R2 por ambiente: es SCRUM-105; aquí solo se saca la configuración
  del código.
- Producción real. Esta spec deja el front listo; el despliegue de producción es otra.

## Requisitos no funcionales

- El CI de un PR termina en menos de 10 minutos.
- Las pruebas no dependen de servicios externos reales, salvo el recorrido de punta a punta,
  que corre contra la beta y con datos ficticios.
- Sin datos personales ni tokens en los logs del front ni en las salidas del CI.
- Las pruebas de punta a punta no dejan datos basura en la beta, o los limpian.

## Punto de partida (ya hecho en la spec 006)

- Next `15.5.27` y `next-auth` `4.24.15`; ninguna vulnerabilidad crítica.
- `Dockerfile` y `.dockerignore`; imagen ARM64 de unos 100 MB, usuario sin privilegios.
- `.github/workflows/ci.yml`: lint con tope de 360 avisos, build y tipos; auditoría informativa.
- `/api/proxy-download` cerrado, con su política en una función pura (`src/lib/proxy/downloadPolicy.ts`).
  Sus 23 casos de prueba se hicieron ad hoc y no están en el repositorio.
- `/admin` y `/compliance` en el middleware; páginas de contraseña del diseñador accesibles.
- **Sigue pendiente al 2026-10-12:** la rama `beta-front` (commit `2b792d0`) solo existe en
  local, un commit por delante de `origin/main`; no se ha subido ni tiene PR. El CI, el
  `Dockerfile` y los arreglos de seguridad viven solo ahí, así que la primera entrega parte de
  que esa rama llegue a `main`.

## Preguntas abiertas

De la primera entrega (ninguna bloquea el plan):

- [ ] ¿Quién más del equipo va a usar los agentes del front? Define cuánto hay que explicar en
  el `CLAUDE.md` y si hace falta una guía aparte.
- [ ] ¿El plan de GitHub del repositorio del front permite proteger `main` con checks
  obligatorios? Lo confirma Miguel; si no, RN-1 queda como acuerdo del equipo hasta resolverlo.
- [ ] ¿Qué herramientas de pruebas se aceptan como dependencias nuevas del front? El planner
  propone las que recomienda la documentación oficial (RN-8) y se aprueban en la Puerta 2.

De entregas posteriores:

- [ ] **Bloqueante para D:** ¿se verifica la firma del token en el front (necesita la clave
  pública de la API en el front), o se elimina la confianza en el token del lado del front y
  se pregunta a la API en cada inicio de sesión?
- [ ] **Bloqueante para D:** `xlsx`: ¿para qué se usa y qué se prefiere: quitarla, instalarla
  desde el sitio del fabricante, cambiarla por otra librería o aceptar el riesgo por escrito?
- [ ] ¿Pasar a Next 16 entra en esta spec o va en una propia? Obliga a migrar el linter.
- [ ] ¿Las pruebas de punta a punta corren en cada PR, cada noche o solo antes de desplegar?
  ¿Con qué cuentas de prueba y quién las mantiene?
- [ ] ¿A qué registro se publica la imagen (por ejemplo ECR de AWS) y quién da las credenciales
  al CI? Nunca un registro público.
