import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Vencido {
  id: string;
  nombre: string;
  persona: string;
  devolucion: string;
}

/** Préstamos vencidos para IT: GET /api/prestamos/vencidos, del más antiguo al más reciente. */
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
    <section aria-labelledby="vencidos">
      <h2 id="vencidos">Préstamos vencidos</h2>
      {error && <p role="alert">{error}</p>}
      {vencidos?.length === 0 && <p>No hay préstamos vencidos.</p>}
      {vencidos && vencidos.length > 0 && (
        <ul>
          {vencidos.map((vencido) => (
            <li key={vencido.id}>
              {vencido.nombre}: {vencido.persona}, debía devolverlo el {vencido.devolucion}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
