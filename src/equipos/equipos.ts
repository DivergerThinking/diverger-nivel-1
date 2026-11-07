// Alta de equipos: un equipo se identifica por su nombre sin mayúsculas ni espacios de alrededor.
import { createHash, randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";

export const COLECCION_EQUIPOS = "equipos_equipos";
/** Un documento por nombre normalizado: leerlo dentro de la transacción garantiza que el nombre es único. */
export const COLECCION_NOMBRES = "equipos_nombres";

export const MENSAJE_FALTA_NOMBRE = "Falta el nombre del equipo";
export const MENSAJE_NOMBRE_REPETIDO = "Ya hay un equipo con ese nombre";

export interface Equipo {
  id: string;
  nombre: string;
  estado: "disponible";
}

export type ResultadoAlta =
  | { ok: true; equipo: Equipo }
  | { ok: false; codigo: 400 | 409; error: string };

/** Dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLocaleLowerCase("es");
}

function claveDeNombre(normalizado: string): string {
  return createHash("sha256").update(normalizado).digest("hex");
}

/** Todos los equipos dados de alta, por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await almacen.listar<Equipo>(COLECCION_EQUIPOS);
  return equipos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function darDeAltaEquipo(almacen: Almacen, cuerpo: unknown): Promise<ResultadoAlta> {
  const bruto = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { nombre?: unknown }).nombre : undefined;
  const nombre = typeof bruto === "string" ? bruto.trim() : "";
  if (nombre === "") return { ok: false, codigo: 400, error: MENSAJE_FALTA_NOMBRE };

  const clave = claveDeNombre(normalizarNombre(nombre));
  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if ((await tx.obtener(COLECCION_NOMBRES, clave)) !== undefined) {
      return { ok: false, codigo: 409, error: MENSAJE_NOMBRE_REPETIDO };
    }
    const equipo: Equipo = { id: randomUUID(), nombre, estado: "disponible" };
    tx.guardar(COLECCION_EQUIPOS, equipo.id, equipo);
    tx.guardar(COLECCION_NOMBRES, clave, { equipoId: equipo.id });
    return { ok: true, equipo };
  });
}
