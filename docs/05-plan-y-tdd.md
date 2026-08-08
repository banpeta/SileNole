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

### Fase 4 · PWA y offline
- `vite-plugin-pwa`: manifest, service worker, instalable y offline (HU-06).
- Prueba manual de instalación en un móvil real.

### Fase 5 · Diseño para niños
- Botones grandes, colores por equipo, ✓ además del color (accesibilidad),
  animación al completar una categoría.

### Fase 6 · Repes (para cambios) `[v2]`
- Interfaz para registrar repetidos y pantalla "Para cambiar" (HU-08).

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

## Datos pendientes de obtener de internet

- Lista real de **equipos** de La Liga Este 26/27 y su **orden**.
- **Rangos de números** por equipo y de la sección **Fichajes**.
- Otras secciones especiales si las hubiera (escudos, estadios, etc.).

Estos datos se volcarán en `public/coleccion.json` siguiendo el formato de
`03-modelo-de-datos.md`.
