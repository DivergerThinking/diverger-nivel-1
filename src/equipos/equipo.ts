// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { createHash, randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

/** Equipo tal como lo ven los demás contextos. */
export interface Equipo {
  id: string;
  nombre: string;
}

export const COLECCION_EQUIPOS = "equipos_equipos";

// El almacén no devuelve el id al listar, así que el documento lo repite.
interface DocumentoEquipo extends Equipo {
  creadoEn: string;
}

/** Un documento por nombre normalizado: la transacción lo lee y lo escribe, así dos altas a la vez no repiten nombre. */
export const COLECCION_NOMBRES = "equipos_nombres";

export type ResultadoAlta =
  | { ok: true; equipo: EquipoCreado }
  | { ok: false; error: "nombre-vacio" | "nombre-repetido" };

/** Dos nombres son el mismo si solo cambian las mayúsculas o los espacios al principio o al final. */
function claveDeNombre(nombre: string): string {
  return createHash("sha256").update(nombre.trim().toLocaleLowerCase("es")).digest("hex");
}

/** Da de alta un equipo: el nombre se guarda sin los espacios al principio y al final y no se puede repetir. */
export async function crearEquipo(almacen: Almacen, nombre: string): Promise<ResultadoAlta> {
  const limpio = nombre.trim();
  if (limpio === "") return { ok: false, error: "nombre-vacio" };
  const id = randomUUID();
  const clave = claveDeNombre(limpio);
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if (await tx.obtener(COLECCION_NOMBRES, clave)) return { ok: false, error: "nombre-repetido" };
    const documento: DocumentoEquipo = { id, nombre: limpio, creadoEn: new Date().toISOString() };
    tx.guardar(COLECCION_NOMBRES, clave, { id });
    tx.guardar(COLECCION_EQUIPOS, id, documento);
    return { ok: true, equipo: { id, nombre: limpio, estado: "disponible" } };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export async function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  const documento = await almacen.obtener<DocumentoEquipo>(COLECCION_EQUIPOS, id);
  return documento ? { id: documento.id, nombre: documento.nombre } : undefined;
}

/** Todos los equipos, ordenados por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const documentos = await almacen.listar<DocumentoEquipo>(COLECCION_EQUIPOS);
  return documentos
    .map((d) => ({ id: d.id, nombre: d.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
