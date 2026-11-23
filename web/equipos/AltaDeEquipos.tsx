import { useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface EquipoCreado {
  id: string;
  nombre: string;
  estado: string;
}

/** Formulario para dar de alta un equipo con POST /api/equipos; enseña el equipo creado o el mensaje de la API. */
export function AltaDeEquipos({ sesion }: { sesion: Sesion }) {
  const [nombre, setNombre] = useState("");
  const [creado, setCreado] = useState<EquipoCreado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enviar = (evento: SyntheticEvent) => {
    evento.preventDefault();
    setError(null);
    setCreado(null);
    api<EquipoCreado>(sesion, "/api/equipos", { metodo: "POST", cuerpo: { nombre } })
      .then((equipo) => {
        setCreado(equipo);
        setNombre("");
      })
      .catch((motivo: unknown) => {
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  return (
    <section aria-labelledby="alta-de-equipos">
      <h2 id="alta-de-equipos">Alta de equipos</h2>
      <form onSubmit={enviar}>
        <label>
          Nombre del equipo
          <input
            value={nombre}
            onChange={(evento) => {
              setNombre(evento.target.value);
            }}
          />
        </label>
        <button type="submit">Dar de alta</button>
      </form>
      {creado && (
        <dl aria-label="Equipo creado">
          <dt>Id</dt>
          <dd>{creado.id}</dd>
          <dt>Nombre</dt>
          <dd>{creado.nombre}</dd>
          <dt>Estado</dt>
          <dd>{creado.estado}</dd>
        </dl>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
