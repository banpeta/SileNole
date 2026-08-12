import { useState } from 'react';
import type { Estructura } from '../domain/construirColeccion';

export interface ColeccionResumen {
  id: string;
  nombre: string;
  conseguidos: number;
  total: number;
}

interface Props {
  colecciones: ColeccionResumen[];
  activaId: string | null;
  onAbrir: (id: string) => void;
  /** Crea una colección; rechaza (throw) si los datos no son válidos. */
  onCrear: (entrada: { nombre: string; estructura: Estructura }) => Promise<void>;
  onBorrar: (id: string) => void;
  onVolver: () => void;
}

/** Pantalla "Mis colecciones": elegir, crear y borrar colecciones (HU-10/11/12). */
export function PantallaColecciones({ colecciones, activaId, onAbrir, onCrear, onBorrar, onVolver }: Props) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [modo, setModo] = useState<'simple' | 'secciones'>('simple');
  const [total, setTotal] = useState('');
  const [secciones, setSecciones] = useState<{ nombre: string; cantidad: string }[]>([
    { nombre: '', cantidad: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [aBorrar, setABorrar] = useState<string | null>(null);

  function reiniciarFormulario() {
    setNombre('');
    setModo('simple');
    setTotal('');
    setSecciones([{ nombre: '', cantidad: '' }]);
    setError(null);
    setCreando(false);
  }

  async function crear() {
    setError(null);
    const estructura: Estructura =
      modo === 'simple'
        ? { tipo: 'simple', total: Number(total) }
        : {
            tipo: 'secciones',
            secciones: secciones
              .filter((s) => s.nombre.trim() || s.cantidad.trim())
              .map((s) => ({ nombre: s.nombre.trim(), cantidad: Number(s.cantidad) })),
          };
    try {
      await onCrear({ nombre, estructura });
      reiniciarFormulario();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>Mis colecciones</h2>

      <ul className="lista-categorias">
        {colecciones.map((c) => (
          <li key={c.id}>
            <div className={c.id === activaId ? 'fila-categoria completa' : 'fila-categoria'}>
              <button className="nombre como-boton" onClick={() => onAbrir(c.id)} aria-label={`Abrir ${c.nombre}`}>
                {c.nombre}
              </button>
              <span className="progreso">
                {c.conseguidos}/{c.total}
              </span>
              {aBorrar === c.id ? (
                <span className="repes-control">
                  <button className="repes-boton" aria-label={`Confirmar borrar ${c.nombre}`} onClick={() => { onBorrar(c.id); setABorrar(null); }}>
                    ✓
                  </button>
                  <button className="repes-boton" aria-label="Cancelar" onClick={() => setABorrar(null)}>
                    ✕
                  </button>
                </span>
              ) : (
                <button className="repes-boton" aria-label={`Borrar ${c.nombre}`} onClick={() => setABorrar(c.id)}>
                  🗑
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!creando ? (
        <button className="boton-grande" onClick={() => setCreando(true)}>
          + Nueva colección
        </button>
      ) : (
        <div className="pantalla">
          <h3>Nueva colección</h3>
          <input
            className="codigo-sync"
            aria-label="Nombre de la colección"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <div className="acciones-catalogo">
            <label className="como-boton">
              <input type="radio" name="modo" checked={modo === 'simple'} onChange={() => setModo('simple')} /> Número total
            </label>
            <label className="como-boton">
              <input type="radio" name="modo" checked={modo === 'secciones'} onChange={() => setModo('secciones')} /> Por secciones
            </label>
          </div>

          {modo === 'simple' ? (
            <input
              className="codigo-sync"
              type="number"
              min="1"
              aria-label="Cuántos cromos en total"
              placeholder="¿Cuántos cromos?"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          ) : (
            <div>
              {secciones.map((s, i) => (
                <div className="repes-control" key={i}>
                  <input
                    className="codigo-sync"
                    aria-label={`Nombre de la sección ${i + 1}`}
                    placeholder="Sección"
                    value={s.nombre}
                    onChange={(e) =>
                      setSecciones((ss) => ss.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))
                    }
                  />
                  <input
                    className="codigo-sync"
                    type="number"
                    min="1"
                    aria-label={`Cromos de la sección ${i + 1}`}
                    placeholder="Cromos"
                    value={s.cantidad}
                    onChange={(e) =>
                      setSecciones((ss) => ss.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))
                    }
                  />
                </div>
              ))}
              <button className="boton-volver" onClick={() => setSecciones((ss) => [...ss, { nombre: '', cantidad: '' }])}>
                + Añadir sección
              </button>
            </div>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="acciones-catalogo">
            <button className="boton-grande" onClick={crear}>
              Crear
            </button>
            <button className="boton-volver" onClick={reiniciarFormulario}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
