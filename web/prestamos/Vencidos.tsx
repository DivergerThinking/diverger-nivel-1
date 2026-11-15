import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface PrestamoVencido {
  id: string;
  nombre: string;
  persona: string;
  devolucion: string;
}

/** Lista los préstamos vencidos (GET /api/prestamos/vencidos), del más antiguo al más reciente. */
export function Vencidos({ sesion }: { sesion: Sesion }) {
  const [vencidos, setVencidos] = useState<PrestamoVencido[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PrestamoVencido[]>(sesion, "/api/prestamos/vencidos")
      .then((lista) => {
        setVencidos(lista);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion]);

  return (
    <section aria-labelledby="prestamos-vencidos">
      <h2 id="prestamos-vencidos">Préstamos vencidos</h2>
      <ul>
        {vencidos.map((prestamo) => (
          <li key={prestamo.id}>
            {prestamo.nombre} · {prestamo.persona} · devolución {prestamo.devolucion}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
