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
 * Mostrador de IT: enseña la lista de equipos (GET /api/equipos) y deja entregar un equipo reservado
 * (POST /api/equipos/{id}/entrega); si la API falla, enseña su mensaje.
 */
export function Mostrador({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
