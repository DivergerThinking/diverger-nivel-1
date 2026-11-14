// Préstamos de los equipos: el estado de cada equipo se calcula con su préstamo activo (uno como mucho).
import { randomUUID } from "node:crypto";
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

export const FALTA_FECHA = "Falta la fecha de devolución";
export const FECHA_NO_VALIDA = "La fecha de devolución no es válida";
export const FECHA_PASADA = "La fecha de devolución ya ha pasado";
export const NO_DISPONIBLE = "El equipo no está disponible";

export type ResultadoSolicitud =
  | { tipo: "reservado"; equipo: EquipoConEstado }
  | { tipo: "sinFecha" }
  | { tipo: "fechaNoValida" }
  | { tipo: "fechaPasada" }
  | { tipo: "noExiste" }
  | { tipo: "noDisponible" };

/** Hoy en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** Si el texto es una fecha real AAAA-MM-DD («2026-02-30» no lo es). */
export function esFechaReal(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/**
 * Reserva un equipo disponible a nombre de la persona, con su fecha de devolución. Lee el préstamo activo y escribe
 * en una sola transacción, para que dos solicitudes a la vez no reserven el mismo equipo.
 */
export async function solicitarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: string,
  devolucion: unknown,
  ahora: Date = new Date(),
): Promise<ResultadoSolicitud> {
  if (typeof devolucion !== "string" || devolucion.trim() === "") return { tipo: "sinFecha" };
  if (!esFechaReal(devolucion)) return { tipo: "fechaNoValida" };
  if (devolucion < hoyEnMadrid(ahora)) return { tipo: "fechaPasada" };
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { tipo: "noExiste" };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const activo = await tx.obtener<Activo>(COLECCION_ACTIVOS, equipoId);
    const vigente = activo && (await tx.obtener<Prestamo>(COLECCION_PRESTAMOS, activo.prestamoId));
    if (vigente && vigente.estado !== "devuelto") return { tipo: "noDisponible" };
    const id = randomUUID();
    const prestamo: Prestamo = { id, equipoId, persona, devolucion, estado: "reservado", creadoEn: ahora.toISOString() };
    tx.guardar(COLECCION_PRESTAMOS, id, prestamo);
    const nuevoActivo: Activo = { prestamoId: id };
    tx.guardar(COLECCION_ACTIVOS, equipoId, nuevoActivo);
    return { tipo: "reservado", equipo: { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion } };
  });
}

export const NO_RESERVADO = "El equipo no está reservado";

export type ResultadoEntrega =
  | { tipo: "prestado"; equipo: EquipoConEstado }
  | { tipo: "noExiste" }
  | { tipo: "noReservado" };

/**
 * Pasa un equipo reservado a prestado, con la misma persona y fecha de devolución. Lee el préstamo activo y escribe en
 * una sola transacción, para que dos entregas a la vez no se pisen.
 */
export async function entregarEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoEntrega> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { tipo: "noExiste" };
  return almacen.transaccion<ResultadoEntrega>(async (tx) => {
    const activo = await tx.obtener<Activo>(COLECCION_ACTIVOS, equipoId);
    const vigente = activo && (await tx.obtener<Prestamo>(COLECCION_PRESTAMOS, activo.prestamoId));
    if (!vigente || vigente.estado !== "reservado") return { tipo: "noReservado" };
    tx.guardar(COLECCION_PRESTAMOS, vigente.id, { ...vigente, estado: "prestado" });
    return {
      tipo: "prestado",
      equipo: { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona: vigente.persona, devolucion: vigente.devolucion },
    };
  });
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
