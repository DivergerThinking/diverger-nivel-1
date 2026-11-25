// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

/** Un equipo tal como se guarda en la colección `equipos`. */
export interface Equipo {
  nombre: string;
  nombreNormalizado: string;
}

/** Un equipo con su id, tal como lo leen los demás contextos. */
export interface EquipoConId extends Equipo {
  id: string;
}

interface NombreEquipo {
  equipo: string;
}

const EQUIPOS = "equipos";
const NOMBRES = "nombresEquipo";

/** Dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

export type ResultadoAlta = { ok: true; equipo: EquipoCreado } | { ok: false; status: 400 | 409; error: string };

/** Da de alta un equipo; el documento índice del nombre normalizado y el equipo se crean en la misma transacción. */
export async function darDeAlta(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string" || nombre.trim() === "") {
    return { ok: false, status: 400, error: "Falta el nombre del equipo" };
  }
  const nombreNormalizado = normalizarNombre(nombre);
  const idNombre = encodeURIComponent(nombreNormalizado);
  const id = randomUUID();
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if (await tx.obtener<NombreEquipo>(NOMBRES, idNombre)) {
      return { ok: false, status: 409, error: "Ya hay un equipo con ese nombre" };
    }
    const equipo: Equipo = { nombre, nombreNormalizado };
    tx.guardar(EQUIPOS, id, equipo);
    tx.guardar(NOMBRES, idNombre, { equipo: id } satisfies NombreEquipo);
    return { ok: true, equipo: { id, nombre, estado: "disponible" } };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export async function obtenerEquipo(almacen: Almacen, id: string): Promise<EquipoConId | undefined> {
  const equipo = await almacen.obtener<Equipo>(EQUIPOS, id);
  return equipo ? { id, ...equipo } : undefined;
}
