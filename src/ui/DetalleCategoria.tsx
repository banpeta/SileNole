import type { Categoria } from '../model/tipos';
import { estadoDe, type MapaEstados } from '../domain/estado';

interface Props {
  categoria: Categoria;
  estados: MapaEstados;
  onToggle: (numero: string) => void;
  onVolver: () => void;
}

/**
 * Detalle de una categoría: cuadrícula de cromos. Tocar un cromo lo marca o lo
 * desmarca (HU-02, HU-03). No depende solo del color: añade ✓ y aria-label.
 */
export function DetalleCategoria({ categoria, estados, onToggle, onVolver }: Props) {
  const cromos = [...categoria.cromos].sort((a, b) => a.orden - b.orden);
  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>{categoria.nombre}</h2>
      <ul className="rejilla-cromos">
        {cromos.map((cromo) => {
          const tenido = estadoDe(estados, cromo.numero).tenido;
          const etiqueta = `Cromo ${cromo.numero}${cromo.nombre ? `, ${cromo.nombre}` : ''}, ${
            tenido ? 'lo tengo' : 'me falta'
          }`;
          return (
            <li key={cromo.numero}>
              <button
                className={tenido ? 'cromo tengo' : 'cromo falta'}
                aria-pressed={tenido}
                aria-label={etiqueta}
                onClick={() => onToggle(cromo.numero)}
              >
                <span className="numero">{cromo.numero}</span>
                {tenido && (
                  <span className="marca" aria-hidden="true">
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
