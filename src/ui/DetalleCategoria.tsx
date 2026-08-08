import { etiquetaVisible, type Categoria } from '../model/tipos';
import { estadoDe, type MapaEstados } from '../domain/estado';
import { progresoCategoria } from '../domain/progreso';

interface Props {
  categoria: Categoria;
  estados: MapaEstados;
  onToggle: (numero: string) => void;
  onAjustarRepes: (numero: string, delta: number) => void;
  onVolver: () => void;
}

/**
 * Detalle de una categoría: cuadrícula de cromos. Tocar un cromo lo marca o lo
 * desmarca (HU-02, HU-03). No depende solo del color: añade ✓ y aria-label.
 */
export function DetalleCategoria({
  categoria,
  estados,
  onToggle,
  onAjustarRepes,
  onVolver,
}: Props) {
  const cromos = [...categoria.cromos].sort((a, b) => a.orden - b.orden);
  const p = progresoCategoria(categoria, estados);
  const acento = categoria.color ?? undefined;
  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>
        {categoria.color && (
          <span className="punto-color" style={{ background: categoria.color }} aria-hidden="true" />
        )}
        {categoria.nombre}
      </h2>
      <p className="progreso-detalle">
        {p.conseguidos}/{p.total}
      </p>
      {p.completa && (
        <p className="celebracion" role="status">
          ¡Equipo completo! 🎉
        </p>
      )}
      <ul className="rejilla-cromos">
        {cromos.map((cromo) => {
          const estado = estadoDe(estados, cromo.numero);
          const tenido = estado.tenido;
          const visible = etiquetaVisible(cromo);
          const aria = `Cromo ${visible}${cromo.nombre ? `, ${cromo.nombre}` : ''}, ${
            tenido ? 'lo tengo' : 'me falta'
          }`;
          return (
            <li key={cromo.numero} className="celda-cromo">
              <button
                className={tenido ? 'cromo tengo' : 'cromo falta'}
                style={tenido && acento ? { background: acento, borderColor: acento } : undefined}
                aria-pressed={tenido}
                aria-label={aria}
                onClick={() => onToggle(cromo.numero)}
              >
                <span className="numero">{visible}</span>
                {tenido && (
                  <span className="marca" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
              {tenido && (
                <div className="repes-control">
                  <button
                    className="repes-boton"
                    aria-label={`Quitar un repetido del cromo ${visible}`}
                    disabled={estado.repes === 0}
                    onClick={() => onAjustarRepes(cromo.numero, -1)}
                  >
                    −
                  </button>
                  <span className="repes-num" aria-label={`${estado.repes} repetidos`}>
                    {estado.repes}
                  </span>
                  <button
                    className="repes-boton"
                    aria-label={`Añadir un repetido al cromo ${visible}`}
                    onClick={() => onAjustarRepes(cromo.numero, 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
