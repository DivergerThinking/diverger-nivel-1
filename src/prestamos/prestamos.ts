// Préstamos de los equipos: el estado de cada equipo se calcula con su préstamo activo (uno como mucho).
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";

export const COLECCION_PRESTAMOS = "prestamos_prestamos";
export const COLECCION_ACTIVOS = "prestamos_activos";

export const NO_EXISTE_EQUIPO = "No existe el equipo";

export type EstadoPrestamo = "reservado" | "prestado" | "devuelto";

export interface Prestamo {
  id: string;
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: EstadoPrestamo;
  creadoEn: string;
}

interface Activo {
  prestamoId: string;
}

export interface EquipoConEstado {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

export interface EntradaHistorial {
  persona: string;
  devolucion: string;
  estado: EstadoPrestamo;
}

/** Los préstamos del equipo, del más reciente al más antiguo; undefined si el equipo no existe. */
export async function consultarHistorial(almacen: Almacen, equipoId: string): Promise<EntradaHistorial[] | undefined> {
  if (!(await obtenerEquipo(almacen, equipoId))) return undefined;
  const prestamos = await almacen.listar<Prestamo>(COLECCION_PRESTAMOS);
  return prestamos
    .filter((prestamo) => prestamo.equipoId === equipoId)
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : a.creadoEn > b.creadoEn ? -1 : 0))
    .map(({ persona, devolucion, estado }) => ({ persona, devolucion, estado }));
}

/** Todos los equipos con su estado; si está reservado o prestado, también la persona y la fecha de devolución. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<EquipoConEstado[]> {
  const [equipos, activos, prestamos] = await Promise.all([
    listarEquipos(almacen),
    almacen.listar<Activo>(COLECCION_ACTIVOS),
    almacen.listar<Prestamo>(COLECCION_PRESTAMOS),
  ]);
  const porId = new Map(prestamos.map((prestamo) => [prestamo.id, prestamo]));
  const vigentes = new Map<string, Prestamo>();
  for (const { prestamoId } of activos) {
    const prestamo = porId.get(prestamoId);
    if (prestamo && prestamo.estado !== "devuelto") vigentes.set(prestamo.equipoId, prestamo);
  }
  return equipos.map(({ id, nombre }) => {
    const prestamo = vigentes.get(id);
    if (!prestamo || prestamo.estado === "devuelto") return { id, nombre, estado: "disponible" };
    return { id, nombre, estado: prestamo.estado, persona: prestamo.persona, devolucion: prestamo.devolucion };
  });
}
