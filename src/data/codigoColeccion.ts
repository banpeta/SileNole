/**
 * Código de colección (Fase 7.4 / 9, ADR-008 y ADR-011).
 *
 * Identidad "sin cuentas": un UUID que empareja dispositivos. Se guarda en local
 * (localStorage) **por colección** (`silenole:codigo:<coleccionId>`), porque cada
 * colección se sincroniza por separado.
 */

const PREFIJO = 'silenole:codigo:';

/** Formato UUID (aceptamos cualquier versión; comparación sin distinguir mayúsculas). */
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ¿El texto tiene formato de código de colección válido? */
export function esCodigoValido(codigo: string): boolean {
  return RE_UUID.test(codigo.trim());
}

/** Normaliza un código (recorta y pasa a minúsculas, como lo guarda Postgres). */
export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toLowerCase();
}

/** Genera un código de colección nuevo (UUID v4). */
export function generarCodigo(): string {
  return crypto.randomUUID();
}

/** Lee el código guardado para una colección, o null si no hay. */
export function leerCodigo(coleccionId: string): string | null {
  try {
    return localStorage.getItem(PREFIJO + coleccionId);
  } catch {
    return null;
  }
}

/** Guarda el código de una colección (normalizado). */
export function guardarCodigo(coleccionId: string, codigo: string): void {
  try {
    localStorage.setItem(PREFIJO + coleccionId, normalizarCodigo(codigo));
  } catch {
    /* almacenamiento no disponible: la sincronización quedará inactiva */
  }
}

/** Borra el código de una colección (deja de sincronizar). */
export function borrarCodigo(coleccionId: string): void {
  try {
    localStorage.removeItem(PREFIJO + coleccionId);
  } catch {
    /* nada que hacer */
  }
}
