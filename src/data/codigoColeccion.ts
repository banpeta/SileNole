/**
 * Código de colección (Fase 7.4, ADR-008).
 *
 * Identidad "sin cuentas": un UUID aleatorio que empareja dispositivos. Se
 * genera en el primer dispositivo y se pega en los demás. Se guarda en local
 * (localStorage) porque es configuración del dispositivo, no parte de la
 * colección (por eso no vive en ColeccionRepository).
 */

const CLAVE = 'silenole:codigo';

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

/** Lee el código guardado en este dispositivo, o null si no hay. */
export function leerCodigo(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

/** Guarda el código en este dispositivo (normalizado). */
export function guardarCodigo(codigo: string): void {
  try {
    localStorage.setItem(CLAVE, normalizarCodigo(codigo));
  } catch {
    /* almacenamiento no disponible: la sincronización quedará inactiva */
  }
}

/** Borra el código (deja de sincronizar en este dispositivo). */
export function borrarCodigo(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que hacer */
  }
}
