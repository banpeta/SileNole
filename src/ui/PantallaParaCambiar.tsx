import { etiquetaVisible, type Coleccion } from '../model/tipos';
import type { MapaEstados } from '../domain/estado';
import { cromosParaCambiar } from '../domain/progreso';

interface Props {
  coleccion: Coleccion;
  estados: MapaEstados;
  onVolver: () => void;
}

/** Lista de cromos repetidos disponibles para cambiar (HU-08). */
export function PantallaParaCambiar({ coleccion, estados, onVolver }: Props) {
  const items = cromosParaCambiar(coleccion, estados);

  // Agrupar por categoría para mostrarlos ordenados.
  const grupos = new Map<string, { nombre: string; color: string | null; filas: typeof items }>();
  for (const item of items) {
    const g = grupos.get(item.categoria.id);
    if (g) g.filas.push(item);
    else
      grupos.set(item.categoria.id, {
        nombre: item.categoria.nombre,
        color: item.categoria.color,
        filas: [item],
      });
  }

  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>Para cambiar</h2>
      {items.length === 0 ? (
        <p className="vacio">No tienes repes todavía. ¡Marca los que te sobren! 🔁</p>
      ) : (
        [...grupos.values()].map((g) => (
          <div key={g.nombre} className="grupo-faltan">
            <h3>
              {g.color && (
                <span className="punto-color" style={{ background: g.color }} aria-hidden="true" />
              )}
              {g.nombre}
            </h3>
            <ul className="lista-cambiar">
              {g.filas.map(({ cromo, repes }) => (
                <li key={cromo.numero}>
                  <span className="numero">{etiquetaVisible(cromo)}</span>
                  <span className="repes-badge" aria-label={`${repes} repetidos`}>
                    x{repes}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
