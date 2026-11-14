// Equipos de la oficina: alta con nombre único (ADR 0003) y lectura para los demás contextos.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";

export const COLECCION_EQUIPOS = "equipos_equipos";
export const COLECCION_NOMBRES = "equipos_nombres";

export const FALTA_NOMBRE = "Falta el nombre del equipo";
export const NOMBRE_REPETIDO = "Ya hay un equipo con ese nombre";

export interface Equipo {
  id: string;
  nombre: string;
}

interface EquipoGuardado extends Equipo {
  claveNombre: string;
}

interface NombreGuardado {
  equipoId: string;
}

export type ResultadoAlta = { tipo: "creado"; equipo: Equipo } | { tipo: "sinNombre" } | { tipo: "repetido" };

/** Clave del nombre: sin espacios al principio ni al final y sin distinguir mayúsculas. */
export const claveDelNombre = (nombre: string): string => nombre.trim().toLowerCase();

/** Id del documento de la clave: sin «/» ni los ids «.» y «..», que la base no admite. */
const idDeClave = (clave: string): string => encodeURIComponent(clave).replace(/\./g, "%2E");

/** Da de alta un equipo disponible; en una sola transacción, para que dos altas a la vez no repitan el nombre. */
export async function darDeAlta(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string" || nombre.trim() === "") return { tipo: "sinNombre" };
  const claveNombre = claveDelNombre(nombre);
  const idClave = idDeClave(claveNombre);
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if (await tx.obtener<NombreGuardado>(COLECCION_NOMBRES, idClave)) return { tipo: "repetido" };
    const id = randomUUID();
    const guardado: EquipoGuardado = { id, nombre, claveNombre };
    tx.guardar(COLECCION_EQUIPOS, id, guardado);
    const clave: NombreGuardado = { equipoId: id };
    tx.guardar(COLECCION_NOMBRES, idClave, clave);
    return { tipo: "creado", equipo: { id, nombre } };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export async function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  const guardado = await almacen.obtener<EquipoGuardado>(COLECCION_EQUIPOS, id);
  return guardado && { id: guardado.id, nombre: guardado.nombre };
}

/** Todos los equipos, en cualquier orden. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const guardados = await almacen.listar<EquipoGuardado>(COLECCION_EQUIPOS);
  return guardados.map(({ id, nombre }) => ({ id, nombre }));
}
