import { describe, it, expect } from 'vitest';
import type { EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from './repositorio';
import { RepositorioEnMemoria } from './repositorio';
import { RepositorioCompuesto } from './repositorioCompuesto';
import { bateriaContrato, coleccionDeEjemplo } from './contratoRepositorio';

/**
 * Tests de RepositorioCompuesto (Fase 7.3): offline-first (ADR-009).
 * Fuente: docs/04 HU-09 (offline-first y primera sincronización) y la lógica de
 * fusión de src/domain/fusion.ts.
 *
 * El local es la fuente de verdad (lecturas/escrituras inmediatas). El remoto es
 * opcional; sincronizar() descarga + fusiona + sube, sin bloquear ni perder
 * datos si el remoto falla.
 */

const T1 = '2026-08-01T10:00:00.000Z';
const T2 = '2026-08-02T10:00:00.000Z';

function e(numero: string, tenido: boolean, repes: number, actualizado: string): EstadoCromo {
  return { numero, tenido, repes, actualizado };
}

function ordenar(estados: EstadoCromo[]): EstadoCromo[] {
  return [...estados].sort((a, b) => a.numero.localeCompare(b.numero));
}

/** Remoto que se puede "caer" (simula falta de red): al caer, todo rechaza. */
class RemotoControlable implements ColeccionRepository {
  caido = false;
  interno = new RepositorioEnMemoria();
  private guard<T>(fn: () => Promise<T>): Promise<T> {
    return this.caido ? Promise.reject(new Error('sin red')) : fn();
  }
  cargarColeccion() {
    return this.guard(() => this.interno.cargarColeccion());
  }
  guardarColeccion(c: Parameters<ColeccionRepository['guardarColeccion']>[0]) {
    return this.guard(() => this.interno.guardarColeccion(c));
  }
  cargarEstados() {
    return this.guard(() => this.interno.cargarEstados());
  }
  guardarEstado(x: EstadoCromo) {
    return this.guard(() => this.interno.guardarEstado(x));
  }
  guardarEstados(xs: EstadoCromo[]) {
    return this.guard(() => this.interno.guardarEstados(xs));
  }
  reemplazarEstados(xs: EstadoCromo[]) {
    return this.guard(() => this.interno.reemplazarEstados(xs));
  }
}

// La misma batería de contrato, con y sin remoto (las lecturas/escrituras van al
// local; sincronizar no se invoca en la batería).
bateriaContrato(
  'Compuesto (con remoto)',
  () => new RepositorioCompuesto(new RepositorioEnMemoria(), new RepositorioEnMemoria()),
);
bateriaContrato('Compuesto (sin remoto)', () => new RepositorioCompuesto(new RepositorioEnMemoria(), null));

describe('RepositorioCompuesto — lecturas y escrituras van al local', () => {
  it('lee del local, no del remoto', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarEstado(e('local-1', true, 0, T1));
    await remoto.guardarEstado(e('remoto-1', true, 0, T1));
    const repo = new RepositorioCompuesto(local, remoto);
    expect(await repo.cargarEstados()).toEqual([e('local-1', true, 0, T1)]);
  });

  it('la escritura llega al local de inmediato', async () => {
    const local = new RepositorioEnMemoria();
    const repo = new RepositorioCompuesto(local, new RepositorioEnMemoria());
    await repo.guardarEstado(e('1', true, 0, T1));
    expect(await local.cargarEstados()).toEqual([e('1', true, 0, T1)]);
  });
});

