// Lógica interna del contexto «equipos»: los demás contextos no pueden importar este fichero.
import { createHash, randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

/** El equipo tal como lo guarda este contexto; su estado lo lleva el contexto de préstamos (ADR 0004). */
export interface Equipo {
  id: string;
  nombre: string;
}

interface NombreUsado {
  id: string;
}

export const EQUIPOS = "equipos_equipos";
export const NOMBRES = "equipos_nombres";

export const FALTA_NOMBRE = "Falta el nombre del equipo";
export const NOMBRE_REPETIDO = "Ya hay un equipo con ese nombre";

export type ResultadoAlta =
  | { ok: true; equipo: EquipoCreado }
  | { ok: false; status: 400 | 409; error: string };

export const SOLO_IT = "Solo IT puede hacer esto.";

/** Si el correo es de una cuenta de IT: los de CORREOS_IT, separados por comas, sin distinguir mayúsculas. */
export function esCuentaDeIT(email: string | undefined, correosIT: string | undefined = process.env["CORREOS_IT"]): boolean {
  if (!email) return false;
  const buscado = email.trim().toLowerCase();
  return (correosIT ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .some((correo) => correo !== "" && correo === buscado);
}

/** El nombre sin espacios al principio ni al final y en minúsculas. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Id del documento del nombre normalizado: un resumen, porque el nombre puede llevar «/» u otros caracteres no válidos como id. */
function idDelNombre(normalizado: string): string {
  return createHash("sha256").update(normalizado).digest("hex");
}

/** Da de alta un equipo disponible; el nombre y el equipo se guardan en la misma transacción (ADR 0003). */
export async function crearEquipo(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string" || normalizarNombre(nombre) === "") {
    return { ok: false, status: 400, error: FALTA_NOMBRE };
  }
  const idNombre = idDelNombre(normalizarNombre(nombre));
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    const usado = await tx.obtener<NombreUsado>(NOMBRES, idNombre);
    if (usado) return { ok: false, status: 409, error: NOMBRE_REPETIDO };
    const equipo: Equipo = { id: randomUUID(), nombre };
    tx.guardar(EQUIPOS, equipo.id, equipo);
    tx.guardar(NOMBRES, idNombre, { id: equipo.id });
    return { ok: true, equipo: { id: equipo.id, nombre: equipo.nombre, estado: "disponible" } };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  return almacen.obtener<Equipo>(EQUIPOS, id);
}

/** Todos los equipos dados de alta. */
export function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  return almacen.listar<Equipo>(EQUIPOS);
}
