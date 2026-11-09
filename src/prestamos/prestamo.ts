// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

export const COLECCION_ACTIVOS = "prestamos_activos";

/** Préstamo activo de un equipo: la reserva o el préstamo en curso (el documento tiene por id el del equipo). */
interface DocumentoActivo {
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
  prestamoId: string;
}

export const COLECCION_PRESTAMOS = "prestamos_prestamos";

export type ErrorSolicitud =
  | "falta-devolucion"
  | "devolucion-no-valida"
  | "devolucion-pasada"
  | "no-existe"
  | "no-disponible";

export type ResultadoSolicitud = { ok: true; equipo: Equipo } | { ok: false; error: ErrorSolicitud };

/** El día actual en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

/** Una fecha AAAA-MM-DD que existe en el calendario (2026-02-30 no). */
function esFechaReal(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/** Reserva un equipo disponible a nombre de la persona, hasta la fecha de devolución. */
export async function solicitarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: string,
  devolucion: unknown,
  ahora: Date = new Date(),
): Promise<ResultadoSolicitud> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { ok: false, error: "no-existe" };
  if (devolucion === undefined || devolucion === null || devolucion === "") {
    return { ok: false, error: "falta-devolucion" };
  }
  if (typeof devolucion !== "string" || !esFechaReal(devolucion)) {
    return { ok: false, error: "devolucion-no-valida" };
  }
  if (devolucion < hoyEnMadrid(ahora)) return { ok: false, error: "devolucion-pasada" };

  const prestamoId = randomUUID();
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    if (await tx.obtener(COLECCION_ACTIVOS, equipoId)) return { ok: false, error: "no-disponible" };
    const activo: DocumentoActivo = { estado: "reservado", persona, devolucion, prestamoId };
    tx.guardar(COLECCION_ACTIVOS, equipoId, activo);
    tx.guardar(COLECCION_PRESTAMOS, prestamoId, {
      equipoId,
      persona,
      devolucion,
      estado: "reservado",
      creadoEn: ahora.toISOString(),
    });
    return { ok: true, equipo: { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion } };
  });
}

export type ResultadoEntrega =
  | { ok: true; equipo: Equipo }
  | { ok: false; error: "no-existe" | "no-reservado" };

/** Entrega un equipo reservado: pasa a prestado con la misma persona y devolución de la solicitud. */
export async function entregarEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoEntrega> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { ok: false, error: "no-existe" };
  return almacen.transaccion<ResultadoEntrega>(async (tx) => {
    const activo = await tx.obtener<DocumentoActivo>(COLECCION_ACTIVOS, equipoId);
    if (activo?.estado !== "reservado") return { ok: false, error: "no-reservado" };
    tx.guardar(COLECCION_ACTIVOS, equipoId, { ...activo, estado: "prestado" });
    const prestamo = await tx.obtener<Record<string, unknown>>(COLECCION_PRESTAMOS, activo.prestamoId);
    if (prestamo) tx.guardar(COLECCION_PRESTAMOS, activo.prestamoId, { ...prestamo, estado: "prestado" });
    return {
      ok: true,
      equipo: {
        id: equipo.id,
        nombre: equipo.nombre,
        estado: "prestado",
        persona: activo.persona,
        devolucion: activo.devolucion,
      },
    };
  });
}

export type ResultadoDevolucion =
  | { ok: true; equipo: Equipo }
  | { ok: false; error: "no-existe" | "no-prestado" };

/** Apunta la devolución de un equipo prestado: queda disponible y el préstamo pasa a devuelto. */
export async function devolverEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoDevolucion> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { ok: false, error: "no-existe" };
  return almacen.transaccion<ResultadoDevolucion>(async (tx) => {
    const activo = await tx.obtener<DocumentoActivo>(COLECCION_ACTIVOS, equipoId);
    if (activo?.estado !== "prestado") return { ok: false, error: "no-prestado" };
    tx.borrar(COLECCION_ACTIVOS, equipoId);
    const prestamo = await tx.obtener<Record<string, unknown>>(COLECCION_PRESTAMOS, activo.prestamoId);
    if (prestamo) tx.guardar(COLECCION_PRESTAMOS, activo.prestamoId, { ...prestamo, estado: "devuelto" });
    return { ok: true, equipo: { id: equipo.id, nombre: equipo.nombre, estado: "disponible" } };
  });
}

