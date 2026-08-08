import { describe, it, expect } from 'vitest';
import type { Coleccion, EstadoCromo } from '../model/tipos';
import {
  progresoCategoria,
  progresoTotal,
  totalFaltan,
  categoriaCompleta,
  cromosQueFaltan,
  cromosParaCambiar,
} from './progreso';
import type { MapaEstados } from './estado';

/**
 * Tests de los cálculos derivados.
 * Fuente: docs/03-modelo-de-datos.md ("valores derivados") y
 * docs/04-especificacion-funcional.md (HU-04, HU-05, HU-08).
 */

function coleccion(): Coleccion {
  return {
    id: 'test',
    nombre: 'Test',
    temporada: '2026/2027',
    version: 1,
    categorias: [
      {
        id: 'a',
        nombre: 'Equipo A',
        tipo: 'equipo',
        orden: 1,
        color: null,
        cromos: [
          { numero: '1', nombre: null, orden: 1 },
          { numero: '2', nombre: null, orden: 2 },
        ],
      },
      {
        id: 'b',
        nombre: 'Equipo B',
        tipo: 'equipo',
        orden: 2,
        color: null,
        cromos: [{ numero: '3', nombre: null, orden: 1 }],
      },
    ],
  };
}

function mapa(...estados: EstadoCromo[]): MapaEstados {
  return new Map(estados.map((e) => [e.numero, e]));
}

const T = '2026-08-08T10:00:00.000Z';

describe('progresoCategoria — HU-01/HU-04', () => {
  it('cuenta conseguidos sobre el total de la categoría', () => {
    const c = coleccion();
    const m = mapa({ numero: '1', tenido: true, repes: 0, actualizado: T });
    expect(progresoCategoria(c.categorias[0], m)).toEqual({
      conseguidos: 1,
      total: 2,
      completa: false,
    });
  });

  it('marca completa cuando están todos', () => {
    const c = coleccion();
    const m = mapa(
      { numero: '1', tenido: true, repes: 0, actualizado: T },
      { numero: '2', tenido: true, repes: 0, actualizado: T },
    );
    expect(progresoCategoria(c.categorias[0], m).completa).toBe(true);
  });

  it('trata como "me falta" un cromo sin estado guardado', () => {
    const c = coleccion();
    expect(progresoCategoria(c.categorias[0], new Map())).toEqual({
      conseguidos: 0,
      total: 2,
      completa: false,
    });
  });
});

describe('categoriaCompleta', () => {
  it('es false si falta alguno', () => {
    const c = coleccion();
    const m = mapa({ numero: '1', tenido: true, repes: 0, actualizado: T });
    expect(categoriaCompleta(c.categorias[0], m)).toBe(false);
  });
});

describe('progresoTotal — HU-04', () => {
  it('suma conseguidos y totales de toda la colección', () => {
    const c = coleccion();
    const m = mapa(
      { numero: '1', tenido: true, repes: 0, actualizado: T },
      { numero: '3', tenido: true, repes: 0, actualizado: T },
    );
    expect(progresoTotal(c, m)).toEqual({ conseguidos: 2, total: 3, completa: false });
  });

  it('completa cuando están todos', () => {
    const c = coleccion();
    const m = mapa(
      { numero: '1', tenido: true, repes: 0, actualizado: T },
      { numero: '2', tenido: true, repes: 0, actualizado: T },
      { numero: '3', tenido: true, repes: 0, actualizado: T },
    );
    expect(progresoTotal(c, m).completa).toBe(true);
  });
});

describe('totalFaltan', () => {
  it('cuenta los cromos que faltan en toda la colección', () => {
    const c = coleccion();
    const m = mapa({ numero: '1', tenido: true, repes: 0, actualizado: T });
    expect(totalFaltan(c, m)).toBe(2); // total 3 - 1 conseguido
  });
});

describe('cromosQueFaltan — HU-05', () => {
  it('devuelve solo los que faltan, agrupados por categoría', () => {
    const c = coleccion();
    const m = mapa({ numero: '1', tenido: true, repes: 0, actualizado: T });
    const faltan = cromosQueFaltan(c, m);
    expect(faltan).toHaveLength(2);
    expect(faltan[0].categoria.id).toBe('a');
    expect(faltan[0].cromos.map((x) => x.numero)).toEqual(['2']);
    expect(faltan[1].cromos.map((x) => x.numero)).toEqual(['3']);
  });

  it('omite categorías sin cromos faltantes', () => {
    const c = coleccion();
    const m = mapa(
      { numero: '1', tenido: true, repes: 0, actualizado: T },
      { numero: '2', tenido: true, repes: 0, actualizado: T },
    );
    const faltan = cromosQueFaltan(c, m);
    expect(faltan.map((g) => g.categoria.id)).toEqual(['b']);
  });

  it('devuelve lista vacía si la colección está completa', () => {
    const c = coleccion();
    const m = mapa(
      { numero: '1', tenido: true, repes: 0, actualizado: T },
      { numero: '2', tenido: true, repes: 0, actualizado: T },
      { numero: '3', tenido: true, repes: 0, actualizado: T },
    );
    expect(cromosQueFaltan(c, m)).toEqual([]);
  });
});

describe('cromosParaCambiar — HU-08', () => {
  it('devuelve los cromos con repes > 0', () => {
    const c = coleccion();
    const m = mapa(
      { numero: '1', tenido: true, repes: 2, actualizado: T },
      { numero: '2', tenido: true, repes: 0, actualizado: T },
    );
    const cambiar = cromosParaCambiar(c, m);
    expect(cambiar).toHaveLength(1);
    expect(cambiar[0].cromo.numero).toBe('1');
    expect(cambiar[0].repes).toBe(2);
    expect(cambiar[0].categoria.id).toBe('a');
  });

  it('lista vacía si no hay repes', () => {
    const c = coleccion();
    expect(cromosParaCambiar(c, new Map())).toEqual([]);
  });
});
