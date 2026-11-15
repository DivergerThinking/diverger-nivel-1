import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Vencido {
  id: string;
  nombre: string;
  persona: string;
  devolucion: string;
}

const mensaje = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Enseña los préstamos vencidos (GET /api/prestamos/vencidos) en el orden de la API, del más antiguo al más reciente. */
export function Vencidos({ sesion }: { sesion: Sesion }) {
  const [vencidos, setVencidos] = useState<Vencido[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Vencido[]>(sesion, "/api/prestamos/vencidos")
      .then(setVencidos)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  }, [sesion]);

  return (
    <section aria-labelledby="vencidos">
      <h2 id="vencidos">Préstamos vencidos</h2>
      {error && <p role="alert">{error}</p>}
      {vencidos && vencidos.length === 0 && <p>No hay préstamos vencidos.</p>}
      {vencidos && vencidos.length > 0 && (
        <ul>
          {vencidos.map((vencido) => (
            <li key={vencido.id}>
              {vencido.nombre}: {vencido.persona}, devolución {vencido.devolucion}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
