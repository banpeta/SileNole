import { describe, it, expect, beforeEach } from 'vitest';
import {
  esCodigoValido,
  normalizarCodigo,
  generarCodigo,
  leerCodigo,
  guardarCodigo,
  borrarCodigo,
} from './codigoColeccion';

/**
 * Tests del código de colección (Fase 7.4, ADR-008).
 * Fuente: docs/04 HU-09 (emparejar por código, rechazar formato inválido).
 */

describe('esCodigoValido', () => {
  it('acepta un UUID bien formado', () => {
    expect(esCodigoValido('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(esCodigoValido(generarCodigo())).toBe(true);
  });

  it('acepta con espacios alrededor y mayúsculas', () => {
    expect(esCodigoValido('  11111111-1111-4111-8111-111111111111  ')).toBe(true);
    expect(esCodigoValido('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).toBe(true);
  });

  it('rechaza texto que no es un UUID', () => {
    expect(esCodigoValido('')).toBe(false);
    expect(esCodigoValido('hola')).toBe(false);
    expect(esCodigoValido('1234')).toBe(false);
    expect(esCodigoValido('11111111-1111-1111-1111')).toBe(false);
  });
});

describe('generarCodigo', () => {
  it('genera códigos válidos y distintos', () => {
    const a = generarCodigo();
    const b = generarCodigo();
    expect(esCodigoValido(a)).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe('normalizarCodigo', () => {
  it('recorta y pasa a minúsculas', () => {
    expect(normalizarCodigo('  AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE ')).toBe(
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    );
  });
});

describe('persistencia en local', () => {
  beforeEach(() => localStorage.clear());

  it('devuelve null si no hay código', () => {
    expect(leerCodigo()).toBeNull();
  });

  it('guarda (normalizado), lee y borra', () => {
    guardarCodigo('  AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE ');
    expect(leerCodigo()).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    borrarCodigo();
    expect(leerCodigo()).toBeNull();
  });
});
