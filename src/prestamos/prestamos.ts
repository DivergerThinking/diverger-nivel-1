// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

interface DocumentoEstado {
  equipoId: string;
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
  prestamoId: string;
}

interface DocumentoPrestamo {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  inicio: string;
}

export const FALTA_FECHA = "Falta la fecha de devolución";
export const FECHA_NO_VALIDA = "La fecha de devolución no es válida";
export const FECHA_PASADA = "La fecha de devolución ya ha pasado";
export const FALTAN_DATOS = "Faltan la persona o la fecha de devolución";
export const NO_EXISTE_EQUIPO = "No existe el equipo";
export const NO_DISPONIBLE = "El equipo no está disponible";
export const NO_RESERVADO = "El equipo no está reservado";
export const NO_PRESTADO = "El equipo no está prestado";

/** Error de una regla del contexto, con el código HTTP que le toca. */
export class ErrorDePrestamos extends Error {
  constructor(
    readonly codigo: 400 | 404 | 409,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

const COLECCION_ESTADOS = "prestamos_estados";
const COLECCION_HISTORIAL = "prestamos_historial";

/** El día actual en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(ahora);
}

/** Valida una fecha AAAA-MM-DD que exista; devuelve la misma fecha. */
function fechaDeDevolucion(valor: unknown): string {
  if (valor === undefined || valor === null || valor === "") throw new ErrorDePrestamos(400, FALTA_FECHA);
  if (typeof valor !== "string") throw new ErrorDePrestamos(400, FECHA_NO_VALIDA);
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) throw new ErrorDePrestamos(400, FECHA_NO_VALIDA);
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    throw new ErrorDePrestamos(400, FECHA_NO_VALIDA);
  }
  return valor;
}

function aEquipo(base: { id: string; nombre: string }, estado: DocumentoEstado | undefined): Equipo {
  return estado
    ? { ...base, estado: estado.estado, persona: estado.persona, devolucion: estado.devolucion }
    : { ...base, estado: "disponible" };
}

/** Todos los equipos con su estado, por nombre. Un equipo sin estado guardado está disponible. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<Equipo[]> {
  const [equipos, estados] = await Promise.all([listarEquipos(almacen), almacen.listar<DocumentoEstado>(COLECCION_ESTADOS)]);
  const porEquipo = new Map(estados.map((estado) => [estado.equipoId, estado]));
  return equipos.map((equipo) => aEquipo(equipo, porEquipo.get(equipo.id)));
}

/** Equipos prestados cuya devolución es anterior a `hoy` (día actual en Madrid), del más antiguo al más reciente. */
export async function listarVencidos(
  almacen: Almacen,
  hoy: string = hoyEnMadrid(),
): Promise<components["schemas"]["PrestamoVencido"][]> {
  const equipos = await listarEquiposConEstado(almacen);
  const vencidos: components["schemas"]["PrestamoVencido"][] = [];
  for (const equipo of equipos) {
    if (equipo.estado === "prestado" && equipo.persona && equipo.devolucion && equipo.devolucion < hoy) {
      vencidos.push({ id: equipo.id, nombre: equipo.nombre, persona: equipo.persona, devolucion: equipo.devolucion });
    }
  }
  return vencidos.sort((a, b) => a.devolucion.localeCompare(b.devolucion) || a.nombre.localeCompare(b.nombre));
}

/** Entrega un equipo reservado: pasa a prestado con la misma persona y fecha de devolución. */
export async function entregarEquipo(almacen: Almacen, id: string): Promise<Equipo> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) throw new ErrorDePrestamos(404, NO_EXISTE_EQUIPO);

  return almacen.transaccion(async (tx) => {
    const actual = await tx.obtener<DocumentoEstado>(COLECCION_ESTADOS, id);
    if (actual?.estado !== "reservado") throw new ErrorDePrestamos(409, NO_RESERVADO);
    const prestamo = await tx.obtener<DocumentoPrestamo>(COLECCION_HISTORIAL, actual.prestamoId);
    const estado: DocumentoEstado = { ...actual, estado: "prestado" };
    tx.guardar(COLECCION_ESTADOS, id, estado);
    if (prestamo) tx.guardar(COLECCION_HISTORIAL, actual.prestamoId, { ...prestamo, estado: "prestado" });
    return aEquipo(equipo, estado);
  });
}

