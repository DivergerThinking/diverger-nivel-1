import { useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface EquipoCreado {
  id: string;
  nombre: string;
  estado: string;
}

/** Da de alta un equipo con POST /api/equipos y enseña el equipo creado; si la API falla, enseña su mensaje. */
export function AltaEquipos({ sesion }: { sesion: Sesion }) {
  const [nombre, setNombre] = useState("");
  const [creado, setCreado] = useState<EquipoCreado | null>(null);
  const [error, setError] = useState<string | null>(null);

  function darDeAlta(evento: SyntheticEvent) {
    evento.preventDefault();
    setError(null);
    api<EquipoCreado>(sesion, "/api/equipos", { metodo: "POST", cuerpo: { nombre } })
      .then((equipo) => {
        setCreado(equipo);
        setNombre("");
      })
      .catch((motivo: unknown) => {
        setCreado(null);
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  }

  return (
    <section aria-labelledby="alta-equipos">
      <h2 id="alta-equipos">Alta de equipos</h2>
      <form onSubmit={darDeAlta}>
        <label>
          Nombre del equipo
          <input value={nombre} onChange={(evento) => { setNombre(evento.target.value); }} />
        </label>
        <button type="submit">Dar de alta</button>
      </form>
      {creado && (
        <p>
          Equipo dado de alta: {creado.nombre} ({creado.estado})
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
