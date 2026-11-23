// Lógica interna del contexto «prestamos»: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos as listarEquiposDeEquipos, obtenerEquipo } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** El préstamo activo de un equipo: un documento por equipo, con id el del equipo. */
export interface PrestamoActivo {
  id: string;
  prestamo: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado";
}

export const ACTIVOS = "prestamos_activos";

export const SOLO_IT = "Solo IT puede hacer esto.";

/** Si el correo es de una cuenta de IT: los de CORREOS_IT, separados por comas, sin distinguir mayúsculas. */
export function esCuentaDeIT(email: string | undefined, correosIT: string | undefined = process.env["CORREOS_IT"]): boolean {
  if (!email) return false;
  const buscado = email.trim().toLowerCase();
  return (correosIT ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .some((correo) => correo !== "" && correo === buscado);
}

/** Las operaciones «solo IT» del contrato: entrega, préstamo en el mostrador, devolución, vencidos e historial. */
const OPERACIONES_DE_IT: { metodo: string; ruta: RegExp }[] = [
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/entrega\/?$/ },
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/prestamo\/?$/ },
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/devolucion\/?$/ },
  { metodo: "GET", ruta: /^\/api\/prestamos\/vencidos\/?$/ },
  { metodo: "GET", ruta: /^\/api\/equipos\/[^/]+\/historial\/?$/ },
];

/** Si la petición es una operación «solo IT» del contrato. */
export function esOperacionDeIT(metodo: string, url: string): boolean {
  const ruta = url.split("?")[0] ?? "";
  return OPERACIONES_DE_IT.some((operacion) => operacion.metodo === metodo && operacion.ruta.test(ruta));
}

/** Un préstamo del historial del equipo: un documento por préstamo. */
export interface Prestamo {
  id: string;
  equipo: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  creado: string;
}

export const PRESTAMOS = "prestamos_prestamos";

export const NO_EXISTE = "No existe el equipo";
export const NO_DISPONIBLE = "El equipo no está disponible";
export const NO_RESERVADO = "El equipo no está reservado";
export const NO_PRESTADO = "El equipo no está prestado";
export const FALTA_DEVOLUCION = "Falta la fecha de devolución";
export const FALTAN_PERSONA_O_DEVOLUCION = "Faltan la persona o la fecha de devolución";
export const DEVOLUCION_NO_VALIDA = "La fecha de devolución no es válida";
export const DEVOLUCION_PASADA = "La fecha de devolución ya ha pasado";

export type ResultadoSolicitud = { ok: true; equipo: Equipo } | { ok: false; status: 400 | 404 | 409; error: string };

/** El día de hoy en Madrid como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** Si el texto es una fecha AAAA-MM-DD que existe. */
function esFechaReal(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/** Pide un equipo: lo deja reservado a nombre de la persona, con el préstamo activo y el préstamo en una sola transacción. */
export async function solicitarEquipo(
  almacen: Almacen,
  id: string,
  persona: string,
  devolucion: unknown,
  ahora: Date = new Date(),
): Promise<ResultadoSolicitud> {
  if (typeof devolucion !== "string" || devolucion.trim() === "") return { ok: false, status: 400, error: FALTA_DEVOLUCION };
  if (!esFechaReal(devolucion)) return { ok: false, status: 400, error: DEVOLUCION_NO_VALIDA };
  if (devolucion < hoyEnMadrid(ahora)) return { ok: false, status: 400, error: DEVOLUCION_PASADA };
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) return { ok: false, status: 404, error: NO_EXISTE };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, id);
    if (activo) return { ok: false, status: 409, error: NO_DISPONIBLE };
    const prestamo: Prestamo = { id: randomUUID(), equipo: id, persona, devolucion, estado: "reservado", creado: ahora.toISOString() };
    const nuevo: PrestamoActivo = { id, prestamo: prestamo.id, persona, devolucion, estado: "reservado" };
    tx.guardar(ACTIVOS, id, nuevo);
    tx.guardar(PRESTAMOS, prestamo.id, prestamo);
    return { ok: true, equipo: { id, nombre: equipo.nombre, estado: "reservado", persona, devolucion } };
  });
}

