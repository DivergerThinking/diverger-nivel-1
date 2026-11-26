// Lógica interna del contexto «equipos»: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

const EQUIPOS = "equipos";

interface EquipoGuardado {
  id: string;
  nombre: string;
}

const aEquipo = (guardado: EquipoGuardado): Equipo => ({ id: guardado.id, nombre: guardado.nombre, estado: "disponible" });

/** Da de alta un equipo con ese nombre; null si el nombre está vacío. */
export async function crearEquipo(almacen: Almacen, nombre: string): Promise<Equipo | null> {
  const limpio = nombre.trim();
  if (limpio === "") return null;
  const guardado: EquipoGuardado = { id: randomUUID(), nombre: limpio };
  await almacen.guardar(EQUIPOS, guardado.id, guardado);
  return aEquipo(guardado);
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
