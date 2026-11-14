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

const mensaje = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Elige un equipo de la lista (GET /api/equipos) y enseña su historial (GET /api/equipos/{id}/historial). */
export function Historial({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [elegido, setElegido] = useState("");
  const [historial, setHistorial] = useState<EntradaHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then(setEquipos)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  }, [sesion]);

  const consultar = () => {
    if (elegido === "") return;
    setError(null);
    setHistorial(null);
    api<EntradaHistorial[]>(sesion, `/api/equipos/${encodeURIComponent(elegido)}/historial`)
      .then(setHistorial)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  return (
    <section aria-labelledby="historial">
      <h2 id="historial">Historial de un equipo</h2>
      <label>
        Equipo
        <select value={elegido} onChange={(evento) => { setElegido(evento.target.value); }}>
          <option value="">Elige un equipo</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={consultar}>
        Consultar historial
      </button>
      {error && <p role="alert">{error}</p>}
      {historial && historial.length === 0 && <p>Este equipo no se ha prestado nunca.</p>}
      {historial && historial.length > 0 && (
        <ul>
          {historial.map((entrada, posicion) => (
            <li key={posicion}>
              {entrada.persona}, devolución {entrada.devolucion}: {entrada.estado}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
