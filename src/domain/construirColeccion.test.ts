import { describe, it, expect } from 'vitest';
import { construirColeccion } from './construirColeccion';
import { validarColeccion } from '../model/validacion';

/**
 * Tests del constructor de colecciones (Fase 9.3, HU-11).
 * Funcion PURA: recibe id + nombre + estructura y devuelve una Coleccion valida.
 */

describe('construirColeccion — estructura simple', () => {
  it('crea una categoria con cromos 1..N', () => {
    const col = construirColeccion({ id: 'c1', nombre: 'Mi álbum', estructura: { tipo: 'simple', total: 3 } });
    expect(col.id).toBe('c1');
    expect(col.nombre).toBe('Mi álbum');
    expect(col.version).toBe(1);
    expect(col.categorias).toHaveLength(1);
    const cromos = col.categorias[0].cromos;
    expect(cromos.map((c) => c.etiqueta)).toEqual(['1', '2', '3']);
    expect(cromos.every((c) => c.nombre === null)).toBe(true);
    expect(new Set(cromos.map((c) => c.numero)).size).toBe(3); // numeros unicos
  });

  it('el resultado es un catálogo válido', () => {
    const col = construirColeccion({ id: 'c1', nombre: 'X', estructura: { tipo: 'simple', total: 5 } });
    expect(validarColeccion(col)).toEqual({ ok: true });
  });
});

describe('construirColeccion — estructura por secciones', () => {
  it('crea una categoria por sección con sus cantidades', () => {
    const col = construirColeccion({
      id: 'c2',
      nombre: 'Equipos',
      estructura: {
        tipo: 'secciones',
        secciones: [
          { nombre: 'Porteros', cantidad: 2 },
          { nombre: 'Defensas', cantidad: 3 },
        ],
      },
    });
    expect(col.categorias.map((c) => c.nombre)).toEqual(['Porteros', 'Defensas']);
    expect(col.categorias[0].cromos.map((c) => c.etiqueta)).toEqual(['1', '2']);
    expect(col.categorias[1].cromos.map((c) => c.etiqueta)).toEqual(['1', '2', '3']);
    // numeros unicos en toda la coleccion
    const numeros = col.categorias.flatMap((c) => c.cromos.map((cr) => cr.numero));
    expect(new Set(numeros).size).toBe(numeros.length);
    expect(validarColeccion(col)).toEqual({ ok: true });
  });
});

describe('construirColeccion — validaciones', () => {
  it('rechaza nombre vacío', () => {
    expect(() => construirColeccion({ id: 'c', nombre: '  ', estructura: { tipo: 'simple', total: 3 } })).toThrow();
  });

  it('rechaza total menor que 1 o no entero', () => {
    expect(() => construirColeccion({ id: 'c', nombre: 'X', estructura: { tipo: 'simple', total: 0 } })).toThrow();
    expect(() => construirColeccion({ id: 'c', nombre: 'X', estructura: { tipo: 'simple', total: 2.5 } })).toThrow();
  });

  it('rechaza secciones sin cromos', () => {
    expect(() =>
      construirColeccion({ id: 'c', nombre: 'X', estructura: { tipo: 'secciones', secciones: [] } }),
    ).toThrow();
    expect(() =>
      construirColeccion({
        id: 'c',
        nombre: 'X',
        estructura: { tipo: 'secciones', secciones: [{ nombre: 'A', cantidad: 0 }] },
      }),
    ).toThrow();
  });

  it('rechaza sección con nombre vacío', () => {
    expect(() =>
      construirColeccion({
        id: 'c',
        nombre: 'X',
        estructura: { tipo: 'secciones', secciones: [{ nombre: ' ', cantidad: 2 }] },
      }),
    ).toThrow();
  });
});
