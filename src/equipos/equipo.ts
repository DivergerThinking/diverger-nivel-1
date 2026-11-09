// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
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

/** Da de alta un equipo: el nombre se guarda sin los espacios al principio y al final. */
export async function crearEquipo(almacen: Almacen, nombre: string): Promise<EquipoCreado> {
  const id = randomUUID();
  const limpio = nombre.trim();
  const documento: DocumentoEquipo = { id, nombre: limpio, creadoEn: new Date().toISOString() };
  await almacen.guardar(COLECCION_EQUIPOS, id, documento);
  return { id, nombre: limpio, estado: "disponible" };
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
