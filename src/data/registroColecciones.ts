/**
 * Registro de colecciones (Fase 9.1, ADR-011).
 *
 * Pequeño registro local (localStorage) con la lista de colecciones existentes
 * y cuál está activa. Es configuración del dispositivo, aparte de los datos de
 * cada colección (que viven en su propio ColeccionRepository).
 */

const CLAVE = 'silenole:registro';

/** Resumen de una colección para la lista. */
export interface ColeccionInfo {
  id: string;
  nombre: string;
}

export interface Registro {
  colecciones: ColeccionInfo[];
  activaId: string | null;
}

export function leerRegistro(): Registro {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return { colecciones: [], activaId: null };
    const r = JSON.parse(crudo) as Registro;
    return {
      colecciones: Array.isArray(r.colecciones) ? r.colecciones : [],
      activaId: r.activaId ?? null,
    };
  } catch {
    return { colecciones: [], activaId: null };
  }
}

export function guardarRegistro(r: Registro): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(r));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function listar(): ColeccionInfo[] {
  return leerRegistro().colecciones;
}

export function activaId(): string | null {
  return leerRegistro().activaId;
}

export function existe(id: string): boolean {
  return leerRegistro().colecciones.some((c) => c.id === id);
}

/** Alta de una colección. Si ya existe, actualiza su nombre. La primera queda activa. */
export function anadir(info: ColeccionInfo): void {
  const r = leerRegistro();
  const i = r.colecciones.findIndex((c) => c.id === info.id);
  if (i >= 0) r.colecciones[i] = info;
  else r.colecciones.push(info);
  if (r.activaId === null) r.activaId = info.id;
  guardarRegistro(r);
}

/** Marca una colección como activa (solo si existe). */
export function setActiva(id: string): void {
  const r = leerRegistro();
  if (r.colecciones.some((c) => c.id === id)) {
    r.activaId = id;
    guardarRegistro(r);
  }
}

/** Elimina una colección del registro. Si era la activa, reasigna a otra o null. */
export function eliminar(id: string): void {
  const r = leerRegistro();
  r.colecciones = r.colecciones.filter((c) => c.id !== id);
  if (r.activaId === id) r.activaId = r.colecciones[0]?.id ?? null;
  guardarRegistro(r);
}
