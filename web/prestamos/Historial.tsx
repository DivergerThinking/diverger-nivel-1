import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
}

interface EntradaHistorial {
  persona: string;
  devolucion: string;
  estado: string;
}

/** Elegir un equipo de la lista y ver sus préstamos, del más reciente al más antiguo. */
export function Historial({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mostrar = (motivo: unknown) => {
    setError(motivo instanceof Error ? motivo.message : String(motivo));
  };

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos").then(setEquipos).catch(mostrar);
  }, [sesion]);

  const ver = (id: string) => {
    setError(null);
    setHistorial(null);
    api<EntradaHistorial[]>(sesion, `/api/equipos/${encodeURIComponent(id)}/historial`)
      .then(setHistorial)
      .catch(mostrar);
  };

  return (
    <section aria-labelledby="historial-de-un-equipo">
      <h2 id="historial-de-un-equipo">Historial de un equipo</h2>
      {equipos && (
        <ul aria-label="Equipos con historial">
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}
              <button
                type="button"
                onClick={() => {
                  ver(equipo.id);
                }}
              >
                Ver historial de {equipo.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
      {historial?.length === 0 && <p>Este equipo no ha tenido préstamos.</p>}
      {historial && historial.length > 0 && (
        <ul aria-label="Historial del equipo">
          {historial.map((entrada, posicion) => (
            <li key={posicion}>
              {entrada.persona}, devolución {entrada.devolucion}, {entrada.estado}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
