import { useState, type SyntheticEvent } from "react";
import { api, type Sesion } from "../pantallas.js";

interface Equipo {
  id: string;
  nombre: string;
  estado: string;
}

/** Formulario de alta de equipos (POST /api/equipos); tras el alta enseña el equipo creado. */
export function AltaEquipo({ sesion }: { sesion: Sesion }) {
  const [nombre, setNombre] = useState("");
  const [creado, setCreado] = useState<Equipo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const darDeAlta = (evento: SyntheticEvent) => {
    evento.preventDefault();
    setError(null);
    api<Equipo>(sesion, "/api/equipos", { metodo: "POST", cuerpo: { nombre } })
      .then((equipo) => {
        setCreado(equipo);
        setNombre("");
      })
      .catch((motivo: unknown) => {
        setCreado(null);
        setError(motivo instanceof Error ? motivo.message : String(motivo));
      });
  };

  return (
    <section aria-labelledby="alta-equipo">
      <h2 id="alta-equipo">Alta de equipos</h2>
      <form onSubmit={darDeAlta}>
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
        <dl>
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
