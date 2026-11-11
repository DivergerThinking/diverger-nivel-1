// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos as listarEquiposDados, obtenerEquipo } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];
type Estado = components["schemas"]["Estado"];

/** Colección con un documento por equipo, con id el del equipo. */
export const COLECCION_ESTADOS = "prestamos_estados";
/** Colección con un documento por préstamo. */
export const COLECCION_PRESTAMOS = "prestamos_prestamos";

interface EstadoGuardado {
  estado: Estado;
  persona?: string;
  devolucion?: string;
  prestamoId?: string;
}

interface Prestamo {
  id: string;
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  creadoEn: string;
}

/** Un fallo que se cuenta a quien llama, con el código HTTP y el mensaje del contrato. */
export class ErrorPrestamos extends Error {
  constructor(
    readonly codigo: 400 | 404 | 409,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** El día actual en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

/** Si el texto es una fecha AAAA-MM-DD que existe. */
export function esFechaValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function equipoConEstado(id: string, nombre: string, guardado: EstadoGuardado | undefined): Equipo {
  if (!guardado || guardado.estado === "disponible") return { id, nombre, estado: "disponible" };
  const equipo: Equipo = { id, nombre, estado: guardado.estado };
  if (guardado.persona !== undefined) equipo.persona = guardado.persona;
  if (guardado.devolucion !== undefined) equipo.devolucion = guardado.devolucion;
  return equipo;
}

/** Todos los equipos con su estado; un equipo sin estado guardado está disponible. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await listarEquiposDados(almacen);
  const estados = new Map<string, EstadoGuardado>();
  for (const equipo of equipos) {
    const guardado = await almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id);
    if (guardado) estados.set(equipo.id, guardado);
  }
  return equipos.map((equipo) => equipoConEstado(equipo.id, equipo.nombre, estados.get(equipo.id)));
}

/**
 * Solicitud de un equipo: lo deja reservado a nombre de la persona (el correo del token) con su fecha de
 * devolución. Un equipo solo se reserva si está disponible; el estado se lee y se escribe en una transacción.
 */
export async function solicitarEquipo(
  almacen: Almacen,
  id: string,
  persona: string,
  devolucion: string | undefined,
  hoy: string = hoyEnMadrid(),
): Promise<Equipo> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) throw new ErrorPrestamos(404, "No existe el equipo");
  if (devolucion === undefined || devolucion === "") throw new ErrorPrestamos(400, "Falta la fecha de devolución");
  if (!esFechaValida(devolucion)) throw new ErrorPrestamos(400, "La fecha de devolución no es válida");
  if (devolucion < hoy) throw new ErrorPrestamos(400, "La fecha de devolución ya ha pasado");

  return almacen.transaccion(async (tx) => {
    const actual = await tx.obtener<EstadoGuardado>(COLECCION_ESTADOS, id);
    if (actual && actual.estado !== "disponible") throw new ErrorPrestamos(409, "El equipo no está disponible");
    const prestamo: Prestamo = {
      id: randomUUID(),
      equipoId: id,
      persona,
      devolucion,
      estado: "reservado",
      creadoEn: new Date().toISOString(),
    };
    const nuevo: EstadoGuardado = { estado: "reservado", persona, devolucion, prestamoId: prestamo.id };
    tx.guardar(COLECCION_ESTADOS, id, nuevo);
    tx.guardar(COLECCION_PRESTAMOS, prestamo.id, prestamo);
    return equipoConEstado(id, equipo.nombre, nuevo);
  });
}
