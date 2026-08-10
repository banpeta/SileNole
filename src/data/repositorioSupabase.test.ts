import { describe, it, expect } from 'vitest';
import type { EstadoCromo } from '../model/tipos';
import { bateriaContrato, coleccionDeEjemplo } from './contratoRepositorio';
import { RepositorioSupabase, type ClienteRpc, type RespuestaRpc } from './repositorioSupabase';

/**
 * Tests de RepositorioSupabase (Fase 7.2).
 * Fuente: docs/02 (ADR-008/009), docs/03 (esquema silenole_*) y HU-09.
 *
 * No hablamos con Supabase de verdad: usamos un DOBLE del cliente que simula la
 * semántica de las funciones RPC (silenole_cargar_*, silenole_guardar_*,
 * silenole_reemplazar_estados), aislando los datos por `codigo`.
 */

const CODIGO = '11111111-1111-4111-8111-111111111111';
const OTRO_CODIGO = '22222222-2222-4222-8222-222222222222';
const T = '2026-08-08T10:00:00.000Z';

interface FilaColeccion {
  codigo: string;
  data: unknown;
  version: number;
  actualizado: string;
}
interface FilaEstado extends EstadoCromo {
  codigo: string;
}

/** Doble en memoria que imita las funciones SQL, particionando por codigo. */
class ClienteFake implements ClienteRpc {
  colecciones = new Map<string, FilaColeccion>();
  estados = new Map<string, Map<string, FilaEstado>>();
  llamadas: Array<{ fn: string; params: Record<string, unknown> }> = [];

  async rpc(fn: string, params: Record<string, unknown>): Promise<RespuestaRpc> {
    this.llamadas.push({ fn, params });
    const codigo = params.p_codigo as string;
    switch (fn) {
      case 'silenole_cargar_coleccion': {
        return { data: this.colecciones.get(codigo) ?? null, error: null };
      }
      case 'silenole_cargar_estados': {
        const m = this.estados.get(codigo);
        return { data: m ? [...m.values()] : [], error: null };
      }
      case 'silenole_guardar_coleccion': {
        this.colecciones.set(codigo, {
          codigo,
          data: params.p_data,
          version: params.p_version as number,
          actualizado: params.p_actualizado as string,
        });
        return { data: null, error: null };
      }
      case 'silenole_guardar_estados': {
        const m = this.estados.get(codigo) ?? new Map<string, FilaEstado>();
        for (const e of params.p_estados as EstadoCromo[]) m.set(e.numero, { codigo, ...e });
        this.estados.set(codigo, m);
        return { data: null, error: null };
      }
      case 'silenole_reemplazar_estados': {
        const m = new Map<string, FilaEstado>();
        for (const e of params.p_estados as EstadoCromo[]) m.set(e.numero, { codigo, ...e });
        this.estados.set(codigo, m);
        return { data: null, error: null };
      }
      default:
        return { data: null, error: { message: `RPC desconocida: ${fn}` } };
    }
  }
}

// La misma batería de contrato que memoria e IndexedDB.
bateriaContrato('Supabase (doble)', () => new RepositorioSupabase(new ClienteFake(), CODIGO));

describe('RepositorioSupabase — específicos', () => {
  it('llama a las RPC con el codigo de la colección', async () => {
    const cliente = new ClienteFake();
    const repo = new RepositorioSupabase(cliente, CODIGO);
    await repo.cargarEstados();
    expect(cliente.llamadas[0]).toEqual({
      fn: 'silenole_cargar_estados',
      params: { p_codigo: CODIGO },
    });
  });

  it('guarda el catálogo con su data, version y un sello actualizado', async () => {
    const cliente = new ClienteFake();
    const repo = new RepositorioSupabase(cliente, CODIGO, () => T);
    await repo.guardarColeccion(coleccionDeEjemplo());
    const fila = cliente.colecciones.get(CODIGO)!;
    expect(fila.data).toEqual(coleccionDeEjemplo());
    expect(fila.version).toBe(1);
    expect(fila.actualizado).toBe(T);
  });

  it('aísla los datos por codigo: dos colecciones no se ven entre sí', async () => {
    const cliente = new ClienteFake();
    const repoA = new RepositorioSupabase(cliente, CODIGO);
    const repoB = new RepositorioSupabase(cliente, OTRO_CODIGO);
    await repoA.guardarEstado({ numero: '1', tenido: true, repes: 0, actualizado: T });
    expect(await repoB.cargarEstados()).toEqual([]);
    expect(await repoA.cargarEstados()).toHaveLength(1);
  });

  it('propaga un error de la RPC al cargar', async () => {
    const cliente: ClienteRpc = {
      async rpc() {
        return { data: null, error: { message: 'boom' } };
      },
    };
    const repo = new RepositorioSupabase(cliente, CODIGO);
    await expect(repo.cargarEstados()).rejects.toThrow(/boom/);
  });

  it('propaga un error de la RPC al guardar', async () => {
    const cliente: ClienteRpc = {
      async rpc() {
        return { data: null, error: { message: 'fallo al escribir' } };
      },
    };
    const repo = new RepositorioSupabase(cliente, CODIGO);
    await expect(
      repo.guardarEstado({ numero: '1', tenido: true, repes: 0, actualizado: T }),
    ).rejects.toThrow(/fallo al escribir/);
  });
});
