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
 * Enseña la lista de equipos con su estado (GET /api/equipos) y deja pedir un equipo disponible con su fecha de
 * devolución (POST /api/equipos/{id}/solicitud); si la API falla, enseña su mensaje.
 */
export function Equipos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState("");
  const [devolucion, setDevolucion] = useState("");
  const [pedido, setPedido] = useState<string | null>(null);

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

  const pedir = () => {
    setError(null);
    setPedido(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(elegido)}/solicitud`, { metodo: "POST", cuerpo: { devolucion } })
      .then((equipo) => {
        setPedido(`${equipo.nombre} reservado a tu nombre hasta el ${equipo.devolucion ?? devolucion}`);
        return cargar();
      })
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  const disponibles = equipos?.filter((equipo) => equipo.estado === "disponible") ?? [];

  return (
    <section aria-labelledby="equipos">
      <h2 id="equipos">Equipos</h2>
      <p>Sesión iniciada como {sesion.persona.email}</p>
      {error && <p role="alert">{error}</p>}
      {pedido && <p role="status">{pedido}</p>}
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
      {equipos && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            if (elegido !== "") pedir();
          }}
        >
          <label>
            Equipo a pedir
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
            Fecha de devolución
            <input type="date" value={devolucion} onChange={(evento) => { setDevolucion(evento.target.value); }} />
          </label>
          <button type="submit">Pedir equipo</button>
        </form>
      )}
    </section>
  );
}