/** Entrega un equipo reservado: pasa a prestado, con la misma persona y devolución de la solicitud. */
export async function entregarEquipo(almacen: Almacen, id: string): Promise<ResultadoSolicitud> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) return { ok: false, status: 404, error: NO_EXISTE };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, id);
    if (activo?.estado !== "reservado") return { ok: false, status: 409, error: NO_RESERVADO };
    const prestamo = await tx.obtener<Prestamo>(PRESTAMOS, activo.prestamo);
    tx.guardar(ACTIVOS, id, { ...activo, estado: "prestado" } satisfies PrestamoActivo);
    if (prestamo) tx.guardar(PRESTAMOS, prestamo.id, { ...prestamo, estado: "prestado" } satisfies Prestamo);
    return { ok: true, equipo: { id, nombre: equipo.nombre, estado: "prestado", persona: activo.persona, devolucion: activo.devolucion } };
  });
}

/** Apunta la devolución de un equipo prestado: vuelve a estar disponible y su préstamo queda como devuelto. */
export async function devolverEquipo(almacen: Almacen, id: string): Promise<ResultadoSolicitud> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) return { ok: false, status: 404, error: NO_EXISTE };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, id);
    if (activo?.estado !== "prestado") return { ok: false, status: 409, error: NO_PRESTADO };
    const prestamo = await tx.obtener<Prestamo>(PRESTAMOS, activo.prestamo);
    if (prestamo) tx.guardar(PRESTAMOS, prestamo.id, { ...prestamo, estado: "devuelto" } satisfies Prestamo);
    tx.borrar(ACTIVOS, id);
    return { ok: true, equipo: { id, nombre: equipo.nombre, estado: "disponible" } };
  });
}

/** Presta un equipo disponible en el mostrador a la persona indicada; la devolución puede ser anterior a hoy. */
export async function prestarEquipo(
  almacen: Almacen,
  id: string,
  persona: unknown,
  devolucion: unknown,
  ahora: Date = new Date(),
): Promise<ResultadoSolicitud> {
  if (typeof persona !== "string" || persona.trim() === "" || typeof devolucion !== "string" || devolucion.trim() === "") {
    return { ok: false, status: 400, error: FALTAN_PERSONA_O_DEVOLUCION };
  }
  if (!esFechaReal(devolucion)) return { ok: false, status: 400, error: DEVOLUCION_NO_VALIDA };
  const quien = persona.trim();
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) return { ok: false, status: 404, error: NO_EXISTE };
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, id);
    if (activo) return { ok: false, status: 409, error: NO_DISPONIBLE };
    const prestamo: Prestamo = { id: randomUUID(), equipo: id, persona: quien, devolucion, estado: "prestado", creado: ahora.toISOString() };
    const nuevo: PrestamoActivo = { id, prestamo: prestamo.id, persona: quien, devolucion, estado: "prestado" };
    tx.guardar(ACTIVOS, id, nuevo);
    tx.guardar(PRESTAMOS, prestamo.id, prestamo);
    return { ok: true, equipo: { id, nombre: equipo.nombre, estado: "prestado", persona: quien, devolucion } };
  });
}

export type Vencido = components["schemas"]["Vencido"];

/** Los equipos prestados con la devolución anterior a hoy (en Madrid), del más antiguo al más reciente. */
export async function listarVencidos(almacen: Almacen, ahora: Date = new Date()): Promise<Vencido[]> {
  const hoy = hoyEnMadrid(ahora);
  const [equipos, activos] = await Promise.all([listarEquiposDeEquipos(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const nombreDe = new Map(equipos.map((equipo) => [equipo.id, equipo.nombre]));
  return activos
    .filter((activo) => activo.estado === "prestado" && activo.devolucion < hoy && nombreDe.has(activo.id))
    .sort((a, b) => a.devolucion.localeCompare(b.devolucion) || a.id.localeCompare(b.id))
    .map((activo): Vencido => ({ id: activo.id, nombre: nombreDe.get(activo.id) ?? "", persona: activo.persona, devolucion: activo.devolucion }));
}

/** Todos los equipos con su estado; si están reservados o prestados, también la persona y la devolución. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const [equipos, activos] = await Promise.all([listarEquiposDeEquipos(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const activoDe = new Map(activos.map((activo) => [activo.id, activo]));
  return equipos.map((equipo): Equipo => {
    const activo = activoDe.get(equipo.id);
    if (!activo) return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
    return { id: equipo.id, nombre: equipo.nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
