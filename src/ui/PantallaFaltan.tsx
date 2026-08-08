import type { Coleccion } from '../model/tipos';
import type { MapaEstados } from '../domain/estado';
import { cromosQueFaltan } from '../domain/progreso';

interface Props {
  coleccion: Coleccion;
  estados: MapaEstados;
  onVolver: () => void;
}

/** Lista de cromos que faltan, agrupados por categoría (HU-05). */
export function PantallaFaltan({ coleccion, estados, onVolver }: Props) {
  const grupos = cromosQueFaltan(coleccion, estados);
  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>Me faltan</h2>
      {grupos.length === 0 ? (
        <p className="enhorabuena">¡Colección completa! No te falta ninguno 🎉</p>
      ) : (
        grupos.map((grupo) => (
          <div key={grupo.categoria.id} className="grupo-faltan">
            <h3>{grupo.categoria.nombre}</h3>
            <ul className="lista-faltan">
              {grupo.cromos.map((cromo) => (
                <li key={cromo.numero}>
                  <span className="numero">{cromo.numero}</span>
                  {cromo.nombre ? ` · ${cromo.nombre}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
