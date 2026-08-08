# 05 · Plan de desarrollo y estrategia TDD

## Cómo trabajamos (SDD + TDD)

1. **SDD** — el comportamiento se define primero en los `.md` de esta carpeta.
   Ningún código introduce comportamiento que no esté especificado aquí.
2. **TDD** — por cada criterio de aceptación de
   `04-especificacion-funcional.md`:
   1. 🔴 Escribir el test que falla.
   2. 🟢 Escribir el mínimo código para que pase.
   3. 🔵 Refactorizar manteniendo los tests en verde.
3. Cada fase termina con **todos los tests en verde** y la documentación
   actualizada si algo cambió.

## Fases

### Fase 0 · Especificación (entregada) ✅
- [x] Documentos `docs/` como fuente de la verdad.
- [x] **Revisión y aprobación** de las specs.

### Fase 1 · Cimientos del proyecto (entregada) ✅
- [x] Configurar React + Vite + TypeScript + Vitest (ADR-002, ADR-006).
- [x] Definir los **tipos** del modelo (`src/model/tipos.ts`, según
  `03-modelo-de-datos.md`).
- [x] Implementar la validación de `coleccion.json` y los invariantes
  (`src/model/validacion.ts`).
- [x] **Tests primero** (`src/model/validacion.test.ts`): unicidad de `numero`,
  referencias válidas, `repes >= 0`, coherencia repes/tenido. 13 tests en verde.
- [x] Semilla de ejemplo (`public/coleccion.json`) con categorías ficticias,
  validada por un test.

### Fase 2 · Lógica de dominio (sin UI) (entregada) ✅
- [x] Transiciones de estado (`src/domain/estado.ts`): estado por defecto,
  alternar tenido, establecer repes (HU-03, HU-08).
- [x] Cálculos derivados (`src/domain/progreso.ts`): progreso por categoría,
  progreso total, categoría completa, "faltan", "para cambiar" (HU-04, HU-05).
- [x] `ColeccionRepository` (ADR-003): interfaz + implementación en memoria
  (`src/data/repositorio.ts`) y en IndexedDB (`src/data/repositorioIndexedDB.ts`).
- [x] **Tests primero**: 45 tests en verde (misma batería de contrato contra
  ambas implementaciones del repositorio).

### Fase 3 · Interfaz principal (pantallas de consulta) (entregada) ✅
- [x] Pantallas: Inicio (progreso), Categorías, Detalle de categoría, Faltan
  (`src/ui/`).
- [x] Marcar/desmarcar con un toque (HU-01, HU-02, HU-03).
- [x] Guardado automático conectando la UI al `ColeccionRepository`
  (`src/app/useSileNole.ts`, HU-06).
- [x] Carga del catálogo desde la semilla en el primer arranque
  (`src/app/servicio.ts`).
- [x] **Tests primero** con Testing Library + test de integración de la app.
- [ ] *Pendiente para más adelante*: pantalla de importar/editar el catálogo
  desde la app (HU-07).

### Fase 4 · PWA y offline (entregada) ✅
- [x] `vite-plugin-pwa`: manifest, service worker (autoUpdate) e iconos.
- [x] Instalable en la pantalla de inicio (manifest + apple-touch-icon).
- [x] Funcionamiento **offline** verificado automáticamente con Chromium:
  tras cargar y desconectar la red, la app recarga desde caché y conserva el
  estado (HU-06).
- [ ] *Pendiente (manual)*: instalar en un móvil real cuando se despliegue
  (Fase 8).

### Fase 5 · Diseño para niños (entregada) ✅
- [x] Colores de acento por club (borde en la lista, punto de color en el
  detalle y color del club al marcar un cromo).
- [x] Celebración al completar un equipo y al completar la colección 🎉.
- [x] "Te faltan N" bien visible en el inicio; botones grandes con iconos.
- [x] Animación al marcar (con respeto a `prefers-reduced-motion`).
- [x] Carga de la **colección real** 2026/27 (20 equipos + 7 series
  especiales, 514 cromos) en `public/coleccion.json`, con `numero` único y
  `etiqueta` visible (incluye variantes A/B). Provisional hasta cotejar con el
  álbum.

### Fase 6 · Repes (para cambios) (entregada) ✅
- [x] Control `−  n  +` en cada cromo que se tiene, para registrar repetidos
  (HU-08), con guardado automático (`useSileNole.ajustarRepes`).
- [x] Pantalla "Para cambiar" con los repes agrupados por equipo y su cantidad
  (`PantallaParaCambiar`).
- [x] **Tests primero**: controles de repes, pantalla y flujo de integración
  (marcar → +repes → aparece en "Para cambiar" → persiste). 69 tests en verde.

### Fase 7 · Multi-dispositivo `[v2]`
- Segunda implementación de `ColeccionRepository` en la nube (candidato:
  Supabase, ADR-004) y fusión por fecha (HU-09).

### Fase 8 · Despliegue
- Publicar en GitHub Pages (ADR-007) y documentar cómo instalarla en el móvil.

## Estructura de carpetas prevista

```
/docs            → especificaciones (fuente de la verdad)
/src
  /model         → tipos e invariantes del dominio
  /domain        → cálculos (progreso, filtros, repes)
  /data          → ColeccionRepository (IndexedDB / memoria)
  /ui            → componentes y pantallas React
/public
  coleccion.json → catálogo semilla (datos reales cuando se obtengan)
/tests           → o tests junto a cada módulo (por decidir en Fase 1)
```

## Definición de "hecho" (Definition of Done) por historia

- Criterios de aceptación cubiertos por tests **en verde**.
- Sin regresiones (toda la suite pasa).
- Documentación coherente con el código.
- Comportamiento verificado en móvil cuando aplique (fases 3+).

## Datos: estado actual y pendientes

Ya cargados en `public/coleccion.json` (provisional, checklist 2026/27):

- 20 equipos con escudo (1), entrenador (2) y plantilla (3-20), incluyendo
  **variantes A/B**.
- Series especiales: ADN/LaLiga Prime (15), LaLiga Fantasy (9), Draft 23 (23),
  Draft 23 Kromix (23), Extra Sticker Bronce/Plata/Oro (5 cada una).

Pendiente de dato (se añadirá cuando exista numeración o con el álbum delante):

- **Últimos Fichajes** — numeración no publicada aún.
- **Colocas** — estructura no publicada aún.
- **Extra Sticker** (Bronce/Plata/Oro) — sin numeración individual publicada;
  cargados como 5 placeholders cada uno.
- Cotejo final de todos los números con el álbum físico.
