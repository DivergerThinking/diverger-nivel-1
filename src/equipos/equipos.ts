// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Colección con un documento por equipo, con id el id del equipo. */
export const COLECCION_EQUIPOS = "equipos_equipos";

/** El equipo con ese id, o undefined si no existe. */
export async function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  const equipo = await almacen.obtener<Equipo>(COLECCION_EQUIPOS, id);
  return equipo === undefined ? undefined : { id: equipo.id, nombre: equipo.nombre };
}

/** Todos los equipos dados de alta, ordenados por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await almacen.listar<Equipo>(COLECCION_EQUIPOS);
  return equipos
    .map((equipo) => ({ id: equipo.id, nombre: equipo.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
