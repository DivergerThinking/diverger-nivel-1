// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";

/** Colección de los equipos dados de alta: un documento por equipo, con id el del equipo. */
export const COLECCION_EQUIPOS = "equipos_equipos";

export interface Equipo {
  id: string;
  nombre: string;
}

/** Colección de los nombres ya usados: un documento por nombre normalizado, para no repetir un nombre. */
export const COLECCION_NOMBRES = "equipos_nombres";

export const ERROR_FALTA_NOMBRE = "Falta el nombre del equipo";
export const ERROR_NOMBRE_REPETIDO = "Ya hay un equipo con ese nombre";

export type ResultadoAlta = { equipo: Equipo } | { error: typeof ERROR_FALTA_NOMBRE | typeof ERROR_NOMBRE_REPETIDO };

/** Dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLocaleLowerCase("es");
}

/** Da de alta un equipo con ese nombre, sin repetir un nombre ya dado de alta (la comprobación es atómica). */
export async function crearEquipo(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string" || nombre.trim() === "") return { error: ERROR_FALTA_NOMBRE };
  const limpio = nombre.trim();
  const claveNombre = Buffer.from(normalizarNombre(limpio)).toString("base64url");
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if ((await tx.obtener(COLECCION_NOMBRES, claveNombre)) !== undefined) return { error: ERROR_NOMBRE_REPETIDO };
    const equipo: Equipo = { id: randomUUID(), nombre: limpio };
    tx.guardar(COLECCION_NOMBRES, claveNombre, { id: equipo.id });
    tx.guardar(COLECCION_EQUIPOS, equipo.id, equipo);
    return { equipo };
  });
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
