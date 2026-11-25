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

const mensaje = (motivo: unknown): string => (motivo instanceof Error ? motivo.message : String(motivo));

/** Historial de un equipo para IT: elige uno de GET /api/equipos y consulta GET /api/equipos/{id}/historial. */
export function Historial({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then(setEquipos)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  }, [sesion]);

  const consultar = (equipo: Equipo) => {
    setError(null);
    setHistorial(null);
    api<EntradaHistorial[]>(sesion, `/api/equipos/${encodeURIComponent(equipo.id)}/historial`)
      .then(setHistorial)
      .catch((motivo: unknown) => {
        setError(mensaje(motivo));
      });
  };

  return (
    <section aria-labelledby="historial">
      <h2 id="historial">Historial de un equipo</h2>
      {error && <p role="alert">{error}</p>}
      {equipos?.length === 0 && <p>No hay equipos dados de alta.</p>}
      {equipos && equipos.length > 0 && (
        <ul aria-label="Equipos">
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              {equipo.nombre}
              <button
                type="button"
                onClick={() => {
                  consultar(equipo);
                }}
              >
                Ver historial de {equipo.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
      {historial?.length === 0 && <p>Este equipo no tiene préstamos.</p>}
      {historial && historial.length > 0 && (
        <ol aria-label="Préstamos del equipo">
          {historial.map((entrada, posicion) => (
            <li key={posicion}>
              {entrada.persona}, hasta el {entrada.devolucion}: {entrada.estado}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
