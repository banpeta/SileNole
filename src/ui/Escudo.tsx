interface Props {
  /** Ruta del escudo relativa a la base de la app, o null/undefined si no hay. */
  ruta?: string | null;
}

/**
 * Escudo del equipo. Si no hay ruta, no renderiza nada. Si la imagen no carga
 * (aún no disponible), se oculta sin dejar icono roto.
 */
export function Escudo({ ruta }: Props) {
  if (!ruta) return null;
  return (
    <img
      className="escudo"
      src={`${import.meta.env.BASE_URL}${ruta}`}
      alt=""
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
