/**
 * Constructor de colecciones (Fase 9.3, HU-11).
 *
 * Función PURA: a partir de un id, un nombre y una estructura, crea una
 * `Coleccion` válida (categorías con cromos numerados 1..N y nombre vacío).
 * El `id` lo genera el llamador (p. ej. crypto.randomUUID()).
 *
 * Fuente de la verdad: docs/03 (multi-colección) y docs/04 (HU-11).
 */

import type { Coleccion, Categoria, Cromo } from '../model/tipos';

export type Estructura =
  | { tipo: 'simple'; total: number }
  | { tipo: 'secciones'; secciones: { nombre: string; cantidad: number }[] };

export interface EntradaColeccion {
  id: string;
  nombre: string;
  temporada?: string;
  estructura: Estructura;
}

function esEnteroPositivo(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1;
}

function cromosDe(categoriaId: string, cantidad: number): Cromo[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: `${categoriaId}-${i + 1}`,
    etiqueta: String(i + 1),
    nombre: null,
    orden: i + 1,
  }));
}

export function construirColeccion(entrada: EntradaColeccion): Coleccion {
  const nombre = entrada.nombre.trim();
  if (!nombre) throw new Error('El nombre de la colección es obligatorio.');

  let categorias: Categoria[];

  if (entrada.estructura.tipo === 'simple') {
    const total = entrada.estructura.total;
    if (!esEnteroPositivo(total)) {
      throw new Error('Indica cuántos cromos tiene la colección (al menos 1).');
    }
    categorias = [
      { id: 'general', nombre: 'Cromos', tipo: 'especial', orden: 1, color: null, cromos: cromosDe('general', total) },
    ];
  } else {
    const secciones = entrada.estructura.secciones ?? [];
    if (secciones.length === 0) throw new Error('Añade al menos una sección.');
    categorias = secciones.map((s, i) => {
      const nom = s.nombre.trim();
      if (!nom) throw new Error(`La sección ${i + 1} necesita un nombre.`);
      if (!esEnteroPositivo(s.cantidad)) {
        throw new Error(`La sección "${nom}" necesita al menos 1 cromo.`);
      }
      const catId = `seccion-${i + 1}`;
      return { id: catId, nombre: nom, tipo: 'especial', orden: i + 1, color: null, cromos: cromosDe(catId, s.cantidad) };
    });
  }

  return {
    id: entrada.id,
    nombre,
    temporada: entrada.temporada?.trim() || 'Personal',
    version: 1,
    categorias,
  };
}
