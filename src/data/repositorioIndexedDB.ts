/**
 * Implementación de `ColeccionRepository` sobre IndexedDB (ADR-003).
 *
 * Guarda el catálogo en el store "coleccion" (un único registro con clave fija)
 * y los estados del usuario en el store "estados" (indexados por `numero`).
 */

import type { Coleccion, EstadoCromo } from '../model/tipos';
import type { ColeccionRepository } from './repositorio';

const STORE_COLECCION = 'coleccion';
const STORE_ESTADOS = 'estados';
const CLAVE_COLECCION = 'actual';

/** Envuelve una IDBRequest en una promesa. */
function comoPromesa<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class RepositorioIndexedDB implements ColeccionRepository {
  private db: Promise<IDBDatabase>;

  constructor(nombreBd = 'silenole') {
    this.db = this.abrir(nombreBd);
  }

  private abrir(nombreBd: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(nombreBd, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_COLECCION)) {
          db.createObjectStore(STORE_COLECCION);
        }
        if (!db.objectStoreNames.contains(STORE_ESTADOS)) {
          db.createObjectStore(STORE_ESTADOS, { keyPath: 'numero' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async tx(store: string, modo: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.db;
    return db.transaction(store, modo).objectStore(store);
  }

  async cargarColeccion(): Promise<Coleccion | null> {
    const store = await this.tx(STORE_COLECCION, 'readonly');
    const valor = await comoPromesa(store.get(CLAVE_COLECCION));
    return (valor as Coleccion | undefined) ?? null;
  }

  async guardarColeccion(coleccion: Coleccion): Promise<void> {
    const store = await this.tx(STORE_COLECCION, 'readwrite');
    await comoPromesa(store.put(coleccion, CLAVE_COLECCION));
  }

  async cargarEstados(): Promise<EstadoCromo[]> {
    const store = await this.tx(STORE_ESTADOS, 'readonly');
    return (await comoPromesa(store.getAll())) as EstadoCromo[];
  }

  async guardarEstado(estado: EstadoCromo): Promise<void> {
    const store = await this.tx(STORE_ESTADOS, 'readwrite');
    await comoPromesa(store.put(estado));
  }

  async guardarEstados(estados: EstadoCromo[]): Promise<void> {
    const store = await this.tx(STORE_ESTADOS, 'readwrite');
    await Promise.all(estados.map((e) => comoPromesa(store.put(e))));
  }
}
