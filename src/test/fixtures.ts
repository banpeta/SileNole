import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { MapaEstados } from '../domain/estado';

/** Colección de ejemplo para los tests de UI y de aplicación. */
export function coleccionEjemplo(): Coleccion {
  return {
    id: 'ejemplo',
    nombre: 'Colección de ejemplo',
    temporada: '2026/2027',
    version: 1,
    categorias: [
      {
        id: 'a',
        nombre: 'Equipo A',
        tipo: 'equipo',
        orden: 1,
        color: '#0b7a3b',
        cromos: [
          { numero: '1', nombre: 'Jugador Uno', orden: 1 },
          { numero: '2', nombre: 'Jugador Dos', orden: 2 },
        ],
      },
      {
        id: 'b',
        nombre: 'Equipo B',
        tipo: 'equipo',
        orden: 2,
        color: '#1e50a2',
        cromos: [{ numero: '3', nombre: 'Jugador Tres', orden: 1 }],
      },
    ],
  };
}

/** Construye un MapaEstados a partir de estados sueltos. */
export function mapaDe(...estados: EstadoCromo[]): MapaEstados {
  return new Map(estados.map((e) => [e.numero, e]));
}

/** Atajo para crear un estado "lo tengo". */
export function tengo(numero: string, repes = 0): EstadoCromo {
  return { numero, tenido: true, repes, actualizado: '2026-08-08T10:00:00.000Z' };
}
