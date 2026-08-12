/**
 * Servicio de colecciones (Fase 9, ADR-011).
 *
 * Ata el registro de colecciones con el almacenamiento por colección: cada
 * colección tiene su propia base de datos IndexedDB y su propio código de sync.
 * Incluye la migración de la colección única previa a multi-colección.
 */

import { RepositorioIndexedDB } from '../data/repositorioIndexedDB';
import type { ColeccionRepository } from '../data/repositorio';
import * as registro from '../data/registroColecciones';
import { borrarCodigo, guardarCodigo, leerCodigo } from '../data/codigoColeccion';
import { construirColeccion, type EntradaColeccion } from '../domain/construirColeccion';

/** Id y nombre de la colección semilla (la de LaLiga, ya existente). */
export const ID_LALIGA = 'laliga-este-26-27';
export const NOMBRE_LALIGA = 'LaLiga Este 2026/27';

/** Clave del código único antiguo (antes de multi-colección), para migrar. */
const CLAVE_CODIGO_ANTIGUA = 'silenole:codigo';

/**
 * Nombre de la base de datos IndexedDB de una colección. La de LaLiga usa
 * `silenole` (donde ya viven los datos existentes); las demás, `silenole-<id>`.
 */
export function nombreBdColeccion(id: string): string {
  return id === ID_LALIGA ? 'silenole' : `silenole-${id}`;
}

/** Repositorio local (IndexedDB) de una colección. */
export function crearRepositorioLocal(id: string): ColeccionRepository {
  return new RepositorioIndexedDB(nombreBdColeccion(id));
}

/**
 * Prepara el registro al arrancar. Idempotente:
 * - Si no hay ninguna colección registrada, registra la de LaLiga (que ya tiene
 *   sus datos en la BD `silenole`) y la deja activa.
 * - Migra el código único antiguo (`silenole:codigo`) al código por colección de
 *   LaLiga, si aún no se hizo.
 */
export function bootstrapColecciones(): void {
  if (registro.listar().length === 0) {
    registro.anadir({ id: ID_LALIGA, nombre: NOMBRE_LALIGA });
  }
  try {
    const antiguo = localStorage.getItem(CLAVE_CODIGO_ANTIGUA);
    if (antiguo && !leerCodigo(ID_LALIGA)) {
      guardarCodigo(ID_LALIGA, antiguo);
      localStorage.removeItem(CLAVE_CODIGO_ANTIGUA);
    }
  } catch {
    /* almacenamiento no disponible */
  }
}

/**
 * Crea una colección nueva desde nombre + estructura (HU-11): construye el
 * catálogo, lo guarda en su propia BD, la registra y la deja activa. Devuelve su id.
 */
export async function crearColeccionNueva(entrada: EntradaColeccion): Promise<string> {
  const coleccion = construirColeccion(entrada);
  const repo = crearRepositorioLocal(entrada.id);
  await repo.guardarColeccion(coleccion);
  registro.anadir({ id: entrada.id, nombre: coleccion.nombre });
  registro.setActiva(entrada.id);
  return entrada.id;
}

/**
 * Borra una colección (HU-12): la quita del registro, borra su código y elimina
 * su base de datos local. No toca la nube.
 */
export function borrarColeccionExistente(id: string): Promise<void> {
  registro.eliminar(id);
  borrarCodigo(id);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(nombreBdColeccion(id));
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}
