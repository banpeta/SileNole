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

### Fase 0 · Especificación (esta entrega)
- [x] Documentos `docs/` como fuente de la verdad.
- [ ] **Revisión y aprobación** de las specs. ← *puerta antes de escribir código*

### Fase 1 · Cimientos del proyecto
- Configurar React + Vite + TypeScript + Vitest (ADR-002, ADR-006).
- Definir los **tipos** del modelo (`03-modelo-de-datos.md`).
- Implementar la validación de `coleccion.json` y los invariantes.
- **Tests primero**: unicidad de `numero`, referencias válidas, `repes >= 0`,
  coherencia repes/tenido.
- Semilla de ejemplo con 2–3 categorías ficticias para poder probar ya.

### Fase 2 · Lógica de dominio (sin UI)
- Cálculos derivados: progreso por categoría, progreso total, "faltan",
  "para cambiar", categoría completa.
- `ColeccionRepository` sobre IndexedDB (ADR-003) con su implementación en
  memoria para tests.
- **Tests primero** cubriendo HU-04, HU-05 y las derivaciones.

### Fase 3 · Interfaz principal
- Pantallas: Inicio (progreso), Categorías, Detalle de categoría, Faltan.
- Marcar/desmarcar con un toque (HU-01, HU-02, HU-03).
- Guardado automático (HU-06, parte de persistencia).
- **Tests primero** con Testing Library por componente.

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
