/**
 * Validación del catálogo y del estado del usuario.
 *
 * Fuente de la verdad: docs/03-modelo-de-datos.md (reglas e invariantes)
 * y docs/04-especificacion-funcional.md (HU-07).
 *
 * Las funciones devuelven TODOS los errores encontrados (no se paran en el
 * primero) para poder mostrar mensajes claros al importar datos.
 */

import type { Coleccion, EstadoCromo, TipoCategoria } from './tipos';

export type ResultadoValidacion =
  | { ok: true }
  | { ok: false; errores: string[] };

const TIPOS_CATEGORIA: readonly TipoCategoria[] = ['equipo', 'fichajes', 'especial'];

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function esTextoNoVacio(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Valida la estructura del catálogo y el invariante 1 (unicidad de `numero`
 * en toda la colección).
 */
export function validarColeccion(data: unknown): ResultadoValidacion {
  const errores: string[] = [];

  if (!esObjeto(data)) {
    return { ok: false, errores: ['La colección debe ser un objeto.'] };
  }

  if (!esTextoNoVacio(data.id)) errores.push('Falta "id" (texto no vacío).');
  if (!esTextoNoVacio(data.nombre)) errores.push('Falta "nombre" (texto no vacío).');
  if (!esTextoNoVacio(data.temporada)) errores.push('Falta "temporada" (texto no vacío).');
  if (typeof data.version !== 'number') errores.push('Falta "version" (número).');

  if (!Array.isArray(data.categorias)) {
    errores.push('"categorias" debe ser una lista.');
    return { ok: false, errores };
  }

  const numerosVistos = new Set<string>();

  data.categorias.forEach((cat, i) => {
    const ref = `categorias[${i}]`;
    if (!esObjeto(cat)) {
      errores.push(`${ref} debe ser un objeto.`);
      return;
    }
    if (!esTextoNoVacio(cat.id)) errores.push(`${ref}.id inválido.`);
    if (!esTextoNoVacio(cat.nombre)) errores.push(`${ref}.nombre inválido.`);
    if (!TIPOS_CATEGORIA.includes(cat.tipo as TipoCategoria)) {
      errores.push(`${ref}.tipo inválido (debe ser ${TIPOS_CATEGORIA.join(' | ')}).`);
    }
    if (typeof cat.orden !== 'number') errores.push(`${ref}.orden debe ser número.`);
    if (cat.color !== null && typeof cat.color !== 'string') {
      errores.push(`${ref}.color debe ser texto o null.`);
    }

    if (!Array.isArray(cat.cromos)) {
      errores.push(`${ref}.cromos debe ser una lista.`);
      return;
    }

    cat.cromos.forEach((cromo, j) => {
      const cref = `${ref}.cromos[${j}]`;
      if (!esObjeto(cromo)) {
        errores.push(`${cref} debe ser un objeto.`);
        return;
      }
      if (!esTextoNoVacio(cromo.numero)) {
        errores.push(`${cref}.numero inválido (texto no vacío).`);
      } else {
        // Invariante 1: unicidad de numero en toda la colección.
        if (numerosVistos.has(cromo.numero)) {
          errores.push(`Número duplicado: "${cromo.numero}" (en ${cref}).`);
        }
        numerosVistos.add(cromo.numero);
      }
      if (cromo.nombre !== null && typeof cromo.nombre !== 'string') {
        errores.push(`${cref}.nombre debe ser texto o null.`);
      }
      if (
        cromo.etiqueta !== undefined &&
        cromo.etiqueta !== null &&
        typeof cromo.etiqueta !== 'string'
      ) {
        errores.push(`${cref}.etiqueta debe ser texto, null o no estar.`);
      }
      if (typeof cromo.orden !== 'number') errores.push(`${cref}.orden debe ser número.`);
    });
  });

  return errores.length === 0 ? { ok: true } : { ok: false, errores };
}

/** Devuelve el conjunto de números válidos de un catálogo ya validado. */
function numerosDeColeccion(coleccion: Coleccion): Set<string> {
  const set = new Set<string>();
  for (const cat of coleccion.categorias) {
    for (const cromo of cat.cromos) set.add(cromo.numero);
  }
  return set;
}

/**
 * Valida una lista de estados del usuario contra un catálogo.
 * Cubre los invariantes 2 (referencia válida), 3 (repes >= 0) y
 * 4 (coherencia repes/tenido).
 */
export function validarEstados(data: unknown, coleccion: Coleccion): ResultadoValidacion {
  const errores: string[] = [];

  if (!Array.isArray(data)) {
    return { ok: false, errores: ['Los estados deben ser una lista.'] };
  }

  const numerosValidos = numerosDeColeccion(coleccion);

  data.forEach((estado: unknown, i) => {
    const ref = `estados[${i}]`;
    if (!esObjeto(estado)) {
      errores.push(`${ref} debe ser un objeto.`);
      return;
    }
    const e = estado as Partial<EstadoCromo>;

    if (!esTextoNoVacio(e.numero)) {
      errores.push(`${ref}.numero inválido.`);
    } else if (!numerosValidos.has(e.numero)) {
      // Invariante 2: referencia válida.
      errores.push(`${ref}.numero "${e.numero}" no existe en el catálogo.`);
    }

    if (typeof e.tenido !== 'boolean') errores.push(`${ref}.tenido debe ser booleano.`);

    if (typeof e.repes !== 'number' || !Number.isInteger(e.repes)) {
      errores.push(`${ref}.repes debe ser un entero.`);
    } else if (e.repes < 0) {
      // Invariante 3: repes >= 0.
      errores.push(`${ref}.repes no puede ser negativo.`);
    } else if (e.repes > 0 && e.tenido !== true) {
      // Invariante 4: coherencia repes/tenido.
      errores.push(`${ref}: no puede haber repes > 0 si el cromo no se tiene.`);
    }

    if (!esTextoNoVacio(e.actualizado)) {
      errores.push(`${ref}.actualizado debe ser una fecha ISO 8601.`);
    }
  });

  return errores.length === 0 ? { ok: true } : { ok: false, errores };
}