export type ResultadoPrestamo =
  | { ok: true; equipo: Equipo }
  | { ok: false; error: "faltan-datos" | "devolucion-no-valida" | "no-existe" | "no-disponible" };

/** Presta en el mostrador un equipo disponible; admite devoluciones anteriores a hoy. */
export async function prestarEquipo(
  almacen: Almacen,
  equipoId: string,
  persona: unknown,
  devolucion: unknown,
  ahora: Date = new Date(),
): Promise<ResultadoPrestamo> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { ok: false, error: "no-existe" };
  const quien = typeof persona === "string" ? persona.trim() : "";
  if (quien === "" || devolucion === undefined || devolucion === null || devolucion === "") {
    return { ok: false, error: "faltan-datos" };
  }
  if (typeof devolucion !== "string" || !esFechaReal(devolucion)) {
    return { ok: false, error: "devolucion-no-valida" };
  }

  const prestamoId = randomUUID();
  return almacen.transaccion<ResultadoPrestamo>(async (tx) => {
    if (await tx.obtener(COLECCION_ACTIVOS, equipoId)) return { ok: false, error: "no-disponible" };
    const activo: DocumentoActivo = { estado: "prestado", persona: quien, devolucion, prestamoId };
    tx.guardar(COLECCION_ACTIVOS, equipoId, activo);
    tx.guardar(COLECCION_PRESTAMOS, prestamoId, {
      equipoId,
      persona: quien,
      devolucion,
      estado: "prestado",
      creadoEn: ahora.toISOString(),
    });
    return { ok: true, equipo: { id: equipo.id, nombre: equipo.nombre, estado: "prestado", persona: quien, devolucion } };
  });
}

export type Vencido = components["schemas"]["Vencido"];

/** Equipos prestados con la devolución anterior a hoy (día de Madrid), del más antiguo al más reciente. */
export async function listarVencidos(almacen: Almacen, ahora: Date = new Date()): Promise<Vencido[]> {
  const hoy = hoyEnMadrid(ahora);
  const equipos = await listarEquiposConEstado(almacen);
  const vencidos: Vencido[] = [];
  for (const { id, nombre, estado, persona, devolucion } of equipos) {
    if (estado === "prestado" && persona !== undefined && devolucion !== undefined && devolucion < hoy) {
      vencidos.push({ id, nombre, persona, devolucion });
    }
  }
  return vencidos.sort((a, b) => a.devolucion.localeCompare(b.devolucion));
}

export type EntradaHistorial = components["schemas"]["EntradaHistorial"];

interface DocumentoPrestamo {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: EntradaHistorial["estado"];
  creadoEn: string;
}

export type ResultadoHistorial = { ok: true; historial: EntradaHistorial[] } | { ok: false; error: "no-existe" };

/** Préstamos de un equipo, del más reciente al más antiguo; si coinciden en el instante, el vigente va antes. */
export async function consultarHistorial(almacen: Almacen, equipoId: string): Promise<ResultadoHistorial> {
  const equipo = await obtenerEquipo(almacen, equipoId);
  if (!equipo) return { ok: false, error: "no-existe" };
  const prestamos = (await almacen.listar<DocumentoPrestamo>(COLECCION_PRESTAMOS)).filter(
    (p) => p.equipoId === equipoId,
  );
  const vigente = (p: DocumentoPrestamo) => (p.estado === "devuelto" ? 0 : 1);
  prestamos.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn) || vigente(b) - vigente(a));
  return {
    ok: true,
    historial: prestamos.map(({ persona, devolucion, estado }) => ({ persona, devolucion, estado })),
  };
}

/** Todos los equipos con su estado; con persona y devolución solo si están reservados o prestados. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await listarEquipos(almacen);
  return Promise.all(
    equipos.map(async ({ id, nombre }): Promise<Equipo> => {
      const activo = await almacen.obtener<DocumentoActivo>(COLECCION_ACTIVOS, id);
      if (!activo) return { id, nombre, estado: "disponible" };
      return { id, nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
    }),
  );
}
