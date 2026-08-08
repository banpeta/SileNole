# SileNole

**SileNole** es una app personal para móvil que ayuda a seguir la colección de
cromos **Panini La Liga Este 26/27**: saber qué cromos se tienen y cuáles
faltan, organizados por equipo y por la sección Fichajes.

Desarrollo guiado por especificación (**SDD**) y por tests (**TDD**). La fuente
de la verdad está en [`docs/`](docs/README.md); ningún código introduce
comportamiento que no esté especificado allí.

## Estado

- ✅ **Fase 0** — Especificación (`docs/`).
- ✅ **Fase 1** — Cimientos: React + Vite + TypeScript + Vitest, modelo de datos
  y validación de invariantes (con tests).
- ✅ **Fase 2** — Lógica de dominio (progreso, faltan, repes) y capa de
  persistencia (`ColeccionRepository`: en memoria e IndexedDB).
- ✅ **Fase 3** — Interfaz principal: pantallas de Inicio, Categorías, Detalle
  (tocar para marcar/desmarcar) y Faltan, con guardado automático.
- ✅ **Fase 4** — PWA: instalable en el móvil y funciona sin conexión
  (service worker + precache del catálogo).
- ✅ **Fase 5** — Diseño para niños: colores por club, celebración al
  completar, "te faltan N" y carga de la colección real 2026/27 (provisional).
- ✅ **Fase 6** — Repes: registrar repetidos por cromo y pantalla "Para
  cambiar", pensadas para intercambios.
- ✅ **HU-07** — Pantalla para importar/editar el catálogo (editar JSON, cargar
  archivo, descargar copia) conservando el progreso.
- ✅ **Fase 8** — Despliegue en GitHub Pages mediante GitHub Actions.
- ⏳ **Fase 7** — Multi-dispositivo (sincronización). Ver
  [`docs/05-plan-y-tdd.md`](docs/05-plan-y-tdd.md).

## Despliegue e instalación en el móvil

El repositorio incluye un workflow (`.github/workflows/deploy.yml`) que ejecuta
los tests, compila y publica en **GitHub Pages** en cada push.

**Primera vez (acción manual):** en GitHub, ve a **Settings → Pages** y en
*Source* elige **GitHub Actions**. A partir de ahí, cada push despliega solo.

La app quedará en `https://<usuario>.github.io/<repo>/`. Para instalarla en el
móvil: ábrela en el navegador y usa **"Añadir a la pantalla de inicio"**
(Android/Chrome) o **Compartir → Añadir a pantalla de inicio** (iOS/Safari).

## Requisitos

- Node.js 20+ (probado con Node 22).

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo
npm test           # ejecutar los tests una vez
npm run test:watch # tests en modo watch (TDD)
npm run typecheck  # comprobación de tipos
npm run build      # build de producción
```

## Estructura

```
docs/                  Especificaciones (fuente de la verdad, SDD)
src/model/             Tipos e invariantes del dominio (+ tests)
src/ui/                Interfaz React (en construcción)
public/coleccion.json  Catálogo semilla de la colección
```

## Datos de la colección

El catálogo real (equipos, orden y números de Panini La Liga Este 26/27) se
carga desde `public/coleccion.json`, siguiendo el formato descrito en
[`docs/03-modelo-de-datos.md`](docs/03-modelo-de-datos.md). El archivo actual
contiene datos **de ejemplo** hasta volcar los reales.
