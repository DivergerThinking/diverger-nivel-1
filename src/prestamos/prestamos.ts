// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";

export type EstadoPrestamo = "reservado" | "prestado" | "devuelto";

export interface Prestamo {
  id: string;
  equipo: string;
  persona: string;
  /** Fecha de devolución AAAA-MM-DD. */
  devolucion: string;
  estado: EstadoPrestamo;
  /** Instante de la solicitud o del préstamo en el mostrador (ISO 8601). */
  creado: string;
}

/** Documento de `prestamos_activos`: su id es el id del equipo. */
export interface Activo {
  prestamo: string;
}

export interface EquipoConEstado {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

export const COLECCION_PRESTAMOS = "prestamos_prestamos";
export const COLECCION_ACTIVOS = "prestamos_activos";

/** Hoy: el día actual en Madrid (AAAA-MM-DD), sea cual sea la zona horaria del servidor. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

export type ErrorFecha = "falta" | "no-valida" | "pasada";

/** Valida la fecha de devolución de una solicitud: texto AAAA-MM-DD de un día real que no sea anterior a hoy. */
export function validarDevolucion(valor: unknown, hoy: string): { ok: true; devolucion: string } | { ok: false; motivo: ErrorFecha } {
  if (valor === undefined || valor === null || valor === "") return { ok: false, motivo: "falta" };
  const partes = typeof valor === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor) : null;
  if (typeof valor !== "string" || partes === null) return { ok: false, motivo: "no-valida" };
  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    return { ok: false, motivo: "no-valida" };
  }
  if (valor < hoy) return { ok: false, motivo: "pasada" };
  return { ok: true, devolucion: valor };
}

export type ResultadoSolicitud =
  | { ok: true; equipo: EquipoConEstado }
  | { ok: false; motivo: "no-existe" | "no-disponible" };

/** Reserva el equipo a nombre de la persona si no tiene préstamo activo, en una transacción sobre `prestamos_activos`. */
export async function crearSolicitud(
  almacen: Almacen,
  idEquipo: string,
  persona: string,
  devolucion: string,
  ahora: Date = new Date(),
): Promise<ResultadoSolicitud> {
  const equipo = await obtenerEquipo(almacen, idEquipo);
  if (!equipo) return { ok: false, motivo: "no-existe" };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    if (await tx.obtener<Activo>(COLECCION_ACTIVOS, equipo.id)) return { ok: false, motivo: "no-disponible" };
    const prestamo: Prestamo = {
      id: randomUUID(),
      equipo: equipo.id,
      persona,
      devolucion,
      estado: "reservado",
      creado: ahora.toISOString(),
    };
    tx.guardar(COLECCION_PRESTAMOS, prestamo.id, prestamo);
    tx.guardar(COLECCION_ACTIVOS, equipo.id, { prestamo: prestamo.id } satisfies Activo);
    return { ok: true, equipo: { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion } };
  });
}

/** Todos los equipos con su estado; persona y devolución solo si están reservados o prestados. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<EquipoConEstado[]> {
  const equipos = await listarEquipos(almacen);
  return Promise.all(
    equipos.map(async ({ id, nombre }): Promise<EquipoConEstado> => {
      const activo = await almacen.obtener<Activo>(COLECCION_ACTIVOS, id);
      const prestamo = activo && (await almacen.obtener<Prestamo>(COLECCION_PRESTAMOS, activo.prestamo));
      if (!prestamo || prestamo.estado === "devuelto") return { id, nombre, estado: "disponible" };
      return { id, nombre, estado: prestamo.estado, persona: prestamo.persona, devolucion: prestamo.devolucion };
    }),
  );
}
