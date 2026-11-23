import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Vencido {
  id: string;
  nombre: string;
  persona: string;
  devolucion: string;
}

/** Los equipos prestados con la devolución anterior a hoy, del más antiguo al más reciente. */
export function Vencidos({ sesion }: { sesion: Sesion }) {
  const [vencidos, setVencidos] = useState<Vencido[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Vencido[]>(sesion, "/api/prestamos/vencidos")
      .then(setVencidos)
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion]);

  return (
    <section aria-labelledby="prestamos-vencidos">
      <h2 id="prestamos-vencidos">Préstamos vencidos</h2>
      {vencidos?.length === 0 && <p>No hay préstamos vencidos.</p>}
      {vencidos && vencidos.length > 0 && (
        <ul aria-label="Préstamos vencidos">
          {vencidos.map((vencido) => (
            <li key={vencido.id}>
              {vencido.nombre}: {vencido.persona}, devolución {vencido.devolucion}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
