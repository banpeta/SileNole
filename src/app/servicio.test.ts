import { describe, it, expect, vi } from 'vitest';
import { RepositorioEnMemoria } from '../data/repositorio';
import { obtenerColeccion, estadosAMapa, importarColeccion } from './servicio';
import { coleccionEjemplo, tengo } from '../test/fixtures';

/**
 * Tests del servicio de aplicación (carga inicial del catálogo).
 * Fuente: docs/04-especificacion-funcional.md (HU-06, HU-07) y ADR-005.
 */

describe('obtenerColeccion', () => {
  it('si no hay catálogo guardado, carga la semilla, la valida y la guarda', async () => {
    const repo = new RepositorioEnMemoria();
    const semilla = vi.fn().mockResolvedValue(coleccionEjemplo());

    const col = await obtenerColeccion(repo, semilla);

    expect(col.id).toBe('ejemplo');
    expect(semilla).toHaveBeenCalledOnce();
    // Se ha persistido: una segunda llamada ya no usa la semilla.
    expect(await repo.cargarColeccion()).not.toBeNull();
  });

  it('si ya hay catálogo guardado y la semilla no es más nueva, conserva el guardado', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo()); // version 1
    // Semilla con la misma version pero distinto nombre: no debe adoptarse.
    const semilla = vi.fn().mockResolvedValue({ ...coleccionEjemplo(), nombre: 'Otra' });

    const col = await obtenerColeccion(repo, semilla);

    expect(col.nombre).toBe('Colección de ejemplo');
  });

  it('adopta la semilla si trae una version mayor, conservando el progreso', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo()); // version 1 (equipos A y B)
    await repo.guardarEstados([tengo('1', 2), tengo('3')]); // '3' es del Equipo B

    // Semilla v2: solo el Equipo A (números 1 y 2). El '3' desaparece.
    const nueva = {
      ...coleccionEjemplo(),
      version: 2,
      categorias: [coleccionEjemplo().categorias[0]],
    };
    const semilla = vi.fn().mockResolvedValue(nueva);

    const col = await obtenerColeccion(repo, semilla);

    expect(col.version).toBe(2);
    const estados = await repo.cargarEstados();
    expect(estados.map((e) => e.numero).sort()).toEqual(['1']); // '3' podado
    expect(estados.find((e) => e.numero === '1')?.repes).toBe(2); // progreso conservado
  });

  it('si la semilla no se puede cargar (offline) y hay guardado, usa el guardado', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo());
    const semilla = vi.fn().mockRejectedValue(new Error('sin red'));

    const col = await obtenerColeccion(repo, semilla);

    expect(col.id).toBe('ejemplo');
  });

  it('rechaza una semilla inválida con un error claro si no hay catálogo guardado', async () => {
    const repo = new RepositorioEnMemoria();
    const semilla = vi.fn().mockResolvedValue({ id: 'malo' });
    await expect(obtenerColeccion(repo, semilla)).rejects.toThrow();
  });

  it('si la semilla es inválida pero hay catálogo guardado, conserva el guardado', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo());
    const semilla = vi.fn().mockResolvedValue({ id: 'malo' });

    const col = await obtenerColeccion(repo, semilla);

    expect(col.id).toBe('ejemplo');
  });
});

describe('importarColeccion — HU-07', () => {
  it('rechaza datos inválidos sin cambiar el catálogo guardado', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo());

    const r = await importarColeccion(repo, { id: 'malo' });

    expect(r.ok).toBe(false);
    expect((await repo.cargarColeccion())?.id).toBe('ejemplo'); // intacto
  });

  it('guarda el catálogo válido y conserva el estado de los números que siguen existiendo', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo());
    // Estado previo: '1' (existirá tras importar) y '3' (desaparecerá).
    await repo.guardarEstados([tengo('1', 2), tengo('3')]);

    // Nuevo catálogo: solo el Equipo A (números 1 y 2). El '3' ya no existe.
    const nuevo = { ...coleccionEjemplo(), categorias: [coleccionEjemplo().categorias[0]] };
    const r = await importarColeccion(repo, nuevo);

    expect(r).toEqual({ ok: true });
    const estados = await repo.cargarEstados();
    expect(estados.map((e) => e.numero).sort()).toEqual(['1']); // '3' podado
    expect(estados.find((e) => e.numero === '1')?.repes).toBe(2); // conservado
  });
});

describe('estadosAMapa', () => {
  it('indexa los estados por número', () => {
    const mapa = estadosAMapa([tengo('1'), tengo('3')]);
    expect(mapa.get('1')?.tenido).toBe(true);
    expect(mapa.has('3')).toBe(true);
    expect(mapa.size).toBe(2);
  });
});
