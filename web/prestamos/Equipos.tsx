import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
  persona?: string;
  devolucion?: string;
}

/** Lista los equipos con GET /api/equipos; si la API falla, por ejemplo sin sesión, enseña su mensaje. */
export function Equipos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then(setEquipos)
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion]);

  return (
    <section aria-labelledby="equipos">
      <h2 id="equipos">Equipos</h2>
      {error && <p role="alert">{error}</p>}
      {equipos?.length === 0 && <p>No hay equipos dados de alta.</p>}
      {equipos && equipos.length > 0 && (
        <ul>
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}: {equipo.estado}
              {equipo.persona && ` a ${equipo.persona}`}
              {equipo.devolucion && ` hasta el ${equipo.devolucion}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
