import { useCallback, useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
  persona?: string;
  devolucion?: string;
}

const mensajeDe = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Mostrador de IT: equipos con la acción de cada estado. Entrega un reservado (POST /api/equipos/{id}/entrega). */
export function Mostrador({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    return api<Equipo[]>(sesion, "/api/equipos").then(setEquipos, (motivo: unknown) => {
      setError(mensajeDe(motivo));
    });
  }, [sesion]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const entregar = (equipo: Equipo) => {
    setError(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/entrega`, { metodo: "POST" })
      .then(cargar)
      .catch((motivo: unknown) => {
        setError(mensajeDe(motivo));
      });
  };

  return (
    <section aria-labelledby="mostrador-titulo">
      <h2 id="mostrador-titulo">Mostrador de IT</h2>
      {error && <p role="alert">{error}</p>}
      <ul>
        {equipos.map((equipo) => (
          <li key={equipo.id}>
            <strong>{equipo.nombre}</strong> <span>{equipo.estado}</span>
            {equipo.persona && <span> {equipo.persona}</span>}
            {equipo.devolucion && <span> {equipo.devolucion}</span>}
            {equipo.estado === "reservado" && (
              <button
                type="button"
                onClick={() => {
                  entregar(equipo);
                }}
              >
                Entregar {equipo.nombre}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
