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

/** Formulario del mostrador de un equipo disponible: persona y fecha de devolución. */
function Mostrador({ equipo, prestar }: { equipo: Equipo; prestar: (equipo: Equipo, persona: string, devolucion: string) => void }) {
  const [persona, setPersona] = useState("");
  const [devolucion, setDevolucion] = useState("");
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        prestar(equipo, persona, devolucion);
      }}
    >
      <label>
        Persona de {equipo.nombre}
        <input
          value={persona}
          onChange={(evento) => {
            setPersona(evento.target.value);
          }}
        />
      </label>
      <label>
        Devolución de {equipo.nombre}
        <input
          type="text"
          placeholder="AAAA-MM-DD"
          value={devolucion}
          onChange={(evento) => {
            setDevolucion(evento.target.value);
          }}
        />
      </label>
      <button type="submit">Prestar {equipo.nombre}</button>
    </form>
  );
}

/**
 * Gestión de préstamos para IT: lista los equipos, entrega los reservados con POST /api/equipos/{id}/entrega y presta
 * los disponibles en el mostrador con POST /api/equipos/{id}/prestamo y apunta la devolución de los prestados con
 * POST /api/equipos/{id}/devolucion.
 */
export function Gestion({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then(setEquipos)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  }, [sesion]);

  useEffect(cargar, [cargar]);

  const entregar = (equipo: Equipo) => {
    setError(null);
    api(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/entrega`, { metodo: "POST" })
      .then(cargar)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  const prestar = (equipo: Equipo, persona: string, devolucion: string) => {
    setError(null);
    api(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/prestamo`, { metodo: "POST", cuerpo: { persona, devolucion } })
      .then(cargar)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  const devolver = (equipo: Equipo) => {
    setError(null);
    api(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/devolucion`, { metodo: "POST" })
      .then(cargar)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  return (
    <section aria-labelledby="gestion">
      <h2 id="gestion">Gestión de préstamos</h2>
      {error && <p role="alert">{error}</p>}
      {equipos?.length === 0 && <p>No hay equipos dados de alta.</p>}
      {equipos && equipos.length > 0 && (
        <ul>
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}: {equipo.estado}
              {equipo.persona && ` a ${equipo.persona}`}
              {equipo.devolucion && ` hasta el ${equipo.devolucion}`}
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
              {equipo.estado === "prestado" && (
                <button
                  type="button"
                  onClick={() => {
                    devolver(equipo);
                  }}
                >
                  Apuntar devolución de {equipo.nombre}
                </button>
              )}
              {equipo.estado === "disponible" && <Mostrador equipo={equipo} prestar={prestar} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
