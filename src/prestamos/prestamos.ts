// Lógica interna del contexto «prestamos»: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos as listarEquiposDeEquipos } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** El préstamo activo de un equipo: un documento por equipo, con id el del equipo. */
export interface PrestamoActivo {
  id: string;
  prestamo: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado";
}

export const ACTIVOS = "prestamos_activos";

/** Todos los equipos con su estado; si están reservados o prestados, también la persona y la devolución. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const [equipos, activos] = await Promise.all([listarEquiposDeEquipos(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const activoDe = new Map(activos.map((activo) => [activo.id, activo]));
  return equipos.map((equipo): Equipo => {
    const activo = activoDe.get(equipo.id);
    if (!activo) return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
    return { id: equipo.id, nombre: equipo.nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
