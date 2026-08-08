import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from './repositorio';
import { RepositorioEnMemoria } from './repositorio';
import { RepositorioIndexedDB } from './repositorioIndexedDB';

/**
 * Tests del contrato del repositorio (ADR-003).
 * Se ejecuta la MISMA batería contra la implementación en memoria y contra la
 * de IndexedDB, para garantizar que se comportan igual.
 */

function coleccion(): Coleccion {
  return {
    id: 'laliga-este-26-27',
    nombre: 'La Liga Este 26/27',
    temporada: '2026/2027',
    version: 1,
    categorias: [
      {
        id: 'a',
        nombre: 'Equipo A',
        tipo: 'equipo',
        orden: 1,
        color: null,
        cromos: [{ numero: '1', nombre: null, orden: 1 }],
      },
    ],
  };
}

const T = '2026-08-08T10:00:00.000Z';

function bateriaContrato(nombre: string, crear: () => ColeccionRepository) {
  describe(`ColeccionRepository — ${nombre}`, () => {
    let repo: ColeccionRepository;
    beforeEach(() => {
      repo = crear();
    });

    it('devuelve null si no hay colección guardada', async () => {
      expect(await repo.cargarColeccion()).toBeNull();
    });

    it('guarda y recupera la colección', async () => {
      await repo.guardarColeccion(coleccion());
      expect(await repo.cargarColeccion()).toEqual(coleccion());
    });

    it('devuelve lista vacía si no hay estados', async () => {
      expect(await repo.cargarEstados()).toEqual([]);
    });

    it('guarda un estado y lo recupera', async () => {
      const e: EstadoCromo = { numero: '1', tenido: true, repes: 0, actualizado: T };
      await repo.guardarEstado(e);
      expect(await repo.cargarEstados()).toEqual([e]);
    });

    it('actualiza (no duplica) el estado del mismo número', async () => {
      await repo.guardarEstado({ numero: '1', tenido: true, repes: 0, actualizado: T });
      await repo.guardarEstado({ numero: '1', tenido: true, repes: 2, actualizado: T });
      const estados = await repo.cargarEstados();
      expect(estados).toHaveLength(1);
      expect(estados[0].repes).toBe(2);
    });

    it('guarda varios estados de una vez', async () => {
      await repo.guardarEstados([
        { numero: '1', tenido: true, repes: 0, actualizado: T },
        { numero: '2', tenido: false, repes: 0, actualizado: T },
      ]);
      expect((await repo.cargarEstados()).length).toBe(2);
    });
  });
}

bateriaContrato('en memoria', () => new RepositorioEnMemoria());
bateriaContrato('IndexedDB', () => new RepositorioIndexedDB(`test-${Math.random()}`));
