import type { Coleccion } from '../model/tipos';
import type { MapaEstados } from '../domain/estado';
import { progresoTotal, totalFaltan } from '../domain/progreso';
import { BarraProgreso } from './BarraProgreso';

interface Props {
  coleccion: Coleccion;
  estados: MapaEstados;
  onVerCategorias: () => void;
  onVerFaltan: () => void;
}

/** Pantalla de inicio: progreso total de la colección (HU-04). */
export function PantallaInicio({ coleccion, estados, onVerCategorias, onVerFaltan }: Props) {
  const p = progresoTotal(coleccion, estados);
  const faltan = totalFaltan(coleccion, estados);
  return (
    <section className="pantalla">
      <p className="resumen">
        Tienes <strong>{p.conseguidos}</strong> de <strong>{p.total}</strong> cromos
      </p>
      <BarraProgreso conseguidos={p.conseguidos} total={p.total} />
      {p.completa ? (
        <p className="enhorabuena">¡Colección completa! 🎉</p>
      ) : (
        <p className="te-faltan">
          Te faltan <strong>{faltan}</strong>
        </p>
      )}
      <nav className="acciones">
        <button className="boton-grande" onClick={onVerCategorias}>
          ⚽ Mis equipos
        </button>
        <button className="boton-grande secundario" onClick={onVerFaltan}>
          🔍 Me faltan
        </button>
      </nav>
    </section>
  );
}
