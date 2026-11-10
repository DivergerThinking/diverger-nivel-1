// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos as listarEquiposDeEquipos } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Colección con como mucho un préstamo activo por equipo, con id el id del equipo. */
export const COLECCION_ACTIVOS = "prestamos_activos";

/** Préstamo activo de un equipo: reservado o prestado. */
export interface PrestamoActivo {
  idPrestamo: string;
  idEquipo: string;
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
}

/** Los equipos con su estado: disponible sin préstamo activo; si no, el del préstamo activo con persona y devolución. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await listarEquiposDeEquipos(almacen);
  const activos = await almacen.listar<PrestamoActivo>(COLECCION_ACTIVOS);
  const porEquipo = new Map(activos.map((activo) => [activo.idEquipo, activo]));
  return equipos.map((equipo): Equipo => {
    const activo = porEquipo.get(equipo.id);
    return activo === undefined
      ? { id: equipo.id, nombre: equipo.nombre, estado: "disponible" }
      : { id: equipo.id, nombre: equipo.nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
