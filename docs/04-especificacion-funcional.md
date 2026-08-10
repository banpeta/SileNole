# 04 · Especificación funcional

Historias de usuario con **criterios de aceptación** en formato
*Dado / Cuando / Entonces*. Cada criterio es la base de uno o varios tests
(TDD): **primero se escribe el test a partir de este documento y después el
código**.

Prioridad: `[MVP]` entra en la versión 1; `[v2]` es fase posterior.

---

## HU-01 · Ver la colección por categorías `[MVP]`

Como niño, quiero ver mis cromos agrupados por equipo y por la sección
Fichajes, para encontrarlos fácil.

- **Dado** que la colección está cargada,
  **cuando** abro la pantalla de categorías,
  **entonces** veo la lista de categorías ordenadas por su campo `orden`.
- **Dado** una categoría,
  **cuando** la veo en la lista,
  **entonces** muestra su nombre y su progreso (ej. "Barcelona 12/18").
- **Dado** una categoría con todos los cromos conseguidos,
  **entonces** se marca visualmente como **completa** (✓).

## HU-02 · Ver los cromos de una categoría `[MVP]`

Como niño, quiero abrir un equipo y ver todos sus números.

- **Dado** que abro una categoría,
  **entonces** veo sus cromos ordenados por `orden`, mostrando el `numero` en
  grande.
- **Dado** un cromo que tengo (`tenido: true`),
  **entonces** se muestra en verde / marcado.
- **Dado** un cromo que me falta (`tenido: false`),
  **entonces** se muestra en gris / sin marcar.

## HU-03 · Marcar y desmarcar un cromo `[MVP]`

Como niño, quiero tocar un número para decir que lo tengo o que ya no.

- **Dado** un cromo que me falta,
  **cuando** lo toco,
  **entonces** pasa a estado "lo tengo" (`tenido: true`) y se ve el cambio al
  instante.
- **Dado** un cromo que tengo,
  **cuando** lo toco,
  **entonces** vuelve a "me falta" (`tenido: false`) y sus `repes` pasan a `0`.
- **Dado** cualquier cambio,
  **entonces** se guarda automáticamente y sobrevive a cerrar y reabrir la app.

## HU-04 · Ver el progreso total `[MVP]`

Como niño, quiero ver cuántos cromos llevo de toda la colección.

- **Dado** que abro la pantalla de inicio,
  **entonces** veo "Tienes X de Y" y una barra de progreso.
- **Dado** que marco o desmarco un cromo,
  **entonces** el total se actualiza al instante.

## HU-05 · Ver los cromos que faltan `[MVP]`

Como padre/madre, quiero una lista de los que faltan para llevarla al comprar
sobres o al hacer cambios.

- **Dado** que abro la pantalla "Faltan",
  **entonces** veo solo los cromos con `tenido: false`, agrupados por categoría.
- **Dado** que no falta ninguno,
  **entonces** veo un mensaje de colección completa.

## HU-06 · Guardado automático y offline `[MVP]`

Como usuario, quiero que la app funcione sin internet y no se pierdan mis datos.

- **Dado** que hago cambios sin conexión,
  **entonces** se guardan igualmente en el dispositivo.
- **Dado** que cierro y vuelvo a abrir la app (incluso sin red),
  **entonces** veo mi colección con el último estado guardado.

## HU-07 · Cargar / actualizar el catálogo de la colección `[MVP]`

Como padre/madre, quiero cargar los datos reales de la colección (categorías y
números) obtenidos de internet.

- **Dado** un `coleccion.json` válido,
  **cuando** se importa,
  **entonces** la app muestra esas categorías y cromos.
- **Dado** un `coleccion.json` con un `numero` duplicado o una referencia
  inválida,
  **entonces** la importación se rechaza con un mensaje claro (ver invariantes
  en `03-modelo-de-datos.md`).
- **Dado** que se importa una nueva `version` del catálogo,
  **entonces** el estado del usuario (tengo / me falta / repes) de los números
  que siguen existiendo **se conserva**.

## HU-08 · Registrar repetidos (repes) `[v2]`

Como usuario, quiero anotar cuántos repetidos tengo de cada cromo, para
cambiarlos.

- **Dado** un cromo que tengo,
  **cuando** aumento sus repes,
  **entonces** se guarda `repes` (>= 0) y aparece en la lista "Para cambiar".
- **Dado** un cromo con `repes: 0`,
  **entonces** no aparece en "Para cambiar".

> Nota: el **dato** `repes` existe en el modelo desde la v1 (ver
> `03-modelo-de-datos.md`); esta HU cubre la **interfaz** para gestionarlo.

## HU-09 · Sincronizar entre dispositivos `[Fase 7]`

Como usuario, quiero ver la misma colección en varios dispositivos (móvil y
portátil), sin crear una cuenta.

**Emparejar (código de colección, ADR-008):**

- **Dado** un dispositivo sin sincronización,
  **cuando** activo la sincronización,
  **entonces** la app genera un **código de colección** y me lo muestra para
  copiarlo.
- **Dado** un segundo dispositivo,
  **cuando** introduzco ese código en la pantalla "Sincronizar",
  **entonces** queda emparejado con la misma colección y el código se guarda en
  local.
- **Dado** un código con formato inválido,
  **entonces** se rechaza con un mensaje claro y no se empareja.

**Sincronizar estado y catálogo:**

- **Dado** dos dispositivos emparejados,
  **cuando** cambio un cromo (tenido o repes) en uno,
  **entonces** el cambio acaba reflejándose en el otro.
- **Dado** que edito el catálogo en un dispositivo (HU-07),
  **entonces** la nueva `version` del catálogo llega al otro, conservando el
  progreso de los números que siguen existiendo.

**Conflictos (last-write-wins):**

- **Dado** un cambio en el mismo cromo en ambos dispositivos,
  **entonces** se resuelve quedándose con el de `actualizado` más reciente (en
  empate, prevalece el remoto), reaplicando los invariantes del modelo (si el
  ganador queda `tenido: false`, sus `repes` pasan a `0`).

**Offline-first (no romper HU-06, ver ADR-009):**

- **Dado** que hago cambios sin conexión,
  **entonces** se guardan en local igualmente y se envían a la nube al recuperar
  la red.
- **Dado** que no hay red o no hay código configurado,
  **entonces** la app funciona con normalidad en modo local.
- **Dado** que la sincronización con la nube falla,
  **entonces** no se pierden datos locales ni se bloquea la interfaz.

---

## Requisitos no funcionales

- **Usabilidad infantil**: zonas de toque grandes (mín. 44×44 px), texto claro,
  feedback inmediato al tocar.
- **Texto en mayúsculas**: todos los textos visibles de la app se muestran en
  MAYÚSCULAS (el niño de 7 años lee mejor así). Se aplica con presentación (CSS
  `text-transform: uppercase`), sin alterar el texto almacenado, para conservar
  acentos, datos y accesibilidad (los lectores de pantalla leen el texto real).
  No aplica a campos técnicos que el usuario edita tal cual (por ejemplo, el JSON
  del catálogo en la pantalla de edición).
- **Rendimiento**: la app debe responder al instante con colecciones de varios
  cientos de cromos.
- **Accesibilidad**: contraste suficiente; no depender solo del color (usar
  también ✓ / marca) para distinguir "tengo" de "falta".
- **Idioma**: español.
