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
3. **Privada y sin cuentas**: no requiere registro ni login en la versión
   inicial. Los datos viven en el móvil.
4. **Los datos son editables**: los números y categorías reales se obtienen de
   internet, así que la app debe permitir cargarlos y corregirlos.

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

- **Sincronización entre varios dispositivos** (se usará solo en 1 móvil al
  principio). Se contempla en el modelo de datos para no bloquearla después.
- Gestión avanzada de **repes** (cromos repetidos para cambiar): el dato se
  guarda desde la v1, pero la pantalla dedicada a gestionarlos llega después.
- Compartir la colección o "buscar cambios" con otras personas.

## Fuera de alcance (por ahora)

- Publicación en App Store / Google Play.
- Cuentas de usuario, backend propio, notificaciones.
- Reconocimiento de cromos por foto/cámara.

## Métrica de éxito

El niño es capaz de, sin ayuda: abrir la app, encontrar su equipo, marcar un
cromo nuevo y ver cuántos le faltan.
