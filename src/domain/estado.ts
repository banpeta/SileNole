/**
 * Transiciones y consulta del estado del usuario.
 *
 * Fuente de la verdad: docs/03-modelo-de-datos.md (invariantes) y
 * docs/04-especificacion-funcional.md (HU-03, HU-08).
 *
 * Todas las funciones son PURAS: no mutan sus argumentos y reciben el instante
 * `ahora` como parámetro (nada de relojes internos), para ser deterministas.
 */

import type { EstadoCromo } from '../model/tipos';

/** Estados del usuario indexados por número de cromo. */
export type MapaEstados = ReadonlyMap<string, EstadoCromo>;

/**
 * Devuelve el estado guardado de un cromo o, si no existe, el estado por
 * defecto (invariante 5: tenido:false, repes:0).
 */
export function estadoDe(mapa: MapaEstados, numero: string): EstadoCromo {
  return mapa.get(numero) ?? { numero, tenido: false, repes: 0, actualizado: '' };
}

/**
 * Alterna "lo tengo" / "me falta" (HU-03). Al pasar a "me falta", los repes
 * vuelven a 0 (no puedes tener repetidos de un cromo que no tienes).
 */
export function alternarTenido(estado: EstadoCromo, ahora: string): EstadoCromo {
  const tenido = !estado.tenido;
  return {
    ...estado,
    tenido,
    repes: tenido ? estado.repes : 0,
    actualizado: ahora,
  };
}

/**
 * Establece el número de repetidos (HU-08). Si es > 0, fuerza tenido a true
 * (invariante 4). Rechaza valores negativos o no enteros (invariante 3).
 */
export function establecerRepes(estado: EstadoCromo, repes: number, ahora: string): EstadoCromo {
  if (!Number.isInteger(repes) || repes < 0) {
    throw new Error(`repes debe ser un entero >= 0, recibido: ${repes}`);
  }
  return {
    ...estado,
    repes,
    tenido: repes > 0 ? true : estado.tenido,
    actualizado: ahora,
  };
}
