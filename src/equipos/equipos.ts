// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Colección con un documento por equipo, con id el id del equipo. */
export const COLECCION_EQUIPOS = "equipos_equipos";

/** Colección con un documento por nombre normalizado (codificado), con el id del equipo. */
export const COLECCION_NOMBRES = "equipos_nombres";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

/** El alta no se ha podido hacer: el código HTTP y el mensaje que ve la persona. */
export class ErrorAlta extends Error {
  constructor(
    readonly codigo: 400 | 409,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** El nombre sin espacios en los extremos y en minúsculas. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Si el correo está en la variable CORREOS_IT (separados por comas, sin distinguir mayúsculas). */
export function esCuentaDeIT(email: string, correosIT: string | undefined = process.env["CORREOS_IT"]): boolean {
  const buscado = email.trim().toLowerCase();
  return (correosIT ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .some((correo) => correo !== "" && correo === buscado);
}

/**
 * Da de alta un equipo disponible. El nombre se guarda sin espacios en los extremos; el nombre normalizado
 * se reserva en la misma transacción para que dos altas a la vez no repitan nombre (ADR 0002).
 */
export async function darDeAltaEquipo(almacen: Almacen, nombreRecibido: unknown): Promise<EquipoCreado> {
  const nombre = typeof nombreRecibido === "string" ? nombreRecibido.trim() : "";
  if (nombre === "") throw new ErrorAlta(400, "Falta el nombre del equipo");
  const idNombre = Buffer.from(normalizarNombre(nombre), "utf8").toString("base64url");
  const id = randomUUID();
  await almacen.transaccion(async (tx) => {
    if ((await tx.obtener(COLECCION_NOMBRES, idNombre)) !== undefined) {
      throw new ErrorAlta(409, "Ya hay un equipo con ese nombre");
    }
    tx.guardar(COLECCION_NOMBRES, idNombre, { equipo: id });
    tx.guardar(COLECCION_EQUIPOS, id, { id, nombre });
  });
  return { id, nombre, estado: "disponible" };
}

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
