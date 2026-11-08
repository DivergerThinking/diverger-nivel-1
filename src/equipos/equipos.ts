// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

export interface Equipo {
  id: string;
  nombre: string;
  nombreNormalizado: string;
}

interface NombreDeEquipo {
  equipoId: string;
}

export type ResultadoAlta =
  | { tipo: "creado"; equipo: Equipo }
  | { tipo: "sin-nombre" }
  | { tipo: "repetido" };

const EQUIPOS = "equipos_equipos";
const NOMBRES = "equipos_nombres";

/** El nombre en minúsculas y sin los espacios del principio y del final: la clave de unicidad. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Documento de `equipos_nombres` de un nombre normalizado (sin «/» ni nombres reservados como «..»). */
function idDeNombre(normalizado: string): string {
  return `n-${encodeURIComponent(normalizado)}`;
}

/** Da de alta un equipo; el nombre llega sin validar. Los dos documentos se crean en una sola transacción. */
export async function crearEquipo(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string") return { tipo: "sin-nombre" };
  const limpio = nombre.trim();
  if (limpio === "") return { tipo: "sin-nombre" };
  const normalizado = normalizarNombre(limpio);

  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    const existente = await tx.obtener<NombreDeEquipo>(NOMBRES, idDeNombre(normalizado));
    if (existente) return { tipo: "repetido" };
    const equipo: Equipo = { id: randomUUID(), nombre: limpio, nombreNormalizado: normalizado };
    tx.guardar(EQUIPOS, equipo.id, equipo);
    tx.guardar(NOMBRES, idDeNombre(normalizado), { equipoId: equipo.id } satisfies NombreDeEquipo);
    return { tipo: "creado", equipo };
  });
}

/** El equipo con ese id, o undefined si no existe. */
export function obtenerEquipo(almacen: Almacen, id: string): Promise<Equipo | undefined> {
  return almacen.obtener<Equipo>(EQUIPOS, id);
}

/** Todos los equipos dados de alta, por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await almacen.listar<Equipo>(EQUIPOS);
  return equipos.sort((a, b) => a.nombre.localeCompare(b.nombre));
}
