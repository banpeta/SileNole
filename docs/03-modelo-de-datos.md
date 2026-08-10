# 03 · Modelo de datos

Este documento define **la estructura de datos**. Es la referencia para los
tipos de TypeScript y para el esquema de `coleccion.json`.

## Vista general

```
Coleccion
 └── Categoria (equipo | fichajes | especial)   [muchas]
      └── Cromo                                  [muchos]
```

Los **datos del catálogo** (qué categorías y qué números existen) se separan del
**estado del usuario** (qué tiene y qué le falta). Esto facilita actualizar el
catálogo sin perder el progreso y, más adelante, sincronizar.

---

## Entidades

### Coleccion

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único (ej. `laliga-este-26-27`). |
| `nombre` | string | Nombre visible (ej. "La Liga Este 26/27"). |
| `temporada` | string | Temporada (ej. "2026/2027"). |
| `version` | number | Versión del catálogo; sube al corregir datos. |
| `categorias` | Categoria[] | Lista ordenada de categorías. |

### Categoria

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único dentro de la colección. |
| `nombre` | string | Nombre visible (ej. "Real Madrid", "Fichajes"). |
| `tipo` | `"equipo"` \| `"fichajes"` \| `"especial"` | Para agrupar y ordenar. |
| `orden` | number | Orden de aparición en la app. |
| `color` | string \| null | Color de acento (opcional, ej. escudo). |
| `cromos` | Cromo[] | Cromos que pertenecen a la categoría. |

### Cromo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero` | string | **Identificador único en toda la colección.** Enlaza catálogo y estado. No tiene por qué ser legible (ej. `real-betis-5`). |
| `etiqueta` | string \| null | Lo que aparece **impreso** en el cromo y se muestra en pantalla (ej. `5`, `18A`, `ADN3`). Opcional; si falta, se usa `numero`. **No** tiene que ser única. |
| `nombre` | string \| null | Nombre del jugador/elemento (opcional; ej. "Escudo", "Vinícius Jr."). |
| `orden` | number | Para ordenar dentro de la categoría. |

> **Por qué `numero` y `etiqueta` separados:** en la colección "Este" la
> numeración es **por equipo** (cada equipo tiene su escudo=1, entrenador=2,
> plantilla 3-20), así que el número impreso se repite entre equipos. Para que
> la identidad sea única en toda la colección, `numero` lleva un prefijo interno
> y `etiqueta` guarda el número visible.

### EstadoCromo (estado del usuario, separado del catálogo)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero` | string | Número del cromo al que se refiere. |
| `tenido` | boolean | `true` si el niño ya tiene ese cromo. Por defecto `false`. |
| `repes` | number | Cantidad de repetidos disponibles para cambiar. Por defecto `0`. Nunca negativo. |
| `actualizado` | string (ISO 8601) | Fecha/hora del último cambio. Útil para fusionar en la sincronización futura. |

---

## Reglas e invariantes

1. **Unicidad de `numero`**: no puede haber dos cromos con el mismo `numero` en
   toda la colección.
2. **Referencia válida**: todo `EstadoCromo.numero` debe corresponder a un
   `Cromo` existente en el catálogo.
3. **`repes >= 0`** siempre.
4. **Coherencia repes/tenido**: si `repes > 0`, entonces `tenido === true`
   (no puedes tener repetidos de un cromo que no tienes).
5. **Estado por defecto**: un cromo sin estado guardado se considera
   `tenido: false`, `repes: 0`.
6. **Independencia catálogo/estado**: actualizar el catálogo (nueva `version`)
   no borra el estado del usuario; los números que sigan existiendo conservan su
   estado.

## Valores derivados (no se almacenan, se calculan)

- **Progreso de una categoría** = nº de cromos con `tenido === true` / nº total
  de cromos de la categoría.
- **Progreso total** = suma de conseguidos / total de la colección.
- **Faltan** = cromos con `tenido === false`.
- **Para cambiar** = cromos con `repes > 0`.
- **Categoría completa** = todos sus cromos con `tenido === true`.

