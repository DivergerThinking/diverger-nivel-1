// Equipos del inventario: alta con nombre único (ADR 0003) y lectura por id para los demás contextos.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";

const EQUIPOS = "equipos";
const NOMBRES = "nombresEquipo";

export interface Equipo {
  id: string;
  nombre: string;
  nombreNormalizado: string;
}

export type ResultadoAlta =
  | { tipo: "creado"; equipo: { id: string; nombre: string; estado: "disponible" } }
  | { tipo: "sinNombre" }
  | { tipo: "nombreRepetido" };

/** El nombre sin espacios en los extremos y en minúsculas: con él se comparan dos nombres. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Da de alta un equipo; el índice de nombres y el equipo se escriben en la misma transacción. */
export async function crearEquipo(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string" || nombre.trim() === "") return { tipo: "sinNombre" };
  const limpio = nombre.trim();
  const nombreNormalizado = normalizarNombre(limpio);
  const id = randomUUID();
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if (await tx.obtener(NOMBRES, nombreNormalizado)) return { tipo: "nombreRepetido" };
    const equipo: Equipo = { id, nombre: limpio, nombreNormalizado };
    tx.guardar(NOMBRES, nombreNormalizado, { equipoId: id });
    tx.guardar(EQUIPOS, id, equipo);
    return { tipo: "creado", equipo: { id, nombre: limpio, estado: "disponible" } };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  return almacen.obtener<Equipo>(EQUIPOS, id);
}
