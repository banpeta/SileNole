/**
 * Lógica de fusión multi-dispositivo (Fase 7.1).
 *
 * Fuente de la verdad: docs/03-modelo-de-datos.md (algoritmo last-write-wins e
 * invariantes) y docs/04-especificacion-funcional.md (HU-09).
 *
 * Todas las funciones son PURAS: no mutan sus argumentos ni leen el reloj. La
 * fusión es determinista (en empate gana el remoto) e idempotente, para que
 * todos los dispositivos converjan al mismo resultado.
 */

import type { Coleccion, EstadoCromo } from '../model/tipos';

/** Instante de un sello ISO 8601. Un sello vacío se trata como el más antiguo. */
function instante(actualizado: string): number {
  if (!actualizado) return 0;
  const t = Date.parse(actualizado);
  return Number.isNaN(t) ? 0 : t;
}

/** Reaplica los invariantes del modelo (docs/03) a un estado ya elegido. */
function normalizar(estado: EstadoCromo): EstadoCromo {
  const repes = estado.repes > 0 ? estado.repes : 0; // invariante 3: repes >= 0
  const tenido = estado.tenido;
  return {
    numero: estado.numero,
    tenido,
    // invariante 4: si no lo tiene, no puede haber repes
    repes: tenido ? repes : 0,
    actualizado: estado.actualizado,
  };
}

/**
 * Elige entre dos estados del mismo número: gana el `actualizado` más reciente.
 * En empate prevalece el remoto (determinismo).
 */
function ganador(local: EstadoCromo, remoto: EstadoCromo): EstadoCromo {
  return instante(remoto.actualizado) >= instante(local.actualizado) ? remoto : local;
}

/**
 * Fusiona el conjunto de estados local con el remoto (LWW por número).
 * Devuelve una lista nueva, ordenada por número, con los invariantes reaplicados.
 */
export function fusionarEstados(
  locales: readonly EstadoCromo[],
  remotos: readonly EstadoCromo[],
): EstadoCromo[] {
  const porLocal = new Map(locales.map((e) => [e.numero, e]));
  const porRemoto = new Map(remotos.map((e) => [e.numero, e]));
  const numeros = new Set([...porLocal.keys(), ...porRemoto.keys()]);

  const resultado: EstadoCromo[] = [];
  for (const numero of numeros) {
    const local = porLocal.get(numero);
    const remoto = porRemoto.get(numero);
    let elegido: EstadoCromo;
    if (local && remoto) elegido = ganador(local, remoto);
    else elegido = (remoto ?? local)!;
    resultado.push(normalizar(elegido));
  }
  resultado.sort((a, b) => (a.numero < b.numero ? -1 : a.numero > b.numero ? 1 : 0));
  return resultado;
}

/** Un catálogo junto con su sello de última modificación (columna `actualizado`). */
export interface CatalogoConSello {
  coleccion: Coleccion;
  actualizado: string;
}

/**
 * Fusiona el catálogo local con el remoto: gana la `version` mayor y, a igualdad
 * de versión, el `actualizado` más reciente. En empate total prevalece el remoto.
 */
export function fusionarCatalogo(
  local: CatalogoConSello | null,
  remoto: CatalogoConSello | null,
): CatalogoConSello | null {
  if (!local) return remoto;
  if (!remoto) return local;
  if (remoto.coleccion.version !== local.coleccion.version) {
    return remoto.coleccion.version > local.coleccion.version ? remoto : local;
  }
  return instante(remoto.actualizado) >= instante(local.actualizado) ? remoto : local;
}
