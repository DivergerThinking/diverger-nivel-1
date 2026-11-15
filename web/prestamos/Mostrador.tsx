import { useCallback, useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

const mensaje = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/**
 * Mostrador de IT: enseña la lista de equipos (GET /api/equipos), deja entregar un equipo reservado
 * (POST /api/equipos/{id}/entrega), prestar uno disponible (POST /api/equipos/{id}/prestamo) y apuntar la devolución
 * de uno prestado (POST /api/equipos/{id}/devolucion); si la API falla, enseña su mensaje.
 */
export function Mostrador({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [elegido, setElegido] = useState("");
  const [persona, setPersona] = useState("");
  const [devolucion, setDevolucion] = useState("");

  const cargar = useCallback(
    () =>
      api<Equipo[]>(sesion, "/api/equipos")
        .then(setEquipos)
        .catch((motivo: unknown) => {
          setError(mensaje(motivo));
        }),
    [sesion],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const entregar = (equipo: Equipo) => {
    setError(null);
    setAviso(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/entrega`, { metodo: "POST" })
      .then((entregado) => {
        setAviso(`${entregado.nombre} entregado a ${entregado.persona ?? ""} hasta el ${entregado.devolucion ?? ""}`);
        return cargar();
      })
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  const prestar = () => {
    setError(null);
    setAviso(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(elegido)}/prestamo`, { metodo: "POST", cuerpo: { persona, devolucion } })
      .then((prestado) => {
        setAviso(`${prestado.nombre} prestado a ${prestado.persona ?? persona} hasta el ${prestado.devolucion ?? devolucion}`);
        return cargar();
      })
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  const devolver = (equipo: Equipo) => {
    setError(null);
    setAviso(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/devolucion`, { metodo: "POST" })
      .then((devuelto) => {
        setAviso(`${devuelto.nombre} devuelto: ya está disponible`);
        return cargar();
      })
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  const disponibles = equipos?.filter((equipo) => equipo.estado === "disponible") ?? [];

  return (
    <section aria-labelledby="mostrador">
      <h2 id="mostrador">Mostrador de IT</h2>
      {error && <p role="alert">{error}</p>}
      {aviso && <p role="status">{aviso}</p>}
      {equipos && (
        <ul>
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}: {equipo.estado}
              {equipo.persona && ` a ${equipo.persona}`}
              {equipo.devolucion && `, devolución ${equipo.devolucion}`}
              {equipo.estado === "reservado" && (
                <button type="button" onClick={() => { entregar(equipo); }}>
                  Entregar {equipo.nombre}
                </button>
              )}
              {equipo.estado === "prestado" && (
                <button type="button" onClick={() => { devolver(equipo); }}>
                  Apuntar devolución de {equipo.nombre}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {disponibles.length > 0 && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            if (elegido !== "") prestar();
          }}
        >
          <label>
            Equipo a prestar
            <select value={elegido} onChange={(evento) => { setElegido(evento.target.value); }}>
              <option value="">Elige un equipo</option>
              {disponibles.map((equipo) => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Persona
            <input type="email" value={persona} onChange={(evento) => { setPersona(evento.target.value); }} />
          </label>
          <label>
            Fecha de devolución
            <input type="date" value={devolucion} onChange={(evento) => { setDevolucion(evento.target.value); }} />
          </label>
          <button type="submit">Prestar equipo</button>
        </form>
      )}
    </section>
  );
}
