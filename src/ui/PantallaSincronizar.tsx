import { useState } from 'react';
import { esCodigoValido } from '../data/codigoColeccion';

interface Props {
  /** Código de colección actual, o null si la sincronización está desactivada. */
  codigo: string | null;
  /** Hay una sincronización en curso. */
  sincronizando: boolean;
  /** Hay cambios locales aún no confirmados en la nube. */
  pendiente: boolean;
  /** Activa la sincronización: genera un código nuevo en este dispositivo. */
  onActivar: () => void;
  /** Empareja con un código existente (de otro dispositivo). */
  onEmparejar: (codigo: string) => void;
  /** Fuerza una sincronización ahora. */
  onSincronizar: () => void;
  onVolver: () => void;
}

/**
 * Pantalla "Sincronizar" (HU-09): activar/mostrar el código de colección,
 * emparejar con otro dispositivo y ver el estado. Es presentacional: la lógica
 * de sincronización vive en la app (RepositorioCompuesto).
 */
export function PantallaSincronizar({
  codigo,
  sincronizando,
  pendiente,
  onActivar,
  onEmparejar,
  onSincronizar,
  onVolver,
}: Props) {
  const [pegado, setPegado] = useState('');
  const [error, setError] = useState<string | null>(null);

  function emparejar() {
    if (!esCodigoValido(pegado)) {
      setError('Ese código no tiene el formato correcto. Cópialo tal cual del otro dispositivo.');
      return;
    }
    setError(null);
    onEmparejar(pegado);
    setPegado('');
  }

  return (
    <section className="pantalla">
      <button className="boton-volver" onClick={onVolver}>
        ← Volver
      </button>
      <h2>Sincronizar</h2>
      <p className="ayuda">
        Con un código de colección puedes ver los mismos cromos en el móvil y en
        el portátil. No hace falta ninguna cuenta.
      </p>

      {codigo ? (
        <>
          <p className="ayuda">Tu código (cópialo y ponlo en el otro dispositivo):</p>
          <input className="codigo-sync" readOnly value={codigo} aria-label="Tu código de colección" />
          <p className="estado-sync" role="status">
            {sincronizando
              ? 'Sincronizando…'
              : pendiente
                ? 'Cambios pendientes de subir'
                : 'Todo al día ✅'}
          </p>
          <button className="boton-grande" onClick={onSincronizar} disabled={sincronizando}>
            🔄 Sincronizar ahora
          </button>
        </>
      ) : (
        <>
          <p className="ayuda">La sincronización está desactivada (tus datos solo están en este dispositivo).</p>
          <button className="boton-grande" onClick={onActivar}>
            Activar sincronización
          </button>
        </>
      )}

      <h3>Usar un código de otro dispositivo</h3>
      <input
        className="codigo-sync"
        aria-label="Pegar código de otro dispositivo"
        placeholder="Pega aquí el código"
        value={pegado}
        onChange={(e) => {
          setPegado(e.target.value);
          setError(null);
        }}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="boton-volver" onClick={emparejar}>
        Emparejar con este código
      </button>
    </section>
  );
}
