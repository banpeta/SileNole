/**
 * Servicio de aplicación: carga inicial del catálogo y utilidades de estado.
 *
 * Fuente de la verdad: ADR-005 (semilla `coleccion.json`) y
 * docs/04-especificacion-funcional.md (HU-06, HU-07).
 */

import type { Coleccion, EstadoCromo } from '../model/tipos';
import { validarColeccion, type ResultadoValidacion } from '../model/validacion';
import type { ColeccionRepository } from '../data/repositorio';

/** Función que obtiene los datos de la semilla (inyectable para testear). */
export type CargarSemilla = () => Promise<unknown>;

/**
 * Devuelve el catálogo guardado. Si no hay ninguno, carga la semilla, la valida
 * y la persiste. Lanza error si la semilla no es válida.
 */
export async function obtenerColeccion(
  repo: ColeccionRepository,
  cargarSemilla: CargarSemilla,
): Promise<Coleccion> {
  const guardada = await repo.cargarColeccion();
  if (guardada) return guardada;

  const datos = await cargarSemilla();
  const resultado = validarColeccion(datos);
  if (!resultado.ok) {
    throw new Error(`El catálogo (coleccion.json) no es válido:\n- ${resultado.errores.join('\n- ')}`);
  }
  const coleccion = datos as Coleccion;
  await repo.guardarColeccion(coleccion);
  return coleccion;
}

/** Indexa una lista de estados por número de cromo. */
export function estadosAMapa(estados: EstadoCromo[]): Map<string, EstadoCromo> {
  return new Map(estados.map((e) => [e.numero, e]));
}

/**
 * Importa un catálogo nuevo (HU-07). Valida los datos; si son válidos, los
 * guarda y CONSERVA el estado (tengo/falta/repes) de los números que sigan
 * existiendo, descartando los huérfanos. Si no son válidos, no cambia nada y
 * devuelve los errores.
 */
export async function importarColeccion(
  repo: ColeccionRepository,
  datos: unknown,
): Promise<ResultadoValidacion> {
  const resultado = validarColeccion(datos);
  if (!resultado.ok) return resultado;

  const coleccion = datos as Coleccion;
  await repo.guardarColeccion(coleccion);

  const numeros = new Set<string>();
  for (const cat of coleccion.categorias) {
    for (const cromo of cat.cromos) numeros.add(cromo.numero);
  }
  const estados = await repo.cargarEstados();
  await repo.reemplazarEstados(estados.filter((e) => numeros.has(e.numero)));

  return { ok: true };
}

/** Carga la semilla desde `public/coleccion.json` (uso real en el navegador). */
export async function cargarSemillaDesdePublic(): Promise<unknown> {
  const resp = await fetch(`${import.meta.env.BASE_URL}coleccion.json`);
  if (!resp.ok) throw new Error(`No se pudo cargar coleccion.json (HTTP ${resp.status})`);
  return resp.json();
}
