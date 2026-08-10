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
- [x] Pantalla de importar/editar el catálogo desde la app (HU-07): ver más
  abajo (Fase 3.5).

### Fase 3.5 · Importar/editar catálogo (HU-07) (entregada) ✅
- [x] Pantalla `PantallaEditarCatalogo`: editor del JSON del catálogo, con
  cargar archivo, descargar copia y "Validar y guardar".
- [x] Al guardar se valida (unicidad, tipos…) y se muestran los errores con su
  ubicación; si es válido, se guarda **conservando el progreso** de los números
  que siguen existiendo y podando los huérfanos (`importarColeccion` +
  `reemplazarEstados`).
- [x] Acceso discreto desde el inicio ("⚙️ Editar catálogo").
- [x] **Tests primero**: servicio, componente, repositorio e integración
  (editar → guardar → se refleja y se conserva el progreso).

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

### Fase 7 · Multi-dispositivo (en desarrollo)

Sincronización opcional entre dispositivos con Supabase (ADR-004 confirmado),
identidad por código (ADR-008) y arquitectura offline-first (ADR-009). Cubre
HU-09. Se desarrolla en sub-fases, cada una TDD (test primero) y sin regresiones.

- **7.1 · Lógica de fusión (sin red, sin UI).** Función pura de fusión LWW de
  estados y de catálogo, con reaplicación de invariantes (doc 03). Tests primero
  con casos: solo local, solo remoto, gana el más reciente, empate -> remoto,
  invariante repes/tenido, poda de huérfanos al cambiar catálogo, idempotencia.
- **7.2 · Cliente Supabase y esquema.** Crear las tablas `silenole_colecciones`
  y `silenole_estados` en el proyecto compartido existente (prefijo obligatorio)
  y las políticas RLS. Implementar `RepositorioSupabase` (implementa
  `ColeccionRepository`). Tests de contrato contra un doble/mock del cliente.
- **7.3 · Repositorio compuesto + outbox.** `RepositorioCompuesto` (local +
  sincronizador con cola de salida). Escritura local inmediata, empuje diferido,
  descarga y fusión al arrancar/recuperar red. Tests: offline no bloquea, la
  cola se vacía al volver la red, fallo de nube no pierde datos locales.
- **7.4 · UI de sincronización.** Pantalla "Sincronizar": generar/mostrar código,
  introducir código de otro dispositivo, validar formato, estado de conexión.
  Tests de componente e integración (emparejar -> cambio en A -> aparece en B).
- **7.5 · Verificación en dispositivos reales** (manual): móvil + portátil.

> Configuración: la URL y la clave publishable/anon de Supabase se inyectan por
> variables de entorno de Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y
> en CI como secrets. Nunca se commitea la `service_role`.

### Cross-cutting · Texto en mayúsculas
- Mostrar todos los textos visibles en MAYÚSCULAS con CSS `text-transform`
  (Principio 5 del doc 01, requisito no funcional del doc 04). Test de que las
  pantallas principales aplican la transformación y de que el texto almacenado
  (por ejemplo el JSON del catálogo) no se altera.

### Fase 8 · Despliegue (entregada) ✅
- [x] Workflow de GitHub Actions (`.github/workflows/deploy.yml`) que ejecuta
  tests, compila y publica en GitHub Pages (ADR-007).
- [x] `base` de Vite derivado del nombre del repo en CI (se autoajusta si el
  repo se renombra).
- [x] Instrucciones de instalación en el móvil (ver README).
- [x] Pages activado y **desplegado con éxito desde `master`** (el entorno
  `github-pages` solo permite la rama por defecto). URL:
  `https://banpeta.github.io/hello-world/`.

> Nota de flujo: el desarrollo sigue en la rama
> `claude/football-stickers-tracker-app-y9g81g`; para desplegar se fusiona en
> `master`, que es la rama que publica Pages. Al renombrar el repo a
> "SileNole", la URL pasará a `https://banpeta.github.io/SileNole/`
> automáticamente (el `base` se deriva del nombre del repo).

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
