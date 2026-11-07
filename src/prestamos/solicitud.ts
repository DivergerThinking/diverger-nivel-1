// Pedir un equipo libre: queda reservado a nombre de quien lo pide hasta que IT lo entrega.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import { COLECCION_ESTADOS, type EquipoConEstado, type EstadoGuardado } from "./estados.js";

export const COLECCION_PRESTAMOS = "prestamos_prestamos";

export const MENSAJE_FALTA_FECHA = "Falta la fecha de devolución";
export const MENSAJE_FECHA_NO_VALIDA = "La fecha de devolución no es válida";
export const MENSAJE_FECHA_PASADA = "La fecha de devolución ya ha pasado";
export const MENSAJE_NO_EXISTE = "No existe el equipo";
export const MENSAJE_NO_DISPONIBLE = "El equipo no está disponible";

/** Documento de «prestamos_prestamos»: un préstamo del historial de un equipo. */
export interface PrestamoGuardado {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  inicio: string;
}

export type ResultadoSolicitud =
  | { ok: true; equipo: EquipoConEstado }
  | { ok: false; codigo: 400 | 404 | 409; error: string };

/** El día de hoy en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const valor = (tipo: string): string => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/** Una fecha AAAA-MM-DD que existe en el calendario. */
export function esFechaReal(texto: string): boolean {
  const coincide = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!coincide) return false;
  const [anio, mes, dia] = [Number(coincide[1]), Number(coincide[2]), Number(coincide[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function validarDevolucion(cuerpo: unknown, ahora: Date): { ok: true; devolucion: string } | { ok: false; error: string } {
  const bruto = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { devolucion?: unknown }).devolucion : undefined;
  if (bruto === undefined || bruto === null || bruto === "") return { ok: false, error: MENSAJE_FALTA_FECHA };
  if (typeof bruto !== "string" || !esFechaReal(bruto)) return { ok: false, error: MENSAJE_FECHA_NO_VALIDA };
  if (bruto < hoyEnMadrid(ahora)) return { ok: false, error: MENSAJE_FECHA_PASADA };
  return { ok: true, devolucion: bruto };
}

export async function solicitarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: string,
  cuerpo: unknown,
  ahora: Date,
): Promise<ResultadoSolicitud> {
  const fecha = validarDevolucion(cuerpo, ahora);
  if (!fecha.ok) return { ok: false, codigo: 400, error: fecha.error };

  // Los equipos no se dan de baja, así que comprobar que existe fuera de la transacción es seguro.
  const equipo = (await listarEquipos(almacen)).find((e) => e.id === equipoId);
  if (equipo === undefined) return { ok: false, codigo: 404, error: MENSAJE_NO_EXISTE };

  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    if ((await tx.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id)) !== undefined) {
      return { ok: false, codigo: 409, error: MENSAJE_NO_DISPONIBLE };
    }
    const prestamoId = randomUUID();
    const prestamo: PrestamoGuardado = {
      equipoId: equipo.id,
      persona,
      devolucion: fecha.devolucion,
      estado: "reservado",
      inicio: ahora.toISOString(),
    };
    const estado: EstadoGuardado = { estado: "reservado", persona, devolucion: fecha.devolucion, prestamoId };
    tx.guardar(COLECCION_PRESTAMOS, prestamoId, prestamo);
    tx.guardar(COLECCION_ESTADOS, equipo.id, estado);
    return {
      ok: true,
      equipo: { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion: fecha.devolucion },
    };
  });
}
