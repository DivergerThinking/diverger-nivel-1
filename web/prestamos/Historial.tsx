import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
}

interface EntradaHistorial {
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
}

/** Deja a IT elegir un equipo (GET /api/equipos) y ver sus préstamos (GET /api/equipos/{id}/historial). */
export function Historial({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [elegido, setElegido] = useState("");
  const [entradas, setEntradas] = useState<EntradaHistorial[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then((lista) => {
        setEquipos(lista);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion]);

  const consultar = () => {
    setError(null);
    setEntradas([]);
    api<EntradaHistorial[]>(sesion, `/api/equipos/${encodeURIComponent(elegido)}/historial`)
      .then((lista) => {
        setEntradas(lista);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  return (
    <section aria-labelledby="prestamos-historial">
      <h2 id="prestamos-historial">Historial de un equipo</h2>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          consultar();
        }}
      >
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
        <button type="submit">Consultar</button>
      </form>
      <ul>
        {entradas.map((entrada, indice) => (
          <li key={indice}>
            {entrada.persona} · devolución {entrada.devolucion} · {entrada.estado}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
