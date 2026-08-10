# 01 · Visión y alcance

## Objetivo

Aplicación **personal** para móvil que ayuda a un niño (7 años) a llevar el
seguimiento de su colección de cromos **Panini La Liga Este 26/27**: saber qué
cromos **tiene** y cuáles le **faltan**, organizados de forma que sea fácil
encontrarlos.

## Usuarios

- **Niño (7 años)** — usuario principal. Marca y desmarca cromos. Necesita una
  interfaz muy simple, con botones grandes y feedback visual claro.
- **Padre/madre** — configura la colección (carga los datos) y ayuda si hace
  falta.

## Principios de diseño

1. **Simple para un niño**: pocos textos, números grandes, colores claros
   (verde = lo tengo, gris = me falta), un toque para cambiar el estado.
2. **Funciona sin conexión**: se usará en cualquier sitio (quiosco, casa de un
   amigo), a veces sin datos móviles.
3. **Privada y sin cuentas**: no requiere registro ni login. Los datos viven en
   el móvil. La sincronización entre dispositivos (Fase 7) es **opcional** y se
   activa con un **código de colección** (un identificador aleatorio), no con
   una cuenta de usuario: el código no lleva datos personales y solo empareja
   dispositivos. Sin activar la sincronización, la app funciona 100% en local.
4. **Los datos son editables**: los números y categorías reales se obtienen de
   internet, así que la app debe permitir cargarlos y corregirlos.
5. **Texto en mayúsculas**: el niño (7 años) todavía lee mejor en mayúsculas, así
   que todos los textos visibles de la app se muestran en MAYÚSCULAS. Se logra
   con presentación (CSS `text-transform: uppercase`), sin alterar el texto real
   almacenado (se conservan acentos y la accesibilidad).

## Alcance de la versión 1 (MVP)

Entra:

- Ver la colección organizada por **categorías** (cada equipo + sección
  **Fichajes**).
- Marcar un cromo como **conseguido** / **me falta** con un toque.
- Ver el **progreso** total y por categoría.
- Ver la lista de cromos que **faltan**.
- **Guardado automático** en el propio dispositivo.
- Instalable en la pantalla de inicio y uso **offline** (PWA).

No entra en la v1 (fases posteriores):

- Compartir la colección o "buscar cambios" con otras personas.

Ya entregado en fases posteriores a la v1:

- Gestión de **repes** (cromos repetidos para cambiar): pantalla "Para cambiar"
  (Fase 6, HU-08).

En desarrollo (Fase 7):

- **Sincronización entre varios dispositivos** (móvil y portátil). El modelo de
  datos ya estaba preparado para no bloquearla (campo `actualizado` para fusión
  por fecha). Se activa con un código de colección. Ver HU-09 en
  `04-especificacion-funcional.md`.

## Fuera de alcance (por ahora)

- Publicación en App Store / Google Play.
- Cuentas de usuario, backend propio, notificaciones.
- Reconocimiento de cromos por foto/cámara.

## Métrica de éxito

El niño es capaz de, sin ayuda: abrir la app, encontrar su equipo, marcar un
cromo nuevo y ver cuántos le faltan.