## Ejemplo de `coleccion.json` (semilla, datos de ejemplo)

> ⚠️ Números **ficticios** para ilustrar el formato. Los reales se cargarán
> cuando se obtengan de internet.

```json
{
  "id": "laliga-este-26-27",
  "nombre": "La Liga Este 26/27",
  "temporada": "2026/2027",
  "version": 1,
  "categorias": [
    {
      "id": "real-madrid",
      "nombre": "Real Madrid",
      "tipo": "equipo",
      "orden": 1,
      "color": "#FEBE10",
      "cromos": [
        { "numero": "real-madrid-1", "etiqueta": "1", "nombre": "Courtois", "orden": 1 },
        { "numero": "real-madrid-2", "etiqueta": "2", "nombre": "Vinícius Jr.", "orden": 2 }
      ]
    },
    {
      "id": "fichajes",
      "nombre": "Fichajes",
      "tipo": "fichajes",
      "orden": 99,
      "color": null,
      "cromos": [
        { "numero": "fichajes-F12", "etiqueta": "F12", "nombre": null, "orden": 1 }
      ]
    }
  ]
}
```

## Sincronización multi-dispositivo (Fase 7)

- El estado se guarda por `numero` con marca de tiempo `actualizado`, de modo
  que fusionar dos dispositivos se resuelve con "gana el más reciente".
- La capa `ColeccionRepository` (ver ADR-003) aísla el origen de los datos.
- Identidad por `codigo` de colección (ver ADR-008). Arquitectura offline-first
  con repositorio compuesto (ver ADR-009).

### Esquema en Supabase (prefijo `silenole_`)

Dos tablas, ambas particionadas por el `codigo` de colección. Tipos en notación
Postgres.

**`silenole_colecciones`** (el catálogo compartido entre dispositivos):

| Columna | Tipo | Notas |
|---------|------|-------|
| `codigo` | uuid | Clave primaria. Código de colección (ADR-008). |
| `data` | jsonb | Catálogo completo (`Coleccion` serializada). |
| `version` | integer | Versión del catálogo (igual que `Coleccion.version`). |
| `actualizado` | timestamptz | Último cambio del catálogo. |

**`silenole_estados`** (el estado del usuario por cromo):

| Columna | Tipo | Notas |
|---------|------|-------|
| `codigo` | uuid | Parte de la clave. A qué colección pertenece. |
| `numero` | text | Parte de la clave. Cromo al que se refiere. |
| `tenido` | boolean | Igual que `EstadoCromo.tenido`. |
| `repes` | integer | Igual que `EstadoCromo.repes` (>= 0). |
| `actualizado` | timestamptz | Igual que `EstadoCromo.actualizado`. |

Clave primaria de `silenole_estados`: (`codigo`, `numero`).

Seguridad: acceso solo con la clave publishable/anon y **RLS** que exige conocer
el `codigo`. Nunca se usa la clave `service_role` en el cliente (ADR-008).

### Algoritmo de fusión (last-write-wins)

**Estados** (por cada `numero`, comparando el local y el remoto):

1. Si solo existe en un lado, se conserva ese.
2. Si existe en ambos, gana el de `actualizado` más reciente.
3. En **empate** de `actualizado`, prevalece el **remoto** (regla determinista
   para que todos los dispositivos converjan al mismo resultado).
4. Tras elegir el ganador, se **reaplican los invariantes**: si el ganador queda
   `tenido: false`, se fuerza `repes: 0` (invariante 4). `repes` nunca negativo.

**Catálogo** (`silenole_colecciones` frente al local):

1. Gana la `version` mayor.
2. A igualdad de `version`, gana el `actualizado` más reciente (empate: remoto).
3. Cambiar el catálogo **no borra** el estado del usuario: los `numero` que
   sigan existiendo conservan su estado, los huérfanos se podan (invariante 6,
   igual que en la importación de HU-07).

> La fusión es **conmutativa e idempotente** respecto al resultado final: aplicar
> la misma sincronización dos veces deja el mismo estado, y da igual qué
> dispositivo sincronice primero.
