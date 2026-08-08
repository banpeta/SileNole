# 02 · Decisiones técnicas (ADR)

Registro de decisiones de arquitectura. Cada decisión tiene contexto y
consecuencias. Si se cambia una decisión, se edita aquí primero.

---

## ADR-001 · Tipo de aplicación: PWA

**Decisión:** desarrollar una **PWA** (Progressive Web App) instalable, en lugar
de una app nativa.

**Contexto:** uso personal, sin necesidad de tiendas de aplicaciones, y se
requiere funcionamiento offline.

**Consecuencias:**
- Se instala en la pantalla de inicio sin App Store / Google Play ni licencias.
- Funciona offline mediante *service worker* + caché.
- Un único código sirve para Android e iOS.

---

## ADR-002 · Stack: React + Vite + TypeScript

**Decisión:** **React** con **Vite** como bundler y **TypeScript**.

**Contexto:** necesitamos algo moderno, rápido de arrancar y con buen soporte
para testing.

**Consecuencias:**
- Vite da arranque rápido y build sencillo para PWA (`vite-plugin-pwa`).
- TypeScript aporta tipos al modelo de datos → menos errores y mejor apoyo al
  TDD.

---

## ADR-003 · Persistencia local: IndexedDB (vía capa de repositorio)

**Decisión:** guardar los datos en el dispositivo con **IndexedDB**, accedida a
través de una **capa de repositorio** (interfaz `ColeccionRepository`).

**Contexto:** la colección puede tener cientos de cromos; localStorage es
limitado. Además, aislar el almacenamiento detrás de una interfaz permite
cambiar a sincronización en la nube sin tocar la lógica de la app.

**Consecuencias:**
- El resto de la app no sabe *dónde* se guardan los datos, solo habla con
  `ColeccionRepository`.
- En la fase multi-dispositivo se añade otra implementación del repositorio
  (nube) sin reescribir la UI.

---

## ADR-004 · Sin backend en la v1; multi-dispositivo como fase posterior

**Decisión:** la v1 no tiene servidor. La sincronización entre dispositivos se
diseña pero **no se implementa** todavía.

**Contexto:** al principio se usa en un solo móvil. La sincronización añade
complejidad (cuentas, conflictos) que no compensa aún.

**Consecuencias:**
- El modelo de datos se diseña para ser **serializable y fusionable** (ver
  `03-modelo-de-datos.md`) de cara a la sincronización futura.
- Candidato para la fase de sincronización: **Supabase** (base de datos +
  auth), por su capa gratuita y buena integración con PWAs. Decisión a
  confirmar cuando llegue esa fase.

---

## ADR-005 · Carga de datos de la colección mediante `coleccion.json`

**Decisión:** los datos reales (categorías y números) se definen en un archivo
**`coleccion.json`** versionado, que la app importa como semilla.

**Contexto:** los números y categorías de Panini La Liga Este 26/27 se obtienen
de internet y hay que poder introducirlos y corregirlos con facilidad.

**Consecuencias:**
- Rellenar la colección = editar un JSON (rápido), sin tocar código.
- Se validará contra el esquema del modelo de datos antes de importar.
- Más adelante puede añadirse una pantalla de edición dentro de la app.

---

## ADR-006 · Testing: Vitest + Testing Library (TDD)

**Decisión:** **Vitest** para lógica y **React Testing Library** para
componentes. **Playwright** para pruebas E2E en fases avanzadas.

**Contexto:** el proyecto es TDD: primero el test, luego el código.

**Consecuencias:**
- Cada historia de usuario de `04-especificacion-funcional.md` se traduce en
  tests antes de implementarse.
- La lógica de dominio (progreso, repes, filtros) se prueba de forma aislada,
  sin UI.

---

## ADR-007 · Despliegue: GitHub Pages

**Decisión:** publicar la PWA en **GitHub Pages** desde este repositorio.

**Consecuencias:** despliegue gratuito y automático; URL fija para "instalar" la
app en el móvil.
