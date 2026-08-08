import { describe, it, expect } from 'vitest';
import { estadoDe, alternarTenido, establecerRepes, type MapaEstados } from './estado';

/**
 * Tests de las transiciones de estado del usuario.
 * Fuente: docs/04-especificacion-funcional.md (HU-03, HU-08) y los invariantes
 * de docs/03-modelo-de-datos.md.
 *
 * Las funciones son puras: reciben el instante `ahora` como parámetro para ser
 * deterministas y fáciles de testear.
 */

const AHORA = '2026-08-08T10:00:00.000Z';

describe('estadoDe — estado por defecto', () => {
  it('devuelve tenido:false, repes:0 para un cromo sin estado guardado', () => {
    const mapa: MapaEstados = new Map();
    expect(estadoDe(mapa, '7')).toEqual({
      numero: '7',
      tenido: false,
      repes: 0,
      actualizado: '',
    });
  });

  it('devuelve el estado guardado si existe', () => {
    const guardado = { numero: '7', tenido: true, repes: 2, actualizado: AHORA };
    const mapa: MapaEstados = new Map([['7', guardado]]);
    expect(estadoDe(mapa, '7')).toEqual(guardado);
  });
});

describe('alternarTenido — HU-03', () => {
  it('de "me falta" pasa a "lo tengo"', () => {
    const r = alternarTenido({ numero: '1', tenido: false, repes: 0, actualizado: '' }, AHORA);
    expect(r.tenido).toBe(true);
    expect(r.actualizado).toBe(AHORA);
  });

  it('de "lo tengo" vuelve a "me falta" y pone repes a 0', () => {
    const r = alternarTenido({ numero: '1', tenido: true, repes: 3, actualizado: '' }, AHORA);
    expect(r.tenido).toBe(false);
    expect(r.repes).toBe(0);
  });

  it('no muta el estado original', () => {
    const original = { numero: '1', tenido: false, repes: 0, actualizado: '' };
    alternarTenido(original, AHORA);
    expect(original).toEqual({ numero: '1', tenido: false, repes: 0, actualizado: '' });
  });
});

describe('establecerRepes — HU-08 / invariante 4', () => {
  it('guarda los repes indicados', () => {
    const r = establecerRepes({ numero: '1', tenido: true, repes: 0, actualizado: '' }, 3, AHORA);
    expect(r.repes).toBe(3);
    expect(r.actualizado).toBe(AHORA);
  });

  it('si repes > 0, fuerza tenido a true (invariante 4)', () => {
    const r = establecerRepes({ numero: '1', tenido: false, repes: 0, actualizado: '' }, 2, AHORA);
    expect(r.repes).toBe(2);
    expect(r.tenido).toBe(true);
  });

  it('rechaza repes negativos', () => {
    expect(() =>
      establecerRepes({ numero: '1', tenido: true, repes: 0, actualizado: '' }, -1, AHORA),
    ).toThrow();
  });

  it('rechaza repes no enteros', () => {
    expect(() =>
      establecerRepes({ numero: '1', tenido: true, repes: 0, actualizado: '' }, 1.5, AHORA),
    ).toThrow();
  });
});
