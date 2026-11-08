// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoConEstado = components["schemas"]["Equipo"];

export type EstadoDePrestamo = "reservado" | "prestado" | "devuelto";

export interface Prestamo {
  id: string;
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: EstadoDePrestamo;
  creadoEn: string;
}

/** El préstamo vigente de un equipo reservado o prestado; su id es el del equipo. */
export interface PrestamoActivo {
  prestamoId: string;
}

export const PRESTAMOS = "prestamos_prestamos";
export const ACTIVOS = "prestamos_activos";

export type ErrorDeFecha = "falta" | "no-valida" | "pasada";

/** El día actual en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());
}

/** Comprueba que la fecha de devolución de una solicitud existe, es real y no es anterior a hoy. */
export function validarDevolucion(valor: unknown, hoy: string): ErrorDeFecha | null {
  if (valor === undefined || valor === null || valor === "") return "falta";
  if (typeof valor !== "string") return "no-valida";
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return "no-valida";
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const esReal = fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  if (!esReal) return "no-valida";
  return valor < hoy ? "pasada" : null;
}

/** Reserva el equipo a la persona si no tiene préstamo activo; la comprobación y la escritura van en una transacción. */
export function reservarEquipo(
  almacen: Almacen,
  equipo: { id: string; nombre: string },
  persona: string,
  devolucion: string,
): Promise<EquipoConEstado | "no-disponible"> {
  return abrirPrestamo(almacen, equipo, persona, devolucion, "reservado");
}

/** Presta el equipo a la persona en el mostrador si no tiene préstamo activo; la comprobación y la escritura van en una transacción. */
export function prestarEquipo(
  almacen: Almacen,
  equipo: { id: string; nombre: string },
  persona: string,
  devolucion: string,
): Promise<EquipoConEstado | "no-disponible"> {
  return abrirPrestamo(almacen, equipo, persona, devolucion, "prestado");
}

async function abrirPrestamo(
  almacen: Almacen,
  equipo: { id: string; nombre: string },
  persona: string,
  devolucion: string,
  estado: "reservado" | "prestado",
): Promise<EquipoConEstado | "no-disponible"> {
  return almacen.transaccion(async (tx) => {
    if (await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id)) return "no-disponible";
    const prestamo: Prestamo = {
      id: randomUUID(),
      equipoId: equipo.id,
      persona,
      devolucion,
      estado,
      creadoEn: new Date().toISOString(),
    };
    tx.guardar(PRESTAMOS, prestamo.id, prestamo);
    tx.guardar(ACTIVOS, equipo.id, { prestamoId: prestamo.id } satisfies PrestamoActivo);
    return { id: equipo.id, nombre: equipo.nombre, estado, persona, devolucion };
  });
}

/** Pasa el préstamo reservado del equipo a prestado, con la misma persona y devolución; la comprobación y la escritura van en una transacción. */
export async function entregarEquipo(
  almacen: Almacen,
  equipo: { id: string; nombre: string },
): Promise<EquipoConEstado | "no-reservado"> {
  return almacen.transaccion(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id);
    const prestamo = activo && (await tx.obtener<Prestamo>(PRESTAMOS, activo.prestamoId));
    if (!prestamo || prestamo.estado !== "reservado") return "no-reservado";
    tx.guardar(PRESTAMOS, prestamo.id, { ...prestamo, estado: "prestado" } satisfies Prestamo);
    return {
      id: equipo.id,
      nombre: equipo.nombre,
      estado: "prestado",
      persona: prestamo.persona,
      devolucion: prestamo.devolucion,
    };
  });
}

/** Apunta la devolución del equipo prestado: el préstamo pasa a devuelto y deja de ser el activo; todo en una transacción. */
export async function devolverEquipo(
  almacen: Almacen,
  equipo: { id: string; nombre: string },
): Promise<EquipoConEstado | "no-prestado"> {
  return almacen.transaccion(async (tx) => {
    const activo = await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id);
    const prestamo = activo && (await tx.obtener<Prestamo>(PRESTAMOS, activo.prestamoId));
    if (!prestamo || prestamo.estado !== "prestado") return "no-prestado";
    tx.guardar(PRESTAMOS, prestamo.id, { ...prestamo, estado: "devuelto" } satisfies Prestamo);
    tx.borrar(ACTIVOS, equipo.id);
    return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
  });
}

/** Los equipos dados de alta (nombre y id) con su estado: disponible sin préstamo activo, o el de su préstamo. */
export async function listarEquiposConEstado(
  almacen: Almacen,
  equipos: readonly { id: string; nombre: string }[],
): Promise<EquipoConEstado[]> {
  return Promise.all(
    equipos.map(async (equipo): Promise<EquipoConEstado> => {
      const activo = await almacen.obtener<PrestamoActivo>(ACTIVOS, equipo.id);
      const prestamo = activo && (await almacen.obtener<Prestamo>(PRESTAMOS, activo.prestamoId));
      if (!prestamo || prestamo.estado === "devuelto") return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
      return {
        id: equipo.id,
        nombre: equipo.nombre,
        estado: prestamo.estado,
        persona: prestamo.persona,
        devolucion: prestamo.devolucion,
      };
    }),
  );
}