/** Apunta la devolución de un equipo prestado: vuelve a estar disponible y su préstamo queda como devuelto. */
export async function registrarDevolucion(almacen: Almacen, id: string): Promise<Equipo> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) throw new ErrorDePrestamos(404, NO_EXISTE_EQUIPO);

  return almacen.transaccion(async (tx) => {
    const actual = await tx.obtener<DocumentoEstado>(COLECCION_ESTADOS, id);
    if (actual?.estado !== "prestado") throw new ErrorDePrestamos(409, NO_PRESTADO);
    const prestamo = await tx.obtener<DocumentoPrestamo>(COLECCION_HISTORIAL, actual.prestamoId);
    tx.borrar(COLECCION_ESTADOS, id);
    if (prestamo) tx.guardar(COLECCION_HISTORIAL, actual.prestamoId, { ...prestamo, estado: "devuelto" });
    return aEquipo(equipo, undefined);
  });
}

/** Presta en el mostrador un equipo disponible a `persona`. Admite fechas pasadas: IT apunta préstamos con retraso. */
export async function prestarEquipo(
  almacen: Almacen,
  id: string,
  personaPedida: unknown,
  devolucionPedida: unknown,
): Promise<Equipo> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) throw new ErrorDePrestamos(404, NO_EXISTE_EQUIPO);
  const persona = typeof personaPedida === "string" ? personaPedida.trim() : "";
  const sinFecha = devolucionPedida === undefined || devolucionPedida === null || devolucionPedida === "";
  if (persona === "" || sinFecha) throw new ErrorDePrestamos(400, FALTAN_DATOS);
  const devolucion = fechaDeDevolucion(devolucionPedida);

  return almacen.transaccion(async (tx) => {
    if (await tx.obtener<DocumentoEstado>(COLECCION_ESTADOS, id)) throw new ErrorDePrestamos(409, NO_DISPONIBLE);
    const prestamoId = randomUUID();
    const estado: DocumentoEstado = { equipoId: id, estado: "prestado", persona, devolucion, prestamoId };
    tx.guardar(COLECCION_ESTADOS, id, estado);
    tx.guardar(COLECCION_HISTORIAL, prestamoId, {
      equipoId: id,
      persona,
      devolucion,
      estado: "prestado",
      inicio: new Date().toISOString(),
    } satisfies DocumentoPrestamo);
    return aEquipo(equipo, estado);
  });
}

/** Reserva el equipo a nombre de `persona`; solo si está disponible. `hoy` es el día actual en Madrid. */
export async function solicitarEquipo(
  almacen: Almacen,
  id: string,
  persona: string,
  devolucionPedida: unknown,
  hoy: string = hoyEnMadrid(),
): Promise<Equipo> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) throw new ErrorDePrestamos(404, NO_EXISTE_EQUIPO);
  const devolucion = fechaDeDevolucion(devolucionPedida);
  if (devolucion < hoy) throw new ErrorDePrestamos(400, FECHA_PASADA);

  return almacen.transaccion(async (tx) => {
    if (await tx.obtener<DocumentoEstado>(COLECCION_ESTADOS, id)) throw new ErrorDePrestamos(409, NO_DISPONIBLE);
    const prestamoId = randomUUID();
    const estado: DocumentoEstado = { equipoId: id, estado: "reservado", persona, devolucion, prestamoId };
    tx.guardar(COLECCION_ESTADOS, id, estado);
    tx.guardar(COLECCION_HISTORIAL, prestamoId, {
      equipoId: id,
      persona,
      devolucion,
      estado: "reservado",
      inicio: new Date().toISOString(),
    } satisfies DocumentoPrestamo);
    return aEquipo(equipo, estado);
  });
}
