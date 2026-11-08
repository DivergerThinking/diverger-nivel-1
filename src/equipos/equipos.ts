// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";

export interface Equipo {
  id: string;
  nombre: string;
}

interface NombreReservado {
  equipo: string;
}

export const COLECCION_EQUIPOS = "equipos_equipos";
export const COLECCION_NOMBRES = "equipos_nombres";

/** El nombre sin espacios en los extremos y en minúsculas: la clave de unicidad. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Id del documento de un nombre normalizado: sin «/» ni «.» sueltos, que la base no admite en un id. */
function idDeNombre(normalizado: string): string {
  return encodeURIComponent(normalizado).replace(/\./g, "%2E");
}

export type ResultadoAlta = { ok: true; equipo: Equipo } | { ok: false; motivo: "duplicado" };

/** Da de alta el equipo si ningún otro tiene el mismo nombre normalizado, en una sola transacción. */
export function darDeAlta(almacen: Almacen, nombre: string): Promise<ResultadoAlta> {
  const idNombre = idDeNombre(normalizarNombre(nombre));
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if (await tx.obtener<NombreReservado>(COLECCION_NOMBRES, idNombre)) return { ok: false, motivo: "duplicado" };
    const equipo: Equipo = { id: randomUUID(), nombre };
    tx.guardar(COLECCION_EQUIPOS, equipo.id, equipo);
    tx.guardar(COLECCION_NOMBRES, idNombre, { equipo: equipo.id } satisfies NombreReservado);
    return { ok: true, equipo };
  });
}

export function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  return almacen.obtener<Equipo>(COLECCION_EQUIPOS, id);
}

export function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  return almacen.listar<Equipo>(COLECCION_EQUIPOS);
}
