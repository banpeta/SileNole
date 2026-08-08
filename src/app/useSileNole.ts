/**
 * Hook que carga los datos de SileNole y expone la acción de marcar/desmarcar
 * con guardado automático.
 *
 * Fuente de la verdad: docs/04-especificacion-funcional.md (HU-03, HU-06).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from '../data/repositorio';
import { alternarTenido, estadoDe, type MapaEstados } from '../domain/estado';
import { obtenerColeccion, estadosAMapa, type CargarSemilla } from './servicio';

export interface EstadoSileNole {
  cargando: boolean;
  error: string | null;
  coleccion: Coleccion | null;
  estados: MapaEstados;
  /** Marca/desmarca un cromo y lo guarda automáticamente. */
  alternar: (numero: string) => void;
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

  return { cargando, error, coleccion, estados, alternar };
}
