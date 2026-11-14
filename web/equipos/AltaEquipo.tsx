import { useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface EquipoNuevo {
  id: string;
  nombre: string;
  estado: string;
}

/** Da de alta un equipo con POST /api/equipos y enseña el equipo creado; si la API falla, enseña su mensaje. */
export function AltaEquipo({ sesion }: { sesion: Sesion }) {
  const [nombre, setNombre] = useState("");
  const [creado, setCreado] = useState<EquipoNuevo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const darDeAlta = (evento: SyntheticEvent) => {
    evento.preventDefault();
    setError(null);
    setCreado(null);
    api<EquipoNuevo>(sesion, "/api/equipos", { metodo: "POST", cuerpo: { nombre } })
      .then((equipo) => {
        setCreado(equipo);
        setNombre("");
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  return (
    <section aria-labelledby="alta-equipo">
      <h2 id="alta-equipo">Alta de equipos</h2>
      <form onSubmit={darDeAlta}>
        <label>
          Nombre del equipo
          <input value={nombre} onChange={(e) => { setNombre(e.target.value); }} />
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
