# Mis cromos · La Liga 26/27

App personal para móvil que ayuda a seguir la colección de cromos **Panini
La Liga Este 26/27**: saber qué cromos se tienen y cuáles faltan, organizados
por equipo y por la sección Fichajes.

Desarrollo guiado por especificación (**SDD**) y por tests (**TDD**). La fuente
de la verdad está en [`docs/`](docs/README.md); ningún código introduce
comportamiento que no esté especificado allí.

## Estado

- ✅ **Fase 0** — Especificación (`docs/`).
- ✅ **Fase 1** — Cimientos: React + Vite + TypeScript + Vitest, modelo de datos
  y validación de invariantes (con tests).
- ⏳ **Fase 2** — Lógica de dominio (progreso, filtros). Ver
  [`docs/05-plan-y-tdd.md`](docs/05-plan-y-tdd.md).

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
