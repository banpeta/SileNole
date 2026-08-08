import { useMemo, useState } from 'react';
import { RepositorioIndexedDB } from '../data/repositorioIndexedDB';
import type { ColeccionRepository } from '../data/repositorio';
import { cargarSemillaDesdePublic, type CargarSemilla } from './servicio';
import { useSileNole } from './useSileNole';
import { PantallaInicio } from '../ui/PantallaInicio';
import { ListaCategorias } from '../ui/ListaCategorias';
import { DetalleCategoria } from '../ui/DetalleCategoria';
import { PantallaFaltan } from '../ui/PantallaFaltan';
import { PantallaParaCambiar } from '../ui/PantallaParaCambiar';
import { PantallaEditarCatalogo } from '../ui/PantallaEditarCatalogo';

type Vista =
  | { nombre: 'inicio' }
  | { nombre: 'categorias' }
  | { nombre: 'detalle'; categoriaId: string }
  | { nombre: 'faltan' }
  | { nombre: 'cambiar' }
  | { nombre: 'editar' };

interface Props {
  /** Repositorio de datos. Por defecto IndexedDB (inyectable para tests). */
  repo?: ColeccionRepository;
  /** Origen de la semilla del catálogo (inyectable para tests). */
  cargarSemilla?: CargarSemilla;
}

export function App({ repo, cargarSemilla = cargarSemillaDesdePublic }: Props = {}) {
  const repositorio = useMemo(() => repo ?? new RepositorioIndexedDB(), [repo]);
  const { cargando, error, coleccion, estados, alternar, ajustarRepes, importarCatalogo } =
    useSileNole(repositorio, cargarSemilla);
  const [vista, setVista] = useState<Vista>({ nombre: 'inicio' });

  return (
    <div className="app">
      <header className="cabecera">
        <button className="titulo" onClick={() => setVista({ nombre: 'inicio' })}>
          SileNole
        </button>
      </header>
      <main>
        {error && <p className="error">No se pudo cargar la colección: {error}</p>}
        {cargando && !error && <p className="cargando">Cargando…</p>}
        {!cargando && coleccion && (
          <>
            {vista.nombre === 'inicio' && (
              <PantallaInicio
                coleccion={coleccion}
                estados={estados}
                onVerCategorias={() => setVista({ nombre: 'categorias' })}
                onVerFaltan={() => setVista({ nombre: 'faltan' })}
                onVerCambiar={() => setVista({ nombre: 'cambiar' })}
                onVerEditar={() => setVista({ nombre: 'editar' })}
              />
            )}
            {vista.nombre === 'categorias' && (
              <ListaCategorias
                coleccion={coleccion}
                estados={estados}
                onAbrir={(categoriaId) => setVista({ nombre: 'detalle', categoriaId })}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'detalle' &&
              (() => {
                const categoria = coleccion.categorias.find((c) => c.id === vista.categoriaId);
                if (!categoria) return null;
                return (
                  <DetalleCategoria
                    categoria={categoria}
                    estados={estados}
                    onToggle={alternar}
                    onAjustarRepes={ajustarRepes}
                    onVolver={() => setVista({ nombre: 'categorias' })}
                  />
                );
              })()}
            {vista.nombre === 'faltan' && (
              <PantallaFaltan
                coleccion={coleccion}
                estados={estados}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'cambiar' && (
              <PantallaParaCambiar
                coleccion={coleccion}
                estados={estados}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'editar' && (
              <PantallaEditarCatalogo
                coleccion={coleccion}
                onImportar={importarCatalogo}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
