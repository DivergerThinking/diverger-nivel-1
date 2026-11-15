import { useEffect, useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

/** Lista los equipos (GET /api/equipos) y deja pedir uno disponible (POST /api/equipos/{id}/solicitud). */
export function Equipos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [elegido, setElegido] = useState("");
  const [devolucion, setDevolucion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then((lista) => {
        setEquipos(lista);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion, version]);

  const pedir = async (evento: SyntheticEvent) => {
    evento.preventDefault();
    setError(null);
    try {
      await api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(elegido)}/solicitud`, {
        metodo: "POST",
        cuerpo: devolucion === "" ? {} : { devolucion },
      });
      setVersion((actual) => actual + 1);
    } catch (motivo: unknown) {
      setError(motivo instanceof Error ? motivo.message : String(motivo));
    }
  };

  const disponibles = equipos.filter((equipo) => equipo.estado === "disponible");

  return (
    <section aria-labelledby="equipos">
      <h2 id="equipos">Equipos</h2>
      <ul>
        {equipos.map((equipo) => (
          <li key={equipo.id}>
            {equipo.nombre} · {equipo.estado}
            {equipo.persona ? ` · ${equipo.persona}` : ""}
            {equipo.devolucion ? ` · devolución ${equipo.devolucion}` : ""}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(evento) => {
          void pedir(evento);
        }}
      >
        <label>
          Equipo
          <select value={elegido} onChange={(evento) => {
              setElegido(evento.target.value);
            }}>
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
          <input type="date" value={devolucion} onChange={(evento) => {
              setDevolucion(evento.target.value);
            }}
          />
        </label>
        <button type="submit" disabled={elegido === ""}>
          Pedir
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
