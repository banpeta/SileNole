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

import { createClient } from '@supabase/supabase-js';
import { RepositorioSupabase, type ClienteRpc } from './repositorioSupabase';

export function crearClienteSupabase(): ClienteRpc | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  return createClient(url, clave);
}

/** Crea un RepositorioSupabase para un código, o null si no hay configuración. */
export function crearRepositorioSupabase(codigo: string): RepositorioSupabase | null {
  const cliente = crearClienteSupabase();
  return cliente ? new RepositorioSupabase(cliente, codigo) : null;
}
