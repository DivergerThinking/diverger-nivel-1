// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos as listarEquiposDeEquipos, obtenerEquipo } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Colección con como mucho un préstamo activo por equipo, con id el id del equipo. */
export const COLECCION_ACTIVOS = "prestamos_activos";

/** Préstamo activo de un equipo: reservado o prestado. */
export interface PrestamoActivo {
  idPrestamo: string;
  idEquipo: string;
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
}

/** Colección con un documento por préstamo, con id el id del préstamo. */
export const COLECCION_PRESTAMOS = "prestamos_prestamos";

/** Una operación no se ha podido hacer: el código HTTP y el mensaje que ve la persona. */
export class ErrorPrestamo extends Error {
  constructor(
    readonly codigo: 400 | 403 | 404 | 409,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Si el correo está en la variable CORREOS_IT (separados por comas, sin distinguir mayúsculas). */
export function esCuentaDeIT(email: string, correosIT: string | undefined = process.env["CORREOS_IT"]): boolean {
  const buscado = email.trim().toLowerCase();
  return (correosIT ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .some((correo) => correo !== "" && correo === buscado);
}

/** Falla con 403 «Solo IT puede hacer esto.» si el correo de la sesión no es de una cuenta de IT. */
export function exigirIT(persona: { email: string } | null): void {
  if (!persona || !esCuentaDeIT(persona.email)) throw new ErrorPrestamo(403, "Solo IT puede hacer esto.");
}

/** El día de hoy en Madrid como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(ahora);
}

function esFechaReal(fecha: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!partes) return false;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const real = new Date(Date.UTC(anio, mes - 1, dia));
  return real.getUTCFullYear() === anio && real.getUTCMonth() === mes - 1 && real.getUTCDate() === dia;
}

/**
 * Reserva un equipo disponible a nombre de quien lo pide (de todos, IT incluida). El equipo se comprueba y se
 * reserva en una transacción para que dos peticiones a la vez no lo reserven dos veces (ADR 0001).
 */
export async function solicitarEquipo(
  almacen: Almacen,
  idEquipo: string,
  persona: string,
  devolucionRecibida: unknown,
  hoy: string = hoyEnMadrid(),
): Promise<Equipo> {
  const equipo = await obtenerEquipo(almacen, idEquipo);
  if (equipo === undefined) throw new ErrorPrestamo(404, "No existe el equipo");
  if (devolucionRecibida === undefined || devolucionRecibida === null || devolucionRecibida === "") {
    throw new ErrorPrestamo(400, "Falta la fecha de devolución");
  }
  if (typeof devolucionRecibida !== "string" || !esFechaReal(devolucionRecibida)) {
    throw new ErrorPrestamo(400, "La fecha de devolución no es válida");
  }
  if (devolucionRecibida < hoy) throw new ErrorPrestamo(400, "La fecha de devolución ya ha pasado");
  const devolucion = devolucionRecibida;
  const idPrestamo = randomUUID();
  await almacen.transaccion(async (tx) => {
    if ((await tx.obtener(COLECCION_ACTIVOS, idEquipo)) !== undefined) {
      throw new ErrorPrestamo(409, "El equipo no está disponible");
    }
    const activo: PrestamoActivo = { idPrestamo, idEquipo, estado: "reservado", persona, devolucion };
    tx.guardar(COLECCION_PRESTAMOS, idPrestamo, { ...activo, id: idPrestamo, creado: new Date().toISOString() });
    tx.guardar(COLECCION_ACTIVOS, idEquipo, activo);
  });
  return { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion };
}

/**
 * Entrega un equipo reservado: pasa a prestado con la misma persona y devolución de la solicitud. Solo IT. La reserva
 * se lee y se cambia en una transacción para que dos entregas a la vez no la cambien dos veces.
 */
export async function entregarEquipo(almacen: Almacen, idEquipo: string, sesion: { email: string } | null): Promise<Equipo> {
  exigirIT(sesion);
  const equipo = await obtenerEquipo(almacen, idEquipo);
  if (equipo === undefined) throw new ErrorPrestamo(404, "No existe el equipo");
  const activo = await almacen.transaccion(async (tx) => {
    const actual = await tx.obtener<PrestamoActivo>(COLECCION_ACTIVOS, idEquipo);
    if (actual?.estado !== "reservado") throw new ErrorPrestamo(409, "El equipo no está reservado");
    const prestado: PrestamoActivo = { ...actual, estado: "prestado" };
    const prestamo = await tx.obtener<Record<string, unknown>>(COLECCION_PRESTAMOS, actual.idPrestamo);
    tx.guardar(COLECCION_PRESTAMOS, actual.idPrestamo, { ...(prestamo ?? { ...actual, id: actual.idPrestamo }), estado: "prestado" });
    tx.guardar(COLECCION_ACTIVOS, idEquipo, prestado);
    return prestado;
  });
  return { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona: activo.persona, devolucion: activo.devolucion };
}

/** Los equipos con su estado: disponible sin préstamo activo; si no, el del préstamo activo con persona y devolución. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await listarEquiposDeEquipos(almacen);
  const activos = await almacen.listar<PrestamoActivo>(COLECCION_ACTIVOS);
  const porEquipo = new Map(activos.map((activo) => [activo.idEquipo, activo]));
  return equipos.map((equipo): Equipo => {
    const activo = porEquipo.get(equipo.id);
    return activo === undefined
      ? { id: equipo.id, nombre: equipo.nombre, estado: "disponible" }
      : { id: equipo.id, nombre: equipo.nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
