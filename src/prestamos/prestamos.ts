// Lógica interna del contexto «prestamos»: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type EstadoEquipo = components["schemas"]["EstadoEquipo"];

const ACTIVOS = "prestamosActivos";
const HISTORIAL = "historialPrestamos";

interface PrestamoActivo {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado";
}

/** El día de hoy en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(ahora);
}

/** Si el texto es una fecha AAAA-MM-DD que existe. */
export function esFechaValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/** Todos los equipos con su estado: «disponible» sin préstamo activo; si no, el del préstamo activo. */
export async function listarEstadoDeEquipos(almacen: Almacen): Promise<EstadoEquipo[]> {
  const [equipos, activos] = await Promise.all([listarEquipos(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const porEquipo = new Map(activos.map((activo) => [activo.equipoId, activo]));
  return equipos.map((equipo) => {
    const activo = porEquipo.get(equipo.id);
    if (!activo) return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
    return { id: equipo.id, nombre: equipo.nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}

export type ResultadoSolicitud = EstadoEquipo | "falta" | "invalida" | "pasada" | "no-existe" | "no-disponible";

/**
 * Reserva el equipo para la persona hasta la fecha de devolución. La reserva y su movimiento del historial se
 * escriben en la misma transacción, y el préstamo activo del equipo hace que dos peticiones a la vez no lo reserven dos veces.
 */
export async function solicitarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: string,
  devolucion: unknown,
  hoy: string = hoyEnMadrid(),
): Promise<ResultadoSolicitud> {
  if (devolucion === undefined || devolucion === null || devolucion === "") return "falta";
  if (typeof devolucion !== "string" || !esFechaValida(devolucion)) return "invalida";
  if (devolucion < hoy) return "pasada";
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return "no-existe";
  const reservado = await almacen.transaccion(async (tx) => {
    if (await tx.obtener<PrestamoActivo>(ACTIVOS, equipoId)) return false;
    const activo: PrestamoActivo = { equipoId, persona, devolucion, estado: "reservado" };
    tx.guardar(ACTIVOS, equipoId, activo);
    tx.guardar(HISTORIAL, randomUUID(), { ...activo, reservadoEn: new Date().toISOString() });
    return true;
  });
  if (!reservado) return "no-disponible";
  return { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion };
}
