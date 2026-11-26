import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
  persona?: string;
  devolucion?: string;
}

const mensajeDe = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Lista de equipos (GET /api/equipos) y petición de uno disponible (POST /api/equipos/{id}/solicitud). */
export function Equipos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [devoluciones, setDevoluciones] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    return api<Equipo[]>(sesion, "/api/equipos").then(setEquipos, (motivo: unknown) => {
      setError(mensajeDe(motivo));
    });
  }, [sesion]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const pedir = (evento: SyntheticEvent, equipo: Equipo) => {
    evento.preventDefault();
    setError(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/solicitud`, {
      metodo: "POST",
      cuerpo: { devolucion: devoluciones[equipo.id] ?? "" },
    })
      .then(cargar)
      .catch((motivo: unknown) => {
        setError(mensajeDe(motivo));
      });
  };

  return (
    <section aria-labelledby="equipos-titulo">
      <h2 id="equipos-titulo">Equipos</h2>
      {error && <p role="alert">{error}</p>}
      <ul>
        {equipos.map((equipo) => (
          <li key={equipo.id}>
            <strong>{equipo.nombre}</strong> <span>{equipo.estado}</span>
            {equipo.persona && <span> {equipo.persona}</span>}
            {equipo.devolucion && <span> {equipo.devolucion}</span>}
            {equipo.estado === "disponible" && (
              <form
                onSubmit={(evento) => {
                  pedir(evento, equipo);
                }}
              >
                <label>
                  Fecha de devolución de {equipo.nombre}
                  <input
                    type="date"
                    value={devoluciones[equipo.id] ?? ""}
                    onChange={(evento) => {
                      setDevoluciones({ ...devoluciones, [equipo.id]: evento.target.value });
                    }}
                  />
                </label>
                <button type="submit">Pedir {equipo.nombre}</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
