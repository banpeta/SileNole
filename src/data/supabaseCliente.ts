/**
 * Factory del cliente Supabase (Fase 7.2).
 *
 * Lee la configuración de las variables de entorno de Vite
 * (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Si no están configuradas,
 * devuelve `null`: la app sigue funcionando en modo local (ADR-009), la
 * sincronización es opcional.
 *
 * Aquí NO hay tests unitarios porque solo cablea el cliente real con el entorno;
 * la lógica del repositorio se prueba con un doble en repositorioSupabase.test.ts.
 */

import { RepositorioSupabase, type ClienteRpc } from './repositorioSupabase';
import type { CanalTiempoReal } from './tiempoReal';

/**
 * `@supabase/supabase-js` se carga de forma DIFERIDA (import dinámico), para que
 * no entre en el bundle inicial: solo se descarga cuando el usuario activa la
 * sincronización (hay URL, clave y código).
 */
export async function crearClienteSupabase(): Promise<ClienteRpc | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, clave);
}

/** Crea un RepositorioSupabase para un código, o null si no hay configuración. */
export async function crearRepositorioSupabase(codigo: string): Promise<RepositorioSupabase | null> {
  const cliente = await crearClienteSupabase();
  return cliente ? new RepositorioSupabase(cliente, codigo) : null;
}

/**
 * Canal de tiempo real (Fase 7.6, ADR-010) por Broadcast en el canal del
 * `codigo`. No lee la base de datos: solo transmite/recibe avisos de cambio.
 * `self: false` evita recibir los avisos propios. Devuelve null si no hay
 * configuración de Supabase.
 */
export async function crearCanalSupabase(
  codigo: string,
  alRecibirCambio: () => void,
): Promise<CanalTiempoReal | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  const { createClient } = await import('@supabase/supabase-js');
  const cliente = createClient(url, clave);
  const canal = cliente.channel(`silenole-${codigo}`, {
    config: { broadcast: { self: false } },
  });
  canal.on('broadcast', { event: 'cambio' }, () => alRecibirCambio());
  canal.subscribe();
  return {
    emitir: () => {
      void canal.send({ type: 'broadcast', event: 'cambio', payload: {} });
    },
    cerrar: () => {
      void cliente.removeChannel(canal);
    },
  };
}
