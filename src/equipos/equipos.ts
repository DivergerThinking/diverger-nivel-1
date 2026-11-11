// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";

/** Colección de los equipos dados de alta: un documento por equipo, con id el del equipo. */
export const COLECCION_EQUIPOS = "equipos_equipos";

export interface Equipo {
  id: string;
  nombre: string;
}

/** El equipo con ese id, o undefined si no existe. */
export function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  return almacen.obtener<Equipo>(COLECCION_EQUIPOS, id);
}

/** Todos los equipos dados de alta, ordenados por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await almacen.listar<Equipo>(COLECCION_EQUIPOS);
  return equipos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
