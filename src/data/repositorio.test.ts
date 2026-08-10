import 'fake-indexeddb/auto';
import { bateriaContrato } from './contratoRepositorio';
import { RepositorioEnMemoria } from './repositorio';
import { RepositorioIndexedDB } from './repositorioIndexedDB';

/**
 * Tests del contrato del repositorio (ADR-003).
 * Se ejecuta la MISMA batería (contratoRepositorio.ts) contra la implementación
 * en memoria y contra la de IndexedDB, para garantizar que se comportan igual.
 */

bateriaContrato('en memoria', () => new RepositorioEnMemoria());
bateriaContrato('IndexedDB', () => new RepositorioIndexedDB(`test-${Math.random()}`));
