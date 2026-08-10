/**
 * Repositorio compuesto offline-first (Fase 7.3, ADR-009).
 *
 * Fuente de la verdad: docs/02 (ADR-009), docs/04 (HU-09: offline-first y
 * primera sincronización).
 *
 * Combina un repositorio LOCAL (IndexedDB: fuente de verdad para lectura y
 * escritura inmediata) con un repositorio REMOTO opcional (Supabase). Las
 * escrituras van siempre primero al local y quedan marcadas como pendientes de
 * subir. `sincronizar()` hace SIEMPRE descargar + fusionar + subir (nunca
 * "descargar y reemplazar lo local"), de modo que el primer sync con la nube
 * vacía conserva todo lo local.
 *
 * No hay una "cola de salida" persistida aparte: como el local es el conjunto
 * completo y siempre subimos el resultado fusionado, basta con volver a
 * sincronizar (al arrancar o al recuperar la red) para que lo pendiente suba.
 *
 * Un fallo del remoto nunca lanza hacia la UI ni pierde datos locales: se
 * traga el error y se mantiene el estado "pendiente" para reintentar.
 */

import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from './repositorio';
import { fusionarEstados, fusionarCatalogo } from '../domain/fusion';

export class RepositorioCompuesto implements ColeccionRepository {
  private _pendiente = false;

  constructor(
    private readonly local: ColeccionRepository,
    private readonly remoto: ColeccionRepository | null,
  ) {}

  /** Hay cambios locales aún no confirmados en la nube. */
  get pendiente(): boolean {
    return this._pendiente;
  }

  private marcarPendiente(): void {
    if (this.remoto) this._pendiente = true;
  }

  // --- Lecturas: siempre del local (rápidas y disponibles offline) ---

  cargarColeccion(): Promise<Coleccion | null> {
    return this.local.cargarColeccion();
  }

  cargarEstados(): Promise<EstadoCromo[]> {
    return this.local.cargarEstados();
  }

  // --- Escrituras: al local de inmediato; el empuje a la nube es diferido ---

  async guardarColeccion(coleccion: Coleccion): Promise<void> {
    await this.local.guardarColeccion(coleccion);
    this.marcarPendiente();
  }

  async guardarEstado(estado: EstadoCromo): Promise<void> {
    await this.local.guardarEstado(estado);
    this.marcarPendiente();
  }

  async guardarEstados(estados: EstadoCromo[]): Promise<void> {
    await this.local.guardarEstados(estados);
    this.marcarPendiente();
  }

  async reemplazarEstados(estados: EstadoCromo[]): Promise<void> {
    await this.local.reemplazarEstados(estados);
    this.marcarPendiente();
  }

  /**
   * Descarga el estado remoto, lo fusiona con el local (LWW), guarda el
   * resultado en el local y lo sube a la nube. No lanza: si el remoto falla,
   * conserva lo local y deja `pendiente` en true para reintentar.
   */
  async sincronizar(): Promise<void> {
    if (!this.remoto) return;
    try {
      const [locEstados, remEstados, locCol, remCol] = await Promise.all([
        this.local.cargarEstados(),
        this.remoto.cargarEstados(),
        this.local.cargarColeccion(),
        this.remoto.cargarColeccion(),
      ]);

      const estadosFusionados = fusionarEstados(locEstados, remEstados);
      // El catálogo se fusiona por versión (el local no guarda sello de fecha;
      // los sellos vacíos hacen que fusionarCatalogo compare solo la versión).
      const catalogo =
        fusionarCatalogo(
          locCol ? { coleccion: locCol, actualizado: '' } : null,
          remCol ? { coleccion: remCol, actualizado: '' } : null,
        )?.coleccion ?? null;

      // Local primero (durabilidad): si el push remoto falla luego, no se pierde.
      await this.local.reemplazarEstados(estadosFusionados);
      if (catalogo && catalogo !== locCol) await this.local.guardarColeccion(catalogo);

      // Empuje a la nube.
      if (catalogo) await this.remoto.guardarColeccion(catalogo);
      await this.remoto.reemplazarEstados(estadosFusionados);

      this._pendiente = false;
    } catch {
      // Sin red o error remoto: conservamos lo local y reintentaremos luego.
      this._pendiente = true;
    }
  }
}
