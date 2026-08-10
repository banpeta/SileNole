import { describe, it, expect } from 'vitest';
import { fusionarEstados, fusionarCatalogo, type CatalogoConSello } from './fusion';
import type { Coleccion, EstadoCromo } from '../model/tipos';

/**
 * Tests de la lógica de fusión multi-dispositivo (Fase 7.1).
 * Fuente: docs/03-modelo-de-datos.md (algoritmo LWW e invariantes) y
 * docs/04-especificacion-funcional.md (HU-09).
 *
 * Funciones PURAS y deterministas: no mutan sus argumentos ni leen el reloj.
 */

const T1 = '2026-08-01T10:00:00.000Z';
const T2 = '2026-08-02T10:00:00.000Z'; // más reciente que T1

function estado(numero: string, tenido: boolean, repes: number, actualizado: string): EstadoCromo {
  return { numero, tenido, repes, actualizado };
}

describe('fusionarEstados — LWW por número (HU-09)', () => {
  it('conserva un cromo que solo existe en local', () => {
    const r = fusionarEstados([estado('a', true, 0, T1)], []);
    expect(r).toEqual([estado('a', true, 0, T1)]);
  });

  it('conserva un cromo que solo existe en remoto', () => {
    const r = fusionarEstados([], [estado('a', true, 0, T1)]);
    expect(r).toEqual([estado('a', true, 0, T1)]);
  });

  it('cuando existe en ambos, gana el de actualizado más reciente', () => {
    const local = estado('a', false, 0, T2); // más reciente
    const remoto = estado('a', true, 3, T1);
    expect(fusionarEstados([local], [remoto])).toEqual([local]);
  });

  it('gana el remoto si es el más reciente', () => {
    const local = estado('a', false, 0, T1);
    const remoto = estado('a', true, 2, T2); // más reciente
    expect(fusionarEstados([local], [remoto])).toEqual([remoto]);
  });

  it('en empate de actualizado, prevalece el remoto (determinismo)', () => {
    const local = estado('a', true, 5, T1);
    const remoto = estado('a', false, 0, T1); // mismo sello
    expect(fusionarEstados([local], [remoto])).toEqual([remoto]);
  });

  it('reaplica el invariante: si el ganador queda tenido:false, sus repes pasan a 0', () => {
    // El ganador (remoto, más reciente) trae una incoherencia repes>0 con tenido:false.
    const local = estado('a', true, 4, T1);
    const remoto = estado('a', false, 9, T2);
    expect(fusionarEstados([local], [remoto])).toEqual([estado('a', false, 0, T2)]);
  });

  it('nunca deja repes negativos', () => {
    const remoto = { numero: 'a', tenido: true, repes: -3, actualizado: T1 } as EstadoCromo;
    const [r] = fusionarEstados([], [remoto]);
    expect(r.repes).toBe(0);
  });

  it('fusiona varios números de ambos lados', () => {
    const locales = [estado('a', true, 0, T2), estado('b', true, 1, T1)];
    const remotos = [estado('b', true, 2, T2), estado('c', false, 0, T1)];
    const r = fusionarEstados(locales, remotos);
    expect(r).toEqual([
      estado('a', true, 0, T2), // solo local
      estado('b', true, 2, T2), // remoto más reciente
      estado('c', false, 0, T1), // solo remoto
    ]);
  });

  it('es idempotente: fusionar el resultado otra vez con el remoto no cambia nada', () => {
    const locales = [estado('a', true, 0, T2), estado('b', true, 1, T1)];
    const remotos = [estado('b', true, 2, T2), estado('c', false, 0, T1)];
    const una = fusionarEstados(locales, remotos);
    const dos = fusionarEstados(una, remotos);
    expect(dos).toEqual(una);
  });

  it('no muta los arrays ni los objetos de entrada', () => {
    const local = estado('a', true, 3, T1);
    const remoto = estado('a', false, 0, T2);
    const locales = [local];
    const remotos = [remoto];
    fusionarEstados(locales, remotos);
    expect(locales).toEqual([estado('a', true, 3, T1)]);
    expect(remotos).toEqual([estado('a', false, 0, T2)]);
  });
});

function coleccion(version: number): Coleccion {
  return { id: 'c', nombre: 'C', temporada: '2026/2027', version, categorias: [] };
}

function catalogo(version: number, actualizado: string): CatalogoConSello {
  return { coleccion: coleccion(version), actualizado };
}

describe('fusionarCatalogo — por versión y luego fecha (HU-09)', () => {
  it('devuelve el remoto si no hay local', () => {
    const remoto = catalogo(1, T1);
    expect(fusionarCatalogo(null, remoto)).toEqual(remoto);
  });

  it('devuelve el local si no hay remoto', () => {
    const local = catalogo(1, T1);
    expect(fusionarCatalogo(local, null)).toEqual(local);
  });

  it('devuelve null si no hay ninguno', () => {
    expect(fusionarCatalogo(null, null)).toBeNull();
  });

  it('gana la versión mayor aunque su fecha sea más antigua', () => {
    const local = catalogo(3, T1); // versión mayor, fecha antigua
    const remoto = catalogo(2, T2); // versión menor, fecha reciente
    expect(fusionarCatalogo(local, remoto)).toEqual(local);
  });

  it('a igualdad de versión, gana el actualizado más reciente', () => {
    const local = catalogo(2, T1);
    const remoto = catalogo(2, T2);
    expect(fusionarCatalogo(local, remoto)).toEqual(remoto);
  });

  it('a igualdad de versión y fecha, prevalece el remoto', () => {
    const local = catalogo(2, T1);
    const remoto = catalogo(2, T1);
    expect(fusionarCatalogo(local, remoto)).toBe(remoto);
  });
});
