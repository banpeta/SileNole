import type { Coleccion } from '../model/tipos';
import type { MapaEstados } from '../domain/estado';
import { progresoCategoria } from '../domain/progreso';

interface Props {
  coleccion: Coleccion;
  estados: MapaEstados;
  onAbrir: (categoriaId: string) => void;
  onVolver: () => void;
}

/** Lista de categorías con su progreso y marca de completa (HU-01). */
export function ListaCategorias({ coleccion, estados, onAbrir, onVolver }: Props) {
  const categorias = [...coleccion.categorias].sort((a, b) => a.orden - b.orden);
  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>Mis equipos</h2>
      <ul className="lista-categorias">
        {categorias.map((cat) => {
          const p = progresoCategoria(cat, estados);
          return (
            <li key={cat.id}>
              <button
                className={p.completa ? 'fila-categoria completa' : 'fila-categoria'}
                style={cat.color ? { borderInlineStartColor: cat.color } : undefined}
                onClick={() => onAbrir(cat.id)}
              >
                <span className="nombre">
                  {cat.nombre}
                  {cat.escudo && (
                    <img
                      className="escudo"
                      src={`${import.meta.env.BASE_URL}${cat.escudo}`}
                      alt=""
                      // Si el escudo aún no está disponible, se oculta (sin icono roto).
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </span>
                <span className="progreso">
                  {p.conseguidos}/{p.total}
                </span>
                {p.completa && (
                  <span className="marca-completa" aria-label="categoría completa">
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
