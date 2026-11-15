// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

interface DocumentoEquipo {
  id: string;
  nombre: string;
  nombreNormalizado: string;
}

interface DocumentoNombre {
  equipoId: string;
}

export const FALTA_NOMBRE = "Falta el nombre del equipo";
export const NOMBRE_REPETIDO = "Ya hay un equipo con ese nombre";

/** Error de una regla del contexto, con el código HTTP que le toca. */
export class ErrorDeEquipos extends Error {
  constructor(
    readonly codigo: 400 | 409,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

const COLECCION_EQUIPOS = "equipos_equipos";
const COLECCION_NOMBRES = "equipos_nombres";

/** Da de alta un equipo `disponible`; el nombre es único sin contar mayúsculas ni espacios de los extremos. */
export async function crearEquipo(almacen: Almacen, nombre: unknown): Promise<EquipoCreado> {
  const limpio = typeof nombre === "string" ? nombre.trim() : "";
  if (limpio === "") throw new ErrorDeEquipos(400, FALTA_NOMBRE);
  const nombreNormalizado = limpio.toLowerCase();

  return almacen.transaccion(async (tx) => {
    if (await tx.obtener<DocumentoNombre>(COLECCION_NOMBRES, nombreNormalizado)) {
      throw new ErrorDeEquipos(409, NOMBRE_REPETIDO);
    }
    const id = randomUUID();
    tx.guardar(COLECCION_EQUIPOS, id, { id, nombre: limpio, nombreNormalizado } satisfies DocumentoEquipo);
    tx.guardar(COLECCION_NOMBRES, nombreNormalizado, { equipoId: id } satisfies DocumentoNombre);
    return { id, nombre: limpio, estado: "disponible" };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export async function obtenerEquipo(almacen: Almacen, id: string): Promise<{ id: string; nombre: string } | undefined> {
  const documento = await almacen.obtener<DocumentoEquipo>(COLECCION_EQUIPOS, id);
  return documento && { id: documento.id, nombre: documento.nombre };
}

/** Todos los equipos, por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<{ id: string; nombre: string }[]> {
  const documentos = await almacen.listar<DocumentoEquipo>(COLECCION_EQUIPOS);
  return documentos
    .map(({ id, nombre }) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
