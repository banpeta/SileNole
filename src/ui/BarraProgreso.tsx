/** Barra de progreso accesible: muestra conseguidos sobre total. */
export function BarraProgreso({ conseguidos, total }: { conseguidos: number; total: number }) {
  const pct = total > 0 ? Math.round((conseguidos / total) * 100) : 0;
  return (
    <div
      className="barra"
      role="progressbar"
      aria-valuenow={conseguidos}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${conseguidos} de ${total}`}
    >
      <div className="barra-relleno" style={{ width: `${pct}%` }} />
    </div>
  );
}
