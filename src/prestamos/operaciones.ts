// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";
import type { Almacen } from "../../lib/datos.js";
import type { EquipoConEstado, EstadoEquipo } from "./estado.js";
import type { components } from "./api.gen.js";

type Vencido = components["schemas"]["Vencido"];

/** Un préstamo tal como se guarda en la colección `prestamos`. */
interface Prestamo {
  equipo: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  creado: string;
}

const ESTADOS = "estadosEquipo";
const PRESTAMOS = "prestamos";

export type Resultado<T> = { ok: true; valor: T } | { ok: false; status: 400 | 404 | 409; error: string };

/** Si el correo está en CORREOS_IT (lista separada por comas, sin distinguir mayúsculas), fijada en el despliegue. */
export function esDeIT(email: string): boolean {
  const correos = (process.env["CORREOS_IT"] ?? "").split(",").map((c) => c.trim().toLowerCase());
  return correos.includes(email.trim().toLowerCase());
}

/** Hoy: el día actual en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(ahora);
}

/** Si el texto es AAAA-MM-DD de un día que existe. */
function esFechaReal(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(texto);
}

/** Los equipos prestados cuya devolución es anterior a hoy, del más antiguo al más reciente. */
export async function listarVencidos(almacen: Almacen, hoy: string = hoyEnMadrid()): Promise<Vencido[]> {
  const equipos = await listarEquipos(almacen);
  const vencidos: Vencido[] = [];
  for (const { id, nombre } of equipos) {
    const guardado = await almacen.obtener<EstadoEquipo>(ESTADOS, id);
    if (guardado?.estado === "prestado" && guardado.persona !== undefined && guardado.devolucion !== undefined && guardado.devolucion < hoy) {
      vencidos.push({ id, nombre, persona: guardado.persona, devolucion: guardado.devolucion });
    }
  }
  return vencidos.sort((a, b) => a.devolucion.localeCompare(b.devolucion));
}

/** Reserva un equipo disponible a quien lo pide; el estado y el préstamo se escriben en la misma transacción. */
export async function solicitarEquipo(
  almacen: Almacen,
  id: string,
  persona: string,
  devolucion: unknown,
  hoy: string = hoyEnMadrid(),
): Promise<Resultado<EquipoConEstado>> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) return { ok: false, status: 404, error: "No existe el equipo" };
  if (typeof devolucion !== "string" || devolucion === "") {
    return { ok: false, status: 400, error: "Falta la fecha de devolución" };
  }
  if (!esFechaReal(devolucion)) return { ok: false, status: 400, error: "La fecha de devolución no es válida" };
  if (devolucion < hoy) return { ok: false, status: 400, error: "La fecha de devolución ya ha pasado" };
  return almacen.transaccion<Resultado<EquipoConEstado>>(async (tx) => {
    const actual = await tx.obtener<EstadoEquipo>(ESTADOS, id);
    if (actual && actual.estado !== "disponible") return { ok: false, status: 409, error: "El equipo no está disponible" };
    const prestamo = randomUUID();
    tx.guardar(ESTADOS, id, { estado: "reservado", persona, devolucion, prestamo } satisfies EstadoEquipo);
    tx.guardar(PRESTAMOS, prestamo, {
      equipo: id,
      persona,
      devolucion,
      estado: "reservado",
      creado: new Date().toISOString(),
    } satisfies Prestamo);
    return { ok: true, valor: { id, nombre: equipo.nombre, estado: "reservado", persona, devolucion } };
  });
}

/** Entrega un equipo reservado, con la persona y la fecha de la solicitud. */
export async function entregarEquipo(almacen: Almacen, id: string): Promise<Resultado<EquipoConEstado>> {
  const equipo = await obtenerEquipo(almacen, id);
  if (!equipo) return { ok: false, status: 404, error: "No existe el equipo" };
  return almacen.transaccion<Resultado<EquipoConEstado>>(async (tx) => {
    const actual = await tx.obtener<EstadoEquipo>(ESTADOS, id);
    if (actual?.estado !== "reservado" || actual.persona === undefined || actual.devolucion === undefined) {
      return { ok: false, status: 409, error: "El equipo no está reservado" };
    }
    const { persona, devolucion, prestamo } = actual;
    const registro = prestamo ? await tx.obtener<Prestamo>(PRESTAMOS, prestamo) : undefined;
    tx.guardar(ESTADOS, id, { ...actual, estado: "prestado" } satisfies EstadoEquipo);
    if (prestamo && registro) tx.guardar(PRESTAMOS, prestamo, { ...registro, estado: "prestado" } satisfies Prestamo);
    return { ok: true, valor: { id, nombre: equipo.nombre, estado: "prestado", persona, devolucion } };
  });
}
