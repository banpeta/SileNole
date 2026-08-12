import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  ID_LALIGA,
  NOMBRE_LALIGA,
  nombreBdColeccion,
  bootstrapColecciones,
  crearColeccionNueva,
  borrarColeccionExistente,
  crearRepositorioLocal,
} from './colecciones';
import * as registro from '../data/registroColecciones';
import { leerCodigo, guardarCodigo } from '../data/codigoColeccion';

/**
 * Tests del servicio de colecciones (Fase 9.2/9.4).
 * Fuente: docs/02 ADR-011, docs/04 HU-10/11/12.
 */

beforeEach(() => {
  localStorage.clear?.();
  localStorage.removeItem('silenole:registro');
  localStorage.removeItem('silenole:codigo');
  localStorage.removeItem(`silenole:codigo:${ID_LALIGA}`);
});

describe('nombreBdColeccion', () => {
  it('LaLiga usa la BD existente "silenole"; las demás llevan prefijo', () => {
    expect(nombreBdColeccion(ID_LALIGA)).toBe('silenole');
    expect(nombreBdColeccion('otra')).toBe('silenole-otra');
  });
});

describe('bootstrapColecciones', () => {
  it('registra la colección LaLiga y la deja activa si el registro está vacío', () => {
    bootstrapColecciones();
    expect(registro.listar()).toEqual([{ id: ID_LALIGA, nombre: NOMBRE_LALIGA }]);
    expect(registro.activaId()).toBe(ID_LALIGA);
  });

  it('migra el código único antiguo al código por colección de LaLiga', () => {
    localStorage.setItem('silenole:codigo', '11111111-1111-4111-8111-111111111111');
    bootstrapColecciones();
    expect(leerCodigo(ID_LALIGA)).toBe('11111111-1111-4111-8111-111111111111');
    expect(localStorage.getItem('silenole:codigo')).toBeNull(); // eliminado tras migrar
  });

  it('es idempotente (no duplica ni pisa un código ya migrado)', () => {
    guardarCodigo(ID_LALIGA, '22222222-2222-4222-8222-222222222222');
    localStorage.setItem('silenole:codigo', '11111111-1111-4111-8111-111111111111');
    bootstrapColecciones();
    bootstrapColecciones();
    expect(registro.listar()).toHaveLength(1);
    expect(leerCodigo(ID_LALIGA)).toBe('22222222-2222-4222-8222-222222222222'); // no lo pisa
  });
});

describe('crear y borrar colecciones', () => {
  it('crea una colección nueva, la guarda, la registra y la deja activa', async () => {
    bootstrapColecciones();
    const id = await crearColeccionNueva({
      id: 'mi-coleccion',
      nombre: 'Mi colección',
      estructura: { tipo: 'simple', total: 4 },
    });
    expect(id).toBe('mi-coleccion');
    expect(registro.activaId()).toBe('mi-coleccion');
    expect(registro.listar().map((c) => c.id)).toContain('mi-coleccion');

    const repo = crearRepositorioLocal('mi-coleccion');
    const col = await repo.cargarColeccion();
    expect(col?.nombre).toBe('Mi colección');
    expect(col?.categorias[0].cromos).toHaveLength(4);
  });

  it('borrar quita la colección del registro y su código', async () => {
    bootstrapColecciones();
    await crearColeccionNueva({
      id: 'temporal',
      nombre: 'Temporal',
      estructura: { tipo: 'simple', total: 2 },
    });
    guardarCodigo('temporal', '33333333-3333-4333-8333-333333333333');

    await borrarColeccionExistente('temporal');

    expect(registro.existe('temporal')).toBe(false);
    expect(leerCodigo('temporal')).toBeNull();
  });
});
