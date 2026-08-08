import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validarColeccion, validarEstados } from './validacion';
import type { Coleccion } from './tipos';

/**
 * Tests de los invariantes del modelo.
 * Fuente de la verdad: docs/03-modelo-de-datos.md (sección "Reglas e invariantes")
 * y docs/04-especificacion-funcional.md (HU-07).
 */

/** Colección mínima válida usada como base en los tests. */
function coleccionValida(): Coleccion {
  return {
    id: 'test',
    nombre: 'Test',
    temporada: '2026/2027',
    version: 1,
    categorias: [
      {
        id: 'equipo-a',
        nombre: 'Equipo A',
        tipo: 'equipo',
        orden: 1,
        color: '#FF0000',
        cromos: [
          { numero: '1', nombre: 'Jugador 1', orden: 1 },
          { numero: '2', nombre: null, orden: 2 },
        ],
      },
      {
        id: 'fichajes',
        nombre: 'Fichajes',
        tipo: 'fichajes',
        orden: 99,
        color: null,
        cromos: [{ numero: 'F1', nombre: null, orden: 1 }],
      },
    ],
  };
}

describe('validarColeccion — estructura', () => {
  it('acepta una colección válida', () => {
    expect(validarColeccion(coleccionValida())).toEqual({ ok: true });
  });

  it('rechaza algo que no es un objeto', () => {
    const r = validarColeccion(null);
    expect(r.ok).toBe(false);
  });

  it('rechaza si faltan campos obligatorios', () => {
    const c = coleccionValida() as unknown as Record<string, unknown>;
    delete c.temporada;
    const r = validarColeccion(c);
    expect(r.ok).toBe(false);
  });

  it('rechaza un tipo de categoría no permitido', () => {
    const c = coleccionValida();
    // @ts-expect-error: forzamos un tipo inválido para el test
    c.categorias[0].tipo = 'jugadores';
    const r = validarColeccion(c);
    expect(r.ok).toBe(false);
  });
});

describe('validarColeccion — invariante 1: unicidad de numero', () => {
  it('rechaza números duplicados dentro de la misma categoría', () => {
    const c = coleccionValida();
    c.categorias[0].cromos[1].numero = '1';
    const r = validarColeccion(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(' ')).toMatch(/duplicad/i);
  });

  it('rechaza números duplicados entre categorías distintas', () => {
    const c = coleccionValida();
    c.categorias[1].cromos[0].numero = '1';
    const r = validarColeccion(c);
    expect(r.ok).toBe(false);
  });
});

describe('validarEstados — invariante 2: referencia válida', () => {
  it('acepta estados que referencian cromos existentes', () => {
    const c = coleccionValida();
    const r = validarEstados(
      [{ numero: '1', tenido: true, repes: 0, actualizado: '2026-08-08T10:00:00Z' }],
      c,
    );
    expect(r).toEqual({ ok: true });
  });

  it('rechaza un estado que referencia un número inexistente', () => {
    const c = coleccionValida();
    const r = validarEstados(
      [{ numero: '999', tenido: true, repes: 0, actualizado: '2026-08-08T10:00:00Z' }],
      c,
    );
    expect(r.ok).toBe(false);
  });
});

describe('validarEstados — invariante 3: repes >= 0', () => {
  it('rechaza repes negativos', () => {
    const c = coleccionValida();
    const r = validarEstados(
      [{ numero: '1', tenido: true, repes: -1, actualizado: '2026-08-08T10:00:00Z' }],
      c,
    );
    expect(r.ok).toBe(false);
  });

  it('acepta repes = 0', () => {
    const c = coleccionValida();
    const r = validarEstados(
      [{ numero: '1', tenido: true, repes: 0, actualizado: '2026-08-08T10:00:00Z' }],
      c,
    );
    expect(r.ok).toBe(true);
  });
});

describe('validarEstados — invariante 4: coherencia repes/tenido', () => {
  it('rechaza repes > 0 cuando tenido es false', () => {
    const c = coleccionValida();
    const r = validarEstados(
      [{ numero: '1', tenido: false, repes: 2, actualizado: '2026-08-08T10:00:00Z' }],
      c,
    );
    expect(r.ok).toBe(false);
  });

  it('acepta repes > 0 cuando tenido es true', () => {
    const c = coleccionValida();
    const r = validarEstados(
      [{ numero: '1', tenido: true, repes: 2, actualizado: '2026-08-08T10:00:00Z' }],
      c,
    );
    expect(r.ok).toBe(true);
  });
});

describe('semilla public/coleccion.json', () => {
  it('cumple el esquema y los invariantes del catálogo', () => {
    const ruta = resolve(process.cwd(), 'public/coleccion.json');
    const datos = JSON.parse(readFileSync(ruta, 'utf-8'));
    expect(validarColeccion(datos)).toEqual({ ok: true });
  });
});
