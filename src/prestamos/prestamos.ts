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
export async function reservarEquipo(
  almacen: Almacen,
  equipo: { id: string; nombre: string },
  persona: string,
  devolucion: string,
): Promise<EquipoConEstado | "no-disponible"> {
  return almacen.transaccion(async (tx) => {
    if (await tx.obtener<PrestamoActivo>(ACTIVOS, equipo.id)) return "no-disponible";
    const prestamo: Prestamo = {
      id: randomUUID(),
      equipoId: equipo.id,
      persona,
      devolucion,
      estado: "reservado",
      creadoEn: new Date().toISOString(),
    };
    tx.guardar(PRESTAMOS, prestamo.id, prestamo);
    tx.guardar(ACTIVOS, equipo.id, { prestamoId: prestamo.id } satisfies PrestamoActivo);
    return { id: equipo.id, nombre: equipo.nombre, estado: "reservado", persona, devolucion };
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
