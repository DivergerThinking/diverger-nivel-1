// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoNuevo = components["schemas"]["EquipoNuevo"];

/** Equipo (agregado): el id lo genera la aplicación y el nombre se guarda sin espacios en los extremos. */
export interface Equipment {
  id: string;
  nombre: string;
}

export const EQUIPOS = "equipos_equipos";
export const NOMBRES = "equipos_nombres";

/** Resultado del alta: el equipo creado o el motivo por el que no se crea. */
export type ResultadoAlta = { tipo: "creado"; equipo: EquipoNuevo } | { tipo: "sin-nombre" } | { tipo: "repetido" };

/** Nombre normalizado: sin espacios en los extremos y en minúsculas. */
export function normalizedName(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Cuenta de IT: un correo de la lista (separada por comas), comparado sin distinguir mayúsculas. */
export function isItAccount(email: string, lista: string | undefined = process.env.CORREOS_IT): boolean {
  const buscado = email.trim().toLowerCase();
  if (!buscado) return false;
  return (lista ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .some((correo) => correo === buscado);
}

/** Da de alta un equipo; el nombre repetido se detecta en la misma transacción que crea los documentos. */
export async function crearEquipo(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string" || nombre.trim() === "") return { tipo: "sin-nombre" };
  const limpio = nombre.trim();
  const clave = normalizedName(limpio);
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if ((await tx.obtener(NOMBRES, clave)) !== undefined) return { tipo: "repetido" };
    const id = randomUUID();
    tx.guardar(EQUIPOS, id, { id, nombre: limpio } satisfies Equipment);
    tx.guardar(NOMBRES, clave, { equipoId: id });
    return { tipo: "creado", equipo: { id, nombre: limpio, estado: "disponible" } };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export async function getEquipment(almacen: Almacen, id: string): Promise<Equipment | undefined> {
  const equipo = await almacen.obtener<Equipment>(EQUIPOS, id);
  return equipo === undefined ? undefined : { id: equipo.id, nombre: equipo.nombre };
}

/** Todos los equipos, ordenados por nombre. */
export async function listEquipment(almacen: Almacen): Promise<Equipment[]> {
  const equipos = await almacen.listar<Equipment>(EQUIPOS);
  return equipos.map(({ id, nombre }) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
