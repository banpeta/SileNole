/**
 * Abstracción del canal de tiempo real (Fase 7.6, ADR-010).
 *
 * La app depende de esta interfaz, no de Supabase, para poder testear la
 * orquestación con un doble. La implementación real (Supabase Realtime
 * Broadcast) vive en supabaseCliente.ts y se carga de forma diferida.
 */

export interface CanalTiempoReal {
  /** Avisa a los demás dispositivos de que ha habido un cambio local. */
  emitir(): void;
  /** Cierra la suscripción. */
  cerrar(): void;
}

/**
 * Crea un canal de tiempo real para un `codigo`. `alRecibirCambio` se invoca
 * cuando OTRO dispositivo avisa de un cambio (no los avisos propios).
 * Puede ser síncrono (tests) o asíncrono (Supabase, carga diferida). Devuelve
 * null si el tiempo real no está disponible.
 */
export type CrearCanal = (
  codigo: string,
  alRecibirCambio: () => void,
) => (CanalTiempoReal | null) | Promise<CanalTiempoReal | null>;
