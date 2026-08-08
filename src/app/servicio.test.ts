import { describe, it, expect, vi } from 'vitest';
import { RepositorioEnMemoria } from '../data/repositorio';
import { obtenerColeccion, estadosAMapa } from './servicio';
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

  it('si ya hay catálogo guardado, lo devuelve sin usar la semilla', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardarColeccion(coleccionEjemplo());
    const semilla = vi.fn().mockResolvedValue(coleccionEjemplo());

    await obtenerColeccion(repo, semilla);

    expect(semilla).not.toHaveBeenCalled();
  });

  it('rechaza una semilla inválida con un error claro', async () => {
    const repo = new RepositorioEnMemoria();
    const semilla = vi.fn().mockResolvedValue({ id: 'malo' });
    await expect(obtenerColeccion(repo, semilla)).rejects.toThrow();
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
