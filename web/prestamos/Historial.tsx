import { useEffect, useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
}

interface Movimiento {
  persona: string;
  devolucion: string;
  estado: string;
}

const mensajeDe = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Historial de un equipo (GET /api/equipos/{id}/historial), del préstamo más reciente al más antiguo. */
export function Historial({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [elegido, setElegido] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos").then(setEquipos, (motivo: unknown) => {
      setError(mensajeDe(motivo));
    });
  }, [sesion]);

  const consultar = (evento: SyntheticEvent) => {
    evento.preventDefault();
    setError(null);
    setMovimientos(null);
    api<Movimiento[]>(sesion, `/api/equipos/${encodeURIComponent(elegido)}/historial`).then(setMovimientos, (motivo: unknown) => {
      setError(mensajeDe(motivo));
    });
  };

  return (
    <section aria-labelledby="historial-titulo">
      <h2 id="historial-titulo">Historial de un equipo</h2>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={consultar}>
        <label>
          Equipo
          <select
            value={elegido}
            onChange={(evento) => {
              setElegido(evento.target.value);
            }}
          >
            <option value="">Elige un equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={elegido === ""}>
          Consultar historial
        </button>
      </form>
      {movimientos && (
        <ul aria-label="Préstamos del equipo">
          {movimientos.map((movimiento, posicion) => (
            <li key={posicion}>
              <span>{movimiento.persona}</span> <span>{movimiento.devolucion}</span> <span>{movimiento.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
