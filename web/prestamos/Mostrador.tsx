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

/**
 * Mostrador de IT: equipos con la acción de cada estado. Entrega un reservado (POST /api/equipos/{id}/entrega) y presta
 * uno disponible a una persona con su fecha de devolución (POST /api/equipos/{id}/prestamo).
 */
export function Mostrador({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [prestando, setPrestando] = useState<string | null>(null);
  const [persona, setPersona] = useState("");
  const [devolucion, setDevolucion] = useState("");

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

  const abrirPrestamo = (equipo: Equipo) => {
    setError(null);
    setPersona("");
    setDevolucion("");
    setPrestando(equipo.id);
  };

  const prestar = (evento: SyntheticEvent, equipo: Equipo) => {
    evento.preventDefault();
    setError(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/prestamo`, { metodo: "POST", cuerpo: { persona, devolucion } })
      .then(() => {
        setPrestando(null);
        return cargar();
      })
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
            {equipo.estado === "disponible" && prestando !== equipo.id && (
              <button
                type="button"
                onClick={() => {
                  abrirPrestamo(equipo);
                }}
              >
                Prestar {equipo.nombre}
              </button>
            )}
            {prestando === equipo.id && (
              <form
                aria-label={`Prestar ${equipo.nombre}`}
                noValidate
                onSubmit={(evento) => {
                  prestar(evento, equipo);
                }}
              >
                <label>
                  Persona
                  <input
                    type="email"
                    value={persona}
                    onChange={(evento) => {
                      setPersona(evento.target.value);
                    }}
                  />
                </label>
                <label>
                  Fecha de devolución
                  <input
                    type="date"
                    value={devolucion}
                    onChange={(evento) => {
                      setDevolucion(evento.target.value);
                    }}
                  />
                </label>
                <button type="submit">Confirmar préstamo</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
