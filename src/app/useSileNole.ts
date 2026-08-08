/**
 * Hook que carga los datos de SileNole y expone la acción de marcar/desmarcar
 * con guardado automático.
 *
 * Fuente de la verdad: docs/04-especificacion-funcional.md (HU-03, HU-06).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from '../data/repositorio';
import { alternarTenido, establecerRepes, estadoDe, type MapaEstados } from '../domain/estado';
import type { ResultadoValidacion } from '../model/validacion';
import {
  obtenerColeccion,
  estadosAMapa,
  importarColeccion,
  type CargarSemilla,
} from './servicio';

export interface EstadoSileNole {
  cargando: boolean;
  error: string | null;
  coleccion: Coleccion | null;
  estados: MapaEstados;
  /** Marca/desmarca un cromo y lo guarda automáticamente. */
  alternar: (numero: string) => void;
  /** Suma o resta repetidos a un cromo (no baja de 0) y lo guarda. */
  ajustarRepes: (numero: string, delta: number) => void;
  /** Importa un catálogo nuevo conservando el estado (HU-07). */
  importarCatalogo: (datos: unknown) => Promise<ResultadoValidacion>;
}

export function useSileNole(
  repo: ColeccionRepository,
  cargarSemilla: CargarSemilla,
): EstadoSileNole {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coleccion, setColeccion] = useState<Coleccion | null>(null);
  const [estados, setEstados] = useState<Map<string, EstadoCromo>>(new Map());

  // Ref espejo del mapa de estados para leer el valor actual sin cerrar sobre
  // una versión obsoleta dentro de `alternar`.
  const estadosRef = useRef(estados);
  estadosRef.current = estados;

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const col = await obtenerColeccion(repo, cargarSemilla);
        const mapa = estadosAMapa(await repo.cargarEstados());
        if (!vivo) return;
        setColeccion(col);
        setEstados(mapa);
      } catch (e) {
        if (vivo) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [repo, cargarSemilla]);

  const alternar = useCallback(
    (numero: string) => {
      const actual = estadoDe(estadosRef.current, numero);
      const nuevo = alternarTenido(actual, new Date().toISOString());
      const mapa = new Map(estadosRef.current);
      mapa.set(numero, nuevo);
      estadosRef.current = mapa;
      setEstados(mapa);
      // Guardado automático (no bloquea la UI).
      void repo.guardarEstado(nuevo);
    },
    [repo],
  );

  const ajustarRepes = useCallback(
    (numero: string, delta: number) => {
      const actual = estadoDe(estadosRef.current, numero);
      const repes = Math.max(0, actual.repes + delta);
      const nuevo = establecerRepes(actual, repes, new Date().toISOString());
      const mapa = new Map(estadosRef.current);
      mapa.set(numero, nuevo);
      estadosRef.current = mapa;
      setEstados(mapa);
      void repo.guardarEstado(nuevo);
    },
    [repo],
  );

  const importarCatalogo = useCallback(
    async (datos: unknown): Promise<ResultadoValidacion> => {
      const resultado = await importarColeccion(repo, datos);
      if (resultado.ok) {
        const col = await repo.cargarColeccion();
        const mapa = estadosAMapa(await repo.cargarEstados());
        setColeccion(col);
        estadosRef.current = mapa;
        setEstados(mapa);
      }
      return resultado;
    },
    [repo],
  );

  return { cargando, error, coleccion, estados, alternar, ajustarRepes, importarCatalogo };
}
