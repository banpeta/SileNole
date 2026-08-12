import { describe, it, expect, beforeEach } from 'vitest';
import {
  leerRegistro,
  listar,
  activaId,
  setActiva,
  anadir,
  eliminar,
  existe,
} from './registroColecciones';

/**
 * Tests del registro de colecciones (Fase 9.1, ADR-011).
 * Fuente: docs/03 (registro) y docs/04 (HU-10/12).
 */

describe('registroColecciones', () => {
  beforeEach(() => {
    localStorage.removeItem('silenole:registro');
  });

  it('parte vacío: sin colecciones y sin activa', () => {
    expect(listar()).toEqual([]);
    expect(activaId()).toBeNull();
  });

  it('añade una colección y la deja activa si es la primera', () => {
    anadir({ id: 'laliga-este-26-27', nombre: 'LaLiga 26/27' });
    expect(listar()).toEqual([{ id: 'laliga-este-26-27', nombre: 'LaLiga 26/27' }]);
    expect(activaId()).toBe('laliga-este-26-27');
    expect(existe('laliga-este-26-27')).toBe(true);
  });

  it('no duplica al añadir el mismo id (actualiza el nombre) y no cambia la activa', () => {
    anadir({ id: 'a', nombre: 'A' });
    anadir({ id: 'b', nombre: 'B' });
    anadir({ id: 'a', nombre: 'A2' });
    expect(listar()).toEqual([
      { id: 'a', nombre: 'A2' },
      { id: 'b', nombre: 'B' },
    ]);
    expect(activaId()).toBe('a'); // la primera sigue activa
  });

  it('cambia la colección activa', () => {
    anadir({ id: 'a', nombre: 'A' });
    anadir({ id: 'b', nombre: 'B' });
    setActiva('b');
    expect(activaId()).toBe('b');
  });

  it('ignora activar un id que no existe', () => {
    anadir({ id: 'a', nombre: 'A' });
    setActiva('desconocida');
    expect(activaId()).toBe('a');
  });

  it('elimina una colección; si era la activa, pasa a otra (o null)', () => {
    anadir({ id: 'a', nombre: 'A' });
    anadir({ id: 'b', nombre: 'B' });
    setActiva('a');
    eliminar('a');
    expect(existe('a')).toBe(false);
    expect(listar().map((c) => c.id)).toEqual(['b']);
    expect(activaId()).toBe('b'); // reasigna la activa

    eliminar('b');
    expect(listar()).toEqual([]);
    expect(activaId()).toBeNull();
  });

  it('persiste entre lecturas (localStorage)', () => {
    anadir({ id: 'a', nombre: 'A' });
    setActiva('a');
    const r = leerRegistro();
    expect(r.colecciones).toEqual([{ id: 'a', nombre: 'A' }]);
    expect(r.activaId).toBe('a');
  });
});
