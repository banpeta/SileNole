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

**Actualización (Fase 7, confirmada):** se adopta **Supabase** como backend de
sincronización. Restricciones acordadas:
- **No se crea un proyecto nuevo**: se reutiliza un proyecto Supabase gratuito
  ya existente, compartido con otros proyectos.
- Para no colisionar con otras tablas de ese proyecto compartido, **todas las
  tablas de SileNole llevan el prefijo `silenole_`** (`silenole_colecciones`,
  `silenole_estados`).
- El detalle de identidad y de arquitectura offline queda en ADR-008 y ADR-009.

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

---

## ADR-008 · Identidad por código de colección (sin cuentas)

**Decisión:** la sincronización (Fase 7) empareja dispositivos con un **código de
colección**: un identificador aleatorio (UUID v4) generado por la propia app, no
una cuenta con email/contraseña.

**Contexto:** el Principio 3 (doc 01) pide privacidad y "sin cuentas". El niño no
va a gestionar un login. Necesitamos, aun así, saber qué dispositivos comparten
la misma colección.

**Flujo:**
- Primer dispositivo: la app genera el `codigo` y lo muestra para copiarlo (y,
  opcionalmente, como QR más adelante).
- Segundo dispositivo: en la pantalla "Sincronizar" se pega el `codigo` y queda
  emparejado. El `codigo` se guarda en local (IndexedDB).
- Sin código introducido, la app sigue funcionando 100% en local, como hasta
  ahora.

**Modelo de amenazas (asumido y aceptado):**
- El `codigo` **es** la credencial: quien lo tenga puede leer y escribir esa
  colección. Al ser un UUID v4 aleatorio (122 bits), no es adivinable por fuerza
  bruta.
- El dato es de riesgo muy bajo (marcas de cromos de un niño, sin datos
  personales). Se considera aceptable no tener autenticación fuerte.
- **Acceso desde el cliente**: la app usa solo la **clave publishable/anon** de
  Supabase (nunca la `service_role`). El aislamiento entre colecciones se
  garantiza con **RLS** y funciones que exigen el `codigo` correcto en cada
  operación.

**Alternativa registrada (futura):** si algún día se quiere endurecer, se puede
añadir **magic link por email** sin rehacer el modelo de datos (el `codigo`
pasaría a asociarse a un usuario autenticado).

---

## ADR-009 · Repositorio compuesto offline-first (local + nube)

**Decisión:** la sincronización **no sustituye** a IndexedDB. Se añade un
`RepositorioCompuesto` que combina el repositorio **local** (IndexedDB, fuente de
verdad para lectura y escritura inmediata) con un **sincronizador** en segundo
plano hacia Supabase.

**Contexto:** el offline es un requisito duro (HU-06). La UI no debe bloquearse
esperando a la red ni fallar sin conexión.

**Consecuencias:**
- Toda escritura va **primero a IndexedDB** (respuesta instantánea) y se apunta
  en una **cola de salida (outbox)** para empujarse a la nube cuando haya red.
- Al arrancar y al recuperar conexión, se **baja** el estado remoto y se
  **fusiona** con el local (ver algoritmo LWW en `03-modelo-de-datos.md`).
- La interfaz `ColeccionRepository` (ADR-003) no cambia: la UI sigue sin saber
  de dónde vienen los datos. `RepositorioCompuesto` también implementa esa
  interfaz.
- La sincronización es una **mejora opcional**: si no hay `codigo` configurado o
  no hay red, el `RepositorioCompuesto` se comporta como el local puro.

---

## ADR-010 · Tiempo real por Broadcast (no postgres_changes)

**Decisión:** para que los cambios aparezcan en el otro dispositivo **sin pulsar
nada**, se usa **Supabase Realtime Broadcast** (mensajes efímeros pub/sub) en un
canal nombrado con el `codigo` de colección. NO se usa `postgres_changes`.

**Contexto:** `postgres_changes` entrega filas de la base de datos al cliente y
para ello exige **políticas RLS de lectura** sobre las tablas para el rol anon.
Eso expondría los datos de **todas** las colecciones (cualquiera con la clave
anon podría leerlas), rompiendo el modelo de ADR-008 (acceso solo por funciones
que exigen el `codigo`).

**Cómo funciona:**
- Broadcast **no lee la base de datos**: solo transmite un aviso ("ha habido un
  cambio") por el canal del `codigo`. Quien lo recibe **descarga** por las RPC de
  siempre (que exigen el `codigo`). Así no se expone ninguna tabla.
- **Auto-subida**: un cambio local se sube automáticamente tras un pequeño
  retardo (debounce, para agrupar toques seguidos) y entonces emite el aviso.
- **Auto-bajada**: al recibir un aviso, el dispositivo hace descargar + fusionar
  (LWW) y actualiza la pantalla.
- **Sin bucles**: el canal ignora los avisos propios (`self: false`) y solo se
  emite en cambios locales del usuario, no al recibir/al arrancar.

**Degradación elegante:** si no hay red o el tiempo real no está disponible, se
sigue sincronizando al arrancar, al reconectar (`online`) y con el botón manual.

**Abstracción y pruebas:** la app depende de una interfaz `CrearCanal` /
`CanalTiempoReal` (como `ClienteRpc` en ADR-008), con implementación Supabase
(cargada de forma diferida) y un doble para los tests.

---

## ADR-011 · Multi-colección: almacenamiento por colección y registro

**Decisión:** la app gestiona **varias colecciones** independientes. Cada
colección tiene su propio catálogo (`Coleccion`), su propio progreso
(`EstadoCromo[]`) y su propio `codigo` de sincronización. En el dispositivo se
guardan **aisladas por `coleccionId`**, más un pequeño **registro** con la lista
de colecciones y cuál está activa.

**Contexto:** hasta ahora la app guardaba una sola colección (un catálogo y un
conjunto de estados). El modelo ya trataba el álbum como una `Coleccion` con
categorías, así que el salto es guardar **varias** y navegar entre ellas, no
rehacer el modelo.

**Consecuencias:**
- La capa de datos pasa de "un repositorio" a "un repositorio **por colección**":
  el mismo `ColeccionRepository` (ADR-003), pero con los datos namespaced por
  `coleccionId` en IndexedDB. La lógica de dominio y la UI de una colección no
  cambian: siguen hablando con un `ColeccionRepository`.
- Un **registro de colecciones** (local) guarda `{ id, nombre }` de cada una y
  la **activa**. La app abre la activa al arrancar.
- **Sincronización por colección**: el `codigo` deja de ser único; se guarda uno
  **por `coleccionId`**. El backend NO cambia (todo va ya por `codigo`: cada
  colección son sus filas bajo su código).
- **Colecciones creadas por el usuario**: se construyen con un nombre y una
  estructura (número total de cromos o secciones con su cantidad). Nacen solo
  locales; su sincronización es opcional (código por colección).
- **La colección LaLiga** sigue siendo la única con **semilla** (`coleccion.json`)
  y autoactualización por versión (ADR-005 + HU-07); las creadas por el usuario
  las mantiene el usuario.

**Migración (sin perder datos):** al actualizar, la colección única existente se
convierte en la **primera** del registro (id `laliga-este-26-27`), conservando
catálogo, progreso, escudos y su `codigo` actual. La conversión es automática y
única (idempotente).

**Borrado:** borrar una colección elimina sus datos **locales**; sus datos en la
nube (si tenía `codigo`) no se tocan (se podrían recuperar reintroduciendo el
código).