describe('RepositorioCompuesto — sincronizar (fusión)', () => {
  it('primer sync con nube vacía: conserva lo local y lo sube (no lo pisa)', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarEstados([e('a', true, 0, T1), e('b', true, 2, T2)]);
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar();

    expect(ordenar(await local.cargarEstados())).toEqual([e('a', true, 0, T1), e('b', true, 2, T2)]);
    expect(ordenar(await remoto.cargarEstados())).toEqual([e('a', true, 0, T1), e('b', true, 2, T2)]);
  });

  it('fusiona lo de ambos lados (unión por número)', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarEstado(e('a', true, 0, T2));
    await remoto.guardarEstado(e('b', true, 0, T1));
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar();

    expect(ordenar(await repo.cargarEstados())).toEqual([e('a', true, 0, T2), e('b', true, 0, T1)]);
    expect(ordenar(await remoto.cargarEstados())).toEqual([e('a', true, 0, T2), e('b', true, 0, T1)]);
  });

  it('resuelve conflictos por fecha (gana el más reciente)', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarEstado(e('x', true, 3, T2)); // local más reciente
    await remoto.guardarEstado(e('x', false, 0, T1));
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar();

    expect(await repo.cargarEstados()).toEqual([e('x', true, 3, T2)]);
  });

  it('es idempotente: sincronizar dos veces deja el mismo estado', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarEstado(e('a', true, 0, T2));
    await remoto.guardarEstado(e('b', true, 0, T1));
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar();
    const tras1 = ordenar(await repo.cargarEstados());
    await repo.sincronizar();
    const tras2 = ordenar(await repo.cargarEstados());
    expect(tras2).toEqual(tras1);
  });

  it('sube el catálogo local si la nube no tiene ninguno', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarColeccion(coleccionDeEjemplo());
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar();

    expect(await remoto.cargarColeccion()).toEqual(coleccionDeEjemplo());
  });

  it('gana la versión de catálogo mayor', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    await local.guardarColeccion({ ...coleccionDeEjemplo(), version: 1 });
    await remoto.guardarColeccion({ ...coleccionDeEjemplo(), nombre: 'Nuevo', version: 2 });
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar();

    expect((await repo.cargarColeccion())?.version).toBe(2);
    expect((await repo.cargarColeccion())?.nombre).toBe('Nuevo');
  });

  it('sin remoto, sincronizar es un no-op (modo local puro)', async () => {
    const local = new RepositorioEnMemoria();
    await local.guardarEstado(e('a', true, 0, T1));
    const repo = new RepositorioCompuesto(local, null);
    await expect(repo.sincronizar()).resolves.toBeUndefined();
    expect(await repo.cargarEstados()).toEqual([e('a', true, 0, T1)]);
    expect(repo.pendiente).toBe(false);
  });
});

describe('RepositorioCompuesto — offline / fallo del remoto', () => {
  it('un fallo del remoto no lanza ni pierde lo local, y queda pendiente', async () => {
    const local = new RepositorioEnMemoria();
    await local.guardarEstado(e('a', true, 0, T1));
    const remoto = new RemotoControlable();
    remoto.caido = true;
    const repo = new RepositorioCompuesto(local, remoto);

    await expect(repo.sincronizar()).resolves.toBeUndefined();
    expect(await local.cargarEstados()).toEqual([e('a', true, 0, T1)]);
    expect(repo.pendiente).toBe(true);
  });

  it('la escritura funciona aunque el remoto esté caído', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RemotoControlable();
    remoto.caido = true;
    const repo = new RepositorioCompuesto(local, remoto);

    await expect(repo.guardarEstado(e('1', true, 0, T1))).resolves.toBeUndefined();
    expect(await local.cargarEstados()).toEqual([e('1', true, 0, T1)]);
    expect(repo.pendiente).toBe(true);
  });

  it('al recuperar la red, un nuevo sync sube lo pendiente y deja de estar pendiente', async () => {
    const local = new RepositorioEnMemoria();
    await local.guardarEstado(e('a', true, 0, T1));
    const remoto = new RemotoControlable();
    remoto.caido = true;
    const repo = new RepositorioCompuesto(local, remoto);

    await repo.sincronizar(); // falla (offline)
    expect(repo.pendiente).toBe(true);

    remoto.caido = false; // vuelve la red
    await repo.sincronizar();

    expect(repo.pendiente).toBe(false);
    expect(await remoto.interno.cargarEstados()).toEqual([e('a', true, 0, T1)]);
  });
});
