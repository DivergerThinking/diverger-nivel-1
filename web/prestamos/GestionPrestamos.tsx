import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

/** Lista los equipos (GET /api/equipos) y deja a IT entregar uno reservado (POST /api/equipos/{id}/entrega). */
export function GestionPrestamos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then((lista) => {
        setEquipos(lista);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion, version]);

  const entregar = (id: string) => {
    setError(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(id)}/entrega`, { metodo: "POST" })
      .then(() => {
        setVersion((actual) => actual + 1);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  return (
    <section aria-labelledby="gestion-prestamos">
      <h2 id="gestion-prestamos">Gestión de préstamos</h2>
      <ul>
        {equipos.map((equipo) => (
          <li key={equipo.id}>
            {equipo.nombre} · {equipo.estado}
            {equipo.persona ? ` · ${equipo.persona}` : ""}
            {equipo.devolucion ? ` · devolución ${equipo.devolucion}` : ""}
            {equipo.estado === "reservado" && (
              <button
                type="button"
                onClick={() => {
                  entregar(equipo.id);
                }}
              >
                Entregar {equipo.nombre}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
