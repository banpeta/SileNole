/**
 * Cálculos derivados del catálogo + estado del usuario.
 *
 * Fuente de la verdad: docs/03-modelo-de-datos.md ("valores derivados") y
 * docs/04-especificacion-funcional.md (HU-04, HU-05, HU-08).
 *
 * Nada de esto se almacena: se calcula a demanda a partir del catálogo y del
 * mapa de estados.
 */

import type { Categoria, Coleccion, Cromo } from '../model/tipos';
import { estadoDe, type MapaEstados } from './estado';

export interface Progreso {
  conseguidos: number;
  total: number;
  completa: boolean;
}

/** Grupo de cromos de una categoría (para la vista "Faltan"). */
export interface GrupoCategoria {
  categoria: Categoria;
  cromos: Cromo[];
}

/** Un cromo disponible para cambiar, con su categoría y sus repes. */
export interface CromoParaCambiar {
  categoria: Categoria;
  cromo: Cromo;
  repes: number;
}

function tengo(mapa: MapaEstados, numero: string): boolean {
  return estadoDe(mapa, numero).tenido;
}

/** Progreso de una categoría: conseguidos / total y si está completa. */
export function progresoCategoria(categoria: Categoria, mapa: MapaEstados): Progreso {
  const total = categoria.cromos.length;
  const conseguidos = categoria.cromos.reduce(
    (n, c) => n + (tengo(mapa, c.numero) ? 1 : 0),
    0,
  );
  return { conseguidos, total, completa: total > 0 && conseguidos === total };
}

/** Indica si todos los cromos de la categoría están conseguidos. */
export function categoriaCompleta(categoria: Categoria, mapa: MapaEstados): boolean {
  return progresoCategoria(categoria, mapa).completa;
}

/** Progreso de toda la colección. */
export function progresoTotal(coleccion: Coleccion, mapa: MapaEstados): Progreso {
  let conseguidos = 0;
  let total = 0;
  for (const cat of coleccion.categorias) {
    const p = progresoCategoria(cat, mapa);
    conseguidos += p.conseguidos;
    total += p.total;
  }
  return { conseguidos, total, completa: total > 0 && conseguidos === total };
}

/**
 * Cromos que faltan, agrupados por categoría y en el orden del catálogo.
 * Omite las categorías sin cromos faltantes (HU-05).
 */
export function cromosQueFaltan(coleccion: Coleccion, mapa: MapaEstados): GrupoCategoria[] {
  const grupos: GrupoCategoria[] = [];
  for (const categoria of coleccion.categorias) {
    const cromos = categoria.cromos.filter((c) => !tengo(mapa, c.numero));
    if (cromos.length > 0) grupos.push({ categoria, cromos });
  }
  return grupos;
}

/** Cromos con repes > 0, disponibles para cambiar (HU-08). */
export function cromosParaCambiar(coleccion: Coleccion, mapa: MapaEstados): CromoParaCambiar[] {
  const resultado: CromoParaCambiar[] = [];
  for (const categoria of coleccion.categorias) {
    for (const cromo of categoria.cromos) {
      const { repes } = estadoDe(mapa, cromo.numero);
      if (repes > 0) resultado.push({ categoria, cromo, repes });
    }
  }
  return resultado;
}
