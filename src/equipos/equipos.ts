// Lógica interna del contexto «equipos»: los demás contextos no pueden importar este fichero.
import { createHash, randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

const EQUIPOS = "equipos";

interface EquipoGuardado {
  id: string;
  nombre: string;
}

const aEquipo = (guardado: EquipoGuardado): Equipo => ({ id: guardado.id, nombre: guardado.nombre, estado: "disponible" });

/** Reserva de un nombre normalizado: su id es el hash del nombre, así dos altas iguales chocan en la transacción. */
const NOMBRES = "equipos_nombres";

const claveDeNombre = (limpio: string): string => createHash("sha256").update(limpio.toLowerCase()).digest("hex");

/**
 * Da de alta un equipo con ese nombre. Devuelve «vacio» si el nombre está vacío y «repetido» si ya hay un
 * equipo con el mismo nombre sin contar mayúsculas ni espacios al principio o al final.
 */
export async function crearEquipo(almacen: Almacen, nombre: string): Promise<Equipo | "vacio" | "repetido"> {
  const limpio = nombre.trim();
  if (limpio === "") return "vacio";
  const guardado: EquipoGuardado = { id: randomUUID(), nombre: limpio };
  const clave = claveDeNombre(limpio);
  const creado = await almacen.transaccion(async (tx) => {
    if (await tx.obtener(NOMBRES, clave)) return false;
    tx.guardar(NOMBRES, clave, { equipoId: guardado.id });
    tx.guardar(EQUIPOS, guardado.id, guardado);
    return true;
  });
  return creado ? aEquipo(guardado) : "repetido";
}

/** El equipo con ese id, o undefined si no existe. */
export async function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  const guardado = await almacen.obtener<EquipoGuardado>(EQUIPOS, id);
  return guardado ? aEquipo(guardado) : undefined;
}

/** Todos los equipos dados de alta. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  return (await almacen.listar<EquipoGuardado>(EQUIPOS)).map(aEquipo);
}
