/**
 * Implementación de `ColeccionRepository` sobre Supabase (Fase 7.2).
 *
 * Fuente de la verdad: docs/02 (ADR-004/008/009), docs/03 (esquema silenole_*).
 *
 * No accede a las tablas directamente: todo pasa por funciones RPC
 * (SECURITY DEFINER) que exigen el `codigo` de colección (ADR-008). Así, con la
 * clave anon, un dispositivo solo puede leer/escribir la colección cuyo código
 * conoce. La lógica de fusión NO vive aquí (ver src/domain/fusion.ts): este
 * repositorio es solo el acceso a datos remoto.
 */

import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from './repositorio';

/** Respuesta mínima de una llamada RPC (compatible con supabase-js). */
export interface RespuestaRpc {
  data: unknown;
  error: { message: string } | null;
}

/**
 * Contrato mínimo del cliente que necesitamos. El `SupabaseClient` real de
 * `@supabase/supabase-js` lo cumple. Depender de esta interfaz (y no del cliente
 * concreto) hace el repositorio fácil de testear con un doble.
 */
export interface ClienteRpc {
  rpc(fn: string, params?: Record<string, unknown>): PromiseLike<RespuestaRpc>;
}

/** Fila de `silenole_estados` tal como la devuelven las RPC de carga. */
interface FilaEstado {
  numero: string;
  tenido: boolean;
  repes: number;
  actualizado: string;
}

/** Fila de `silenole_colecciones` (la columna `data` es el catálogo). */
interface FilaColeccion {
  data: Coleccion;
}

export class RepositorioSupabase implements ColeccionRepository {
  constructor(
    private readonly cliente: ClienteRpc,
    private readonly codigo: string,
    /** Reloj inyectable (sello de guardado del catálogo). */
    private readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  /** Ejecuta una RPC y devuelve `data`, lanzando si hay error. */
  private async llamar(fn: string, params: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await this.cliente.rpc(fn, params);
    if (error) throw new Error(`Supabase RPC ${fn}: ${error.message}`);
    return data;
  }

  async cargarColeccion(): Promise<Coleccion | null> {
    const fila = (await this.llamar('silenole_cargar_coleccion', {
      p_codigo: this.codigo,
    })) as FilaColeccion | null;
    return fila?.data ?? null;
  }

  async guardarColeccion(coleccion: Coleccion): Promise<void> {
    await this.llamar('silenole_guardar_coleccion', {
      p_codigo: this.codigo,
      p_data: coleccion,
      p_version: coleccion.version,
      p_actualizado: this.ahora(),
    });
  }

  async cargarEstados(): Promise<EstadoCromo[]> {
    const filas = (await this.llamar('silenole_cargar_estados', {
      p_codigo: this.codigo,
    })) as FilaEstado[] | null;
    return (filas ?? []).map((f) => ({
      numero: f.numero,
      tenido: f.tenido,
      repes: f.repes,
      actualizado: f.actualizado,
    }));
  }

  async guardarEstado(estado: EstadoCromo): Promise<void> {
    await this.guardarEstados([estado]);
  }

  async guardarEstados(estados: EstadoCromo[]): Promise<void> {
    await this.llamar('silenole_guardar_estados', {
      p_codigo: this.codigo,
      p_estados: estados,
    });
  }

  async reemplazarEstados(estados: EstadoCromo[]): Promise<void> {
    await this.llamar('silenole_reemplazar_estados', {
      p_codigo: this.codigo,
      p_estados: estados,
    });
  }
}
