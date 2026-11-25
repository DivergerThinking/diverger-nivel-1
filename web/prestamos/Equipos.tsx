import { useCallback, useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
  persona?: string;
  devolucion?: string;
}

const mensaje = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Lista los equipos con GET /api/equipos y pide uno disponible con POST /api/equipos/{id}/solicitud. */
export function Equipos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fechas, setFechas] = useState<Record<string, string>>({});

  const cargar = useCallback(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then(setEquipos)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  }, [sesion]);

  useEffect(cargar, [cargar]);

  const pedir = (equipo: Equipo) => {
    setError(null);
    const devolucion = fechas[equipo.id] ?? "";
    api(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/solicitud`, {
      metodo: "POST",
      cuerpo: devolucion === "" ? {} : { devolucion },
    })
      .then(cargar)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

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
              {equipo.estado === "disponible" && (
                <>
                  {" "}
                  <label>
                    Fecha de devolución de {equipo.nombre}{" "}
                    <input
                      type="date"
                      value={fechas[equipo.id] ?? ""}
                      onChange={(evento) => {
                        setFechas({ ...fechas, [equipo.id]: evento.target.value });
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      pedir(equipo);
                    }}
                  >
                    Pedir {equipo.nombre}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
