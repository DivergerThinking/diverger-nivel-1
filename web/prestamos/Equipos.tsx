import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
  persona?: string;
  devolucion?: string;
}

/** Formulario para pedir un equipo disponible con la fecha de devolución. */
function Peticion({ equipo, pedir }: { equipo: Equipo; pedir: (devolucion: string) => void }) {
  const [devolucion, setDevolucion] = useState("");
  const enviar = (evento: SyntheticEvent) => {
    evento.preventDefault();
    pedir(devolucion);
  };
  return (
    <form onSubmit={enviar} aria-label={`Pedir ${equipo.nombre}`}>
      <label>
        Fecha de devolución
        <input
          value={devolucion}
          placeholder="AAAA-MM-DD"
          onChange={(evento) => {
            setDevolucion(evento.target.value);
          }}
        />
      </label>
      <button type="submit">Pedir</button>
    </form>
  );
}

/** Pide la lista a GET /api/equipos y la enseña; deja pedir un equipo disponible; si la API falla, enseña su mensaje. */
export function Equipos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mostrar = (motivo: unknown) => {
    setError(motivo instanceof Error ? motivo.message : String(motivo));
  };

  const cargar = useCallback(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then(setEquipos)
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion]);

  useEffect(cargar, [cargar]);

  const pedir = (id: string, devolucion: string) => {
    setError(null);
    api(sesion, `/api/equipos/${encodeURIComponent(id)}/solicitud`, { metodo: "POST", cuerpo: { devolucion } })
      .then(cargar)
      .catch(mostrar);
  };

  return (
    <section aria-labelledby="equipos">
      <h2 id="equipos">Equipos</h2>
      {equipos && (
        <ul aria-label="Lista de equipos">
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}: {equipo.estado}
              {equipo.persona && equipo.devolucion && ` (${equipo.persona}, devolución ${equipo.devolucion})`}
              {equipo.estado === "disponible" && (
                <Peticion
                  equipo={equipo}
                  pedir={(devolucion) => {
                    pedir(equipo.id, devolucion);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
