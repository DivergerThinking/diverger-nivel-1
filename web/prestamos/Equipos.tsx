import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

/** Enseña la lista de equipos con su estado (GET /api/equipos); si la API falla, enseña su mensaje. */
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
      <p>Sesión iniciada como {sesion.persona.email}</p>
      {error && <p role="alert">{error}</p>}
      {equipos && (
        <ul>
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}: {equipo.estado}
              {equipo.persona && ` a ${equipo.persona}`}
              {equipo.devolucion && `, devolución ${equipo.devolucion}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
