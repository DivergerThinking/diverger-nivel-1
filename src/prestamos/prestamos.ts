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
  /** El documento de historialPrestamos de este préstamo, para actualizar su estado. */
  historialId?: string;
}

interface MovimientoHistorial extends PrestamoActivo {
  reservadoEn?: string;
  entregadoEn?: string;
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

export type Vencido = components["schemas"]["Vencido"];

/** Los préstamos vencidos (prestados con devolución anterior a hoy), del más antiguo al más reciente. */
export async function listarVencidos(almacen: Almacen, hoy: string = hoyEnMadrid()): Promise<Vencido[]> {
  const [equipos, activos] = await Promise.all([listarEquipos(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const nombres = new Map(equipos.map((equipo) => [equipo.id, equipo.nombre]));
  const vencidos: Vencido[] = [];
  for (const activo of activos) {
    const nombre = nombres.get(activo.equipoId);
    if (nombre === undefined || activo.estado !== "prestado" || activo.devolucion >= hoy) continue;
    vencidos.push({ id: activo.equipoId, nombre, persona: activo.persona, devolucion: activo.devolucion });
  }
  return vencidos.sort((a, b) => a.devolucion.localeCompare(b.devolucion) || a.nombre.localeCompare(b.nombre));
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
    const historialId = randomUUID();
    const activo: PrestamoActivo = { equipoId, persona, devolucion, estado: "reservado", historialId };
    tx.guardar(ACTIVOS, equipoId, activo);
    tx.guardar(HISTORIAL, historialId, { ...activo, reservadoEn: new Date().toISOString() });
    return true;
  });
  if (!reservado) return "no-disponible";
  return { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion };
}

export type ResultadoPrestamo = EstadoEquipo | "falta" | "invalida" | "no-existe" | "no-disponible";

/**
 * Presta el equipo en el mostrador a la persona hasta la fecha de devolución, que puede ser anterior a hoy (IT apunta
 * préstamos con retraso). El préstamo activo y su movimiento del historial se escriben en la misma transacción.
 */
export async function prestarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: unknown,
  devolucion: unknown,
): Promise<ResultadoPrestamo> {
  if (typeof persona !== "string" || persona.trim() === "") return "falta";
  if (devolucion === undefined || devolucion === null || devolucion === "") return "falta";
  if (typeof devolucion !== "string" || !esFechaValida(devolucion)) return "invalida";
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return "no-existe";
  const quien = persona.trim();
  const prestado = await almacen.transaccion(async (tx) => {
    if (await tx.obtener<PrestamoActivo>(ACTIVOS, equipoId)) return false;
    const historialId = randomUUID();
    const activo: PrestamoActivo = { equipoId, persona: quien, devolucion, estado: "prestado", historialId };
    tx.guardar(ACTIVOS, equipoId, activo);
    tx.guardar(HISTORIAL, historialId, { ...activo, entregadoEn: new Date().toISOString() });
    return true;
  });
  if (!prestado) return "no-disponible";
  return { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona: quien, devolucion };
}

export type ResultadoDevolucion = EstadoEquipo | "no-existe" | "no-prestado";

/**
 * Apunta la devolución del equipo prestado: el equipo vuelve a estar disponible. Se borra el préstamo activo y el
 * movimiento del historial pasa a «devuelto» en la misma transacción.
 */
export async function devolverEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoDevolucion> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return "no-existe";
  const devuelto = await almacen.transaccion(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, equipoId);
    if (activo?.estado !== "prestado") return false;
    const movimiento = activo.historialId ? await tx.obtener<MovimientoHistorial>(HISTORIAL, activo.historialId) : undefined;
    tx.borrar(ACTIVOS, equipoId);
    tx.guardar(HISTORIAL, activo.historialId ?? randomUUID(), {
      ...(movimiento ?? activo),
      estado: "devuelto",
      devueltoEn: new Date().toISOString(),
    });
    return true;
  });
  if (!devuelto) return "no-prestado";
  return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
}

export type ResultadoEntrega =EstadoEquipo | "no-existe" | "no-reservado";

/**
 * Entrega el equipo reservado: pasa a prestado con la misma persona y fecha de devolución. El préstamo activo y su
 * movimiento del historial cambian en la misma transacción.
 */
export async function entregarEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoEntrega> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return "no-existe";
  const entregado = await almacen.transaccion(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, equipoId);
    if (activo?.estado !== "reservado") return undefined;
    const movimiento = activo.historialId ? await tx.obtener<MovimientoHistorial>(HISTORIAL, activo.historialId) : undefined;
    const prestado: PrestamoActivo = { ...activo, estado: "prestado" };
    tx.guardar(ACTIVOS, equipoId, prestado);
    tx.guardar(HISTORIAL, activo.historialId ?? randomUUID(), {
      ...(movimiento ?? activo),
      estado: "prestado",
      entregadoEn: new Date().toISOString(),
    });
    return prestado;
  });
  if (!entregado) return "no-reservado";
  return { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona: entregado.persona, devolucion: entregado.devolucion };
}
