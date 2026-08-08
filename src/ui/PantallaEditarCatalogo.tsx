import { useState } from 'react';
import type { Coleccion } from '../model/tipos';
import type { ResultadoValidacion } from '../model/validacion';

interface Props {
  coleccion: Coleccion;
  /** Valida y guarda el catálogo; devuelve el resultado (para mostrar errores). */
  onImportar: (datos: unknown) => Promise<ResultadoValidacion>;
  onVolver: () => void;
}

/**
 * Pantalla para importar/editar el catálogo (HU-07).
 *
 * Muestra el JSON del catálogo actual en un área editable. El usuario puede
 * editarlo a mano, cargarlo desde un archivo o descargarlo como copia. Al
 * guardar se valida; si es válido, se guarda conservando el progreso.
 */
export function PantallaEditarCatalogo({ coleccion, onImportar, onVolver }: Props) {
  const [texto, setTexto] = useState(() => JSON.stringify(coleccion, null, 2));
  const [errores, setErrores] = useState<string[]>([]);
  const [ok, setOk] = useState(false);

  async function guardar() {
    setOk(false);
    let datos: unknown;
    try {
      datos = JSON.parse(texto);
    } catch (e) {
      setErrores([`El texto no es un JSON válido: ${e instanceof Error ? e.message : String(e)}`]);
      return;
    }
    const resultado = await onImportar(datos);
    if (resultado.ok) {
      setErrores([]);
      setOk(true);
    } else {
      setErrores(resultado.errores);
    }
  }

  async function cargarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setOk(false);
    setErrores([]);
    setTexto(await archivo.text());
  }

  function descargar() {
    const blob = new Blob([texto], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coleccion.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>Editar catálogo</h2>
      <p className="ayuda">
        Aquí puedes corregir los números y categorías. Edita el texto, carga un
        archivo o descárgalo como copia de seguridad. Al guardar se conserva tu
        progreso (lo que ya tienes y los repes).
      </p>

      <div className="acciones-catalogo">
        <label className="boton-volver como-boton">
          📂 Cargar archivo
          <input type="file" accept="application/json,.json" onChange={cargarArchivo} hidden />
        </label>
        <button className="boton-volver" onClick={descargar}>
          💾 Descargar copia
        </button>
      </div>

      <textarea
        className="editor-json"
        aria-label="JSON del catálogo"
        spellCheck={false}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setOk(false);
        }}
      />

      {errores.length > 0 && (
        <div className="errores" role="alert">
          <strong>No se pudo guardar:</strong>
          <ul>
            {errores.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      {ok && (
        <p className="celebracion" role="status">
          Catálogo guardado ✅
        </p>
      )}

      <button className="boton-grande" onClick={guardar}>
        Validar y guardar
      </button>
    </section>
  );
}
