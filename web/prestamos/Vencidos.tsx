import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Vencido {
  id: string;
  nombre: string;
  persona: string;
  devolucion: string;
}

const mensajeDe = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Préstamos vencidos (GET /api/prestamos/vencidos), del más antiguo al más reciente. Solo se consultan. */
export function Vencidos({ sesion }: { sesion: Sesion }) {
  const [vencidos, setVencidos] = useState<Vencido[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Vencido[]>(sesion, "/api/prestamos/vencidos").then(setVencidos, (motivo: unknown) => {
      setError(mensajeDe(motivo));
    });
  }, [sesion]);

  return (
    <section aria-labelledby="vencidos-titulo">
      <h2 id="vencidos-titulo">Préstamos vencidos</h2>
      {error && <p role="alert">{error}</p>}
      <ul>
        {vencidos.map((vencido) => (
          <li key={vencido.id}>
            <strong>{vencido.nombre}</strong> <span>{vencido.persona}</span> <span>{vencido.devolucion}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
