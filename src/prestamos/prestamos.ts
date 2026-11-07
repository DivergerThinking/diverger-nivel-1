// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { getEquipment, listEquipment } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Préstamo activo (agregado): uno por equipo como mucho, con id el del equipo. */
export interface PrestamoActivo {
  equipoId: string;
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
  prestamoId: string;
}

export const ACTIVOS = "prestamos_activos";

/** Préstamo del historial: uno por solicitud o préstamo en el mostrador. */
export interface Prestamo {
  id: string;
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  creadoEn: string;
}

export const HISTORIAL = "prestamos_historial";

/** Resultado de pedir un equipo: el equipo reservado o el motivo por el que no se reserva. */
export type ResultadoSolicitud =
  | { tipo: "reservado"; equipo: Equipo }
  | { tipo: "sin-fecha" | "fecha-no-valida" | "fecha-pasada" | "no-existe" | "no-disponible" };

/** Hoy en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const valor = (tipo: string): string => partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/** Una fecha AAAA-MM-DD que existe en el calendario. */
export function esFechaValida(texto: string): boolean {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (coincidencia === null) return false;
  const [anio, mes, dia] = [Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/**
 * Pide un equipo: lo deja reservado a nombre de la persona. La fecha no puede ser anterior a `hoy`; el
 * préstamo activo se lee y se escribe junto al historial en una transacción, para no reservar dos veces.
 */
export async function pedirEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: string,
  devolucion: unknown,
  hoy: string,
): Promise<ResultadoSolicitud> {
  if (devolucion === undefined || devolucion === null || devolucion === "") return { tipo: "sin-fecha" };
  if (typeof devolucion !== "string" || !esFechaValida(devolucion)) return { tipo: "fecha-no-valida" };
  if (devolucion < hoy) return { tipo: "fecha-pasada" };
  const equipo = await getEquipment(almacen, equipoId);
  if (equipo === undefined) return { tipo: "no-existe" };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    if ((await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id)) !== undefined) return { tipo: "no-disponible" };
    const prestamoId = randomUUID();
    tx.guardar(ACTIVOS, equipo.id, { equipoId: equipo.id, estado: "reservado", persona, devolucion, prestamoId } satisfies PrestamoActivo);
    tx.guardar(HISTORIAL, prestamoId, {
      id: prestamoId,
      equipoId: equipo.id,
      persona,
      devolucion,
      estado: "reservado",
      creadoEn: new Date().toISOString(),
    } satisfies Prestamo);
    return { tipo: "reservado", equipo: { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion } };
  });
}

/**
 * Entrega un equipo reservado: lo deja prestado con la misma persona y fecha de la solicitud. El préstamo
 * activo y el del historial se cambian en una transacción, para que dos entregas no pisen la misma reserva.
 */
export async function entregarEquipo(
  almacen: Almacen,
  equipoId: string,
): Promise<{ tipo: "prestado"; equipo: Equipo } | { tipo: "no-existe" | "no-reservado" }> {
  const equipo = await getEquipment(almacen, equipoId);
  if (equipo === undefined) return { tipo: "no-existe" };
  return almacen.transaccion<{ tipo: "prestado"; equipo: Equipo } | { tipo: "no-existe" | "no-reservado" }>(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id);
    if (activo === undefined || activo.estado !== "reservado") return { tipo: "no-reservado" };
    const entregado: PrestamoActivo = { ...activo, estado: "prestado" };
    const prestamo = await tx.obtener<Prestamo>(HISTORIAL, activo.prestamoId);
    tx.guardar(ACTIVOS, equipo.id, entregado);
    if (prestamo !== undefined) tx.guardar(HISTORIAL, activo.prestamoId, { ...prestamo, estado: "prestado" } satisfies Prestamo);
    return {
      tipo: "prestado",
      equipo: { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona: activo.persona, devolucion: activo.devolucion },
    };
  });
}

/**
 * Apunta la devolución de un equipo prestado: el equipo vuelve a estar disponible (sin préstamo activo) y el
 * préstamo del historial queda devuelto. Ambos cambios van en una transacción, para que dos devoluciones no se pisen.
 */
export async function devolverEquipo(
  almacen: Almacen,
  equipoId: string,
): Promise<{ tipo: "disponible"; equipo: Equipo } | { tipo: "no-existe" | "no-prestado" }> {
  const equipo = await getEquipment(almacen, equipoId);
  if (equipo === undefined) return { tipo: "no-existe" };
  return almacen.transaccion<{ tipo: "disponible"; equipo: Equipo } | { tipo: "no-existe" | "no-prestado" }>(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id);
    if (activo === undefined || activo.estado !== "prestado") return { tipo: "no-prestado" };
    const prestamo = await tx.obtener<Prestamo>(HISTORIAL, activo.prestamoId);
    tx.borrar(ACTIVOS, equipo.id);
    if (prestamo !== undefined) tx.guardar(HISTORIAL, activo.prestamoId, { ...prestamo, estado: "devuelto" } satisfies Prestamo);
    return { tipo: "disponible", equipo: { id: equipo.id, nombre: equipo.nombre, estado: "disponible" } };
  });
}

/**
 * Presta un equipo disponible en el mostrador: queda prestado a la persona indicada. IT puede poner una fecha
 * anterior a hoy, porque a veces apunta los préstamos con retraso. El préstamo activo se lee y se escribe junto
 * al historial en una transacción, para no prestar un equipo ya reservado o prestado.
 */
export async function prestarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: unknown,
  devolucion: unknown,
): Promise<{ tipo: "prestado"; equipo: Equipo } | { tipo: "faltan-datos" | "fecha-no-valida" | "no-existe" | "no-disponible" }> {
  type Resultado = { tipo: "prestado"; equipo: Equipo } | { tipo: "faltan-datos" | "fecha-no-valida" | "no-existe" | "no-disponible" };
  if (typeof persona !== "string" || persona.trim() === "") return { tipo: "faltan-datos" };
  if (devolucion === undefined || devolucion === null || devolucion === "") return { tipo: "faltan-datos" };
  if (typeof devolucion !== "string" || !esFechaValida(devolucion)) return { tipo: "fecha-no-valida" };
  const equipo = await getEquipment(almacen, equipoId);
  if (equipo === undefined) return { tipo: "no-existe" };
  return almacen.transaccion<Resultado>(async (tx) => {
    if ((await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id)) !== undefined) return { tipo: "no-disponible" };
    const prestamoId = randomUUID();
    tx.guardar(ACTIVOS, equipo.id, { equipoId: equipo.id, estado: "prestado", persona, devolucion, prestamoId } satisfies PrestamoActivo);
    tx.guardar(HISTORIAL, prestamoId, {
      id: prestamoId,
      equipoId: equipo.id,
      persona,
      devolucion,
      estado: "prestado",
      creadoEn: new Date().toISOString(),
    } satisfies Prestamo);
    return { tipo: "prestado", equipo: { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona, devolucion } };
  });
}

/** Lista los equipos con su estado: sin préstamo activo está disponible, y sin persona ni devolución. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const [equipos, activos] = await Promise.all([listEquipment(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const porEquipo = new Map(activos.map((activo) => [activo.equipoId, activo]));
  return equipos.map(({ id, nombre }): Equipo => {
    const activo = porEquipo.get(id);
    if (activo === undefined) return { id, nombre, estado: "disponible" };
    return { id, nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
