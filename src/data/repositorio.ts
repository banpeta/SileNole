/**
 * Capa de persistencia (ADR-003).
 *
 * El resto de la app habla solo con la interfaz `ColeccionRepository`, sin
 * saber dónde se guardan los datos. Así, la fase multi-dispositivo podrá añadir
 * una implementación en la nube sin tocar la lógica ni la UI.
 */

import type { Coleccion, EstadoCromo } from '../model/tipos';

export interface ColeccionRepository {
  /** Devuelve el catálogo guardado o null si aún no hay ninguno. */
  cargarColeccion(): Promise<Coleccion | null>;
  /** Guarda (reemplaza) el catálogo. */
  guardarColeccion(coleccion: Coleccion): Promise<void>;
  /** Devuelve todos los estados del usuario (lista vacía si no hay). */
  cargarEstados(): Promise<EstadoCromo[]>;
  /** Guarda o actualiza el estado de un cromo (por su número). */
  guardarEstado(estado: EstadoCromo): Promise<void>;
  /** Guarda o actualiza varios estados de una vez. */
  guardarEstados(estados: EstadoCromo[]): Promise<void>;
}

/**
 * Implementación en memoria. Se usa en los tests y como reserva cuando no hay
 * almacenamiento persistente disponible.
 */
export class RepositorioEnMemoria implements ColeccionRepository {
  private coleccion: Coleccion | null = null;
  private estados = new Map<string, EstadoCromo>();

  async cargarColeccion(): Promise<Coleccion | null> {
    return this.coleccion ? structuredClone(this.coleccion) : null;
  }

  async guardarColeccion(coleccion: Coleccion): Promise<void> {
    this.coleccion = structuredClone(coleccion);
  }

  async cargarEstados(): Promise<EstadoCromo[]> {
    return Array.from(this.estados.values(), (e) => ({ ...e }));
  }

  async guardarEstado(estado: EstadoCromo): Promise<void> {
    this.estados.set(estado.numero, { ...estado });
  }

  async guardarEstados(estados: EstadoCromo[]): Promise<void> {
    for (const e of estados) this.estados.set(e.numero, { ...e });
  }
}
