/**
 * Tipos del modelo de dominio.
 *
 * Fuente de la verdad: docs/03-modelo-de-datos.md
 *
 * El CATÁLOGO (qué categorías y números existen) se mantiene separado del
 * ESTADO DEL USUARIO (qué tiene y qué le falta), para poder actualizar el
 * catálogo sin perder el progreso y facilitar la sincronización futura.
 */

export type TipoCategoria = 'equipo' | 'fichajes' | 'especial';

/** Un cromo del catálogo. `numero` es único en toda la colección. */
export interface Cromo {
  /** Identificador único en toda la colección (no tiene por qué ser legible). */
  numero: string;
  /** Número/código impreso que se muestra (ej. "5", "18A"). Si falta, se usa `numero`. */
  etiqueta?: string | null;
  /** Nombre del jugador/elemento (opcional). */
  nombre: string | null;
  /** Orden dentro de la categoría. */
  orden: number;
}

/** Texto que se muestra de un cromo: su etiqueta si tiene, o su número. */
export function etiquetaVisible(cromo: Cromo): string {
  return cromo.etiqueta ?? cromo.numero;
}

/** Una categoría: un equipo, la sección Fichajes o una sección especial. */
export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoCategoria;
  orden: number;
  /** Color de acento (opcional). */
  color: string | null;
  cromos: Cromo[];
}

/** El catálogo completo de una colección. */
export interface Coleccion {
  id: string;
  nombre: string;
  temporada: string;
  /** Versión del catálogo; sube al corregir datos. */
  version: number;
  categorias: Categoria[];
}

/**
 * Estado del usuario para un cromo concreto.
 * Un cromo sin estado guardado se considera { tenido: false, repes: 0 }.
 */
export interface EstadoCromo {
  numero: string;
  tenido: boolean;
  /** Repetidos disponibles para cambiar. >= 0. Si > 0, tenido === true. */
  repes: number;
  /** Fecha/hora ISO 8601 del último cambio (para fusionar en sincronización). */
  actualizado: string;
}
