import { useEffect, useState } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

/**
 * Lista los equipos (GET /api/equipos) y deja a IT entregar uno reservado (POST /api/equipos/{id}/entrega) o prestar
 * en el mostrador uno disponible (POST /api/equipos/{id}/prestamo).
 */
export function GestionPrestamos({ sesion }: { sesion: Sesion }) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [datos, setDatos] = useState<Record<string, { persona: string; devolucion: string }>>({});

  useEffect(() => {
    api<Equipo[]>(sesion, "/api/equipos")
      .then((lista) => {
        setEquipos(lista);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }, [sesion, version]);

  const entregar = (id: string) => {
    setError(null);
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(id)}/entrega`, { metodo: "POST" })
      .then(() => {
        setVersion((actual) => actual + 1);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  const prestar = (id: string) => {
    setError(null);
    const { persona, devolucion } = datos[id] ?? { persona: "", devolucion: "" };
    api<Equipo>(sesion, `/api/equipos/${encodeURIComponent(id)}/prestamo`, {
      metodo: "POST",
      cuerpo: { persona, devolucion },
    })
      .then(() => {
        setVersion((actual) => actual + 1);
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  const cambiar = (id: string, campo: "persona" | "devolucion", valor: string) => {
    setDatos((actuales) => ({
      ...actuales,
      [id]: { persona: "", devolucion: "", ...actuales[id], [campo]: valor },
    }));
  };

  return (
    <section aria-labelledby="gestion-prestamos">
      <h2 id="gestion-prestamos">Gestión de préstamos</h2>
      <ul>
        {equipos.map((equipo) => (
          <li key={equipo.id}>
            {equipo.nombre} · {equipo.estado}
            {equipo.persona ? ` · ${equipo.persona}` : ""}
            {equipo.devolucion ? ` · devolución ${equipo.devolucion}` : ""}
            {equipo.estado === "disponible" && (
              <form
                onSubmit={(evento) => {
                  evento.preventDefault();
                  prestar(equipo.id);
                }}
              >
                <label>
                  Persona de {equipo.nombre}
                  <input
                    type="text"
                    value={datos[equipo.id]?.persona ?? ""}
                    onChange={(evento) => {
                      cambiar(equipo.id, "persona", evento.target.value);
                    }}
                  />
                </label>
                <label>
                  Devolución de {equipo.nombre}
                  <input
                    type="date"
                    value={datos[equipo.id]?.devolucion ?? ""}
                    onChange={(evento) => {
                      cambiar(equipo.id, "devolucion", evento.target.value);
                    }}
                  />
                </label>
                <button type="submit">Prestar {equipo.nombre}</button>
              </form>
            )}
            {equipo.estado === "reservado" && (
              <button
                type="button"
                onClick={() => {
                  entregar(equipo.id);
                }}
              >
                Entregar {equipo.nombre}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
