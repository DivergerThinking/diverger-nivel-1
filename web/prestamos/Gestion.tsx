import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
  persona?: string;
  devolucion?: string;
}

/** Formulario del préstamo en el mostrador de un equipo disponible. */
function Mostrador({ equipo, prestar }: { equipo: Equipo; prestar: (persona: string, devolucion: string) => void }) {
  const [persona, setPersona] = useState("");
  const [devolucion, setDevolucion] = useState("");
  const enviar = (evento: SyntheticEvent) => {
    evento.preventDefault();
    prestar(persona, devolucion);
  };
  return (
    <form onSubmit={enviar} aria-label={`Prestar ${equipo.nombre}`}>
      <label>
        Persona
        <input
          value={persona}
          onChange={(evento) => {
            setPersona(evento.target.value);
          }}
        />
      </label>
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
      <button type="submit">Prestar</button>
    </form>
  );
}

/** Los equipos con la acción de IT de cada estado: entregar, prestar en el mostrador o apuntar la devolución. */
export function Gestion({ sesion }: { sesion: Sesion }) {
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

  const operar = (id: string, operacion: "entrega" | "prestamo" | "devolucion", cuerpo?: unknown) => {
    setError(null);
    api(sesion, `/api/equipos/${encodeURIComponent(id)}/${operacion}`, { metodo: "POST", ...(cuerpo !== undefined ? { cuerpo } : {}) })
      .then(cargar)
      .catch(mostrar);
  };

  return (
    <section aria-labelledby="gestion-de-prestamos">
      <h2 id="gestion-de-prestamos">Gestión de préstamos</h2>
      {equipos && (
        <ul aria-label="Equipos para gestionar">
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}: {equipo.estado}
              {equipo.persona && equipo.devolucion && ` (${equipo.persona}, devolución ${equipo.devolucion})`}
              {equipo.estado === "reservado" && (
                <button
                  type="button"
                  onClick={() => {
                    operar(equipo.id, "entrega");
                  }}
                >
                  Entregar {equipo.nombre}
                </button>
              )}
              {equipo.estado === "prestado" && (
                <button
                  type="button"
                  onClick={() => {
                    operar(equipo.id, "devolucion");
                  }}
                >
                  Apuntar devolución de {equipo.nombre}
                </button>
              )}
              {equipo.estado === "disponible" && (
                <Mostrador
                  equipo={equipo}
                  prestar={(persona, devolucion) => {
                    operar(equipo.id, "prestamo", { persona, devolucion });
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
