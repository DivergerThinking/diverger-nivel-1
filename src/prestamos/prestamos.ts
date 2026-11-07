// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Documento de `prestamos_activos`: su id es el id del equipo (como mucho un préstamo activo por equipo). */
export interface DocumentoPrestamoActivo {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado";
}

// Lo único que se lee del catálogo del contexto «equipos»: el id y el nombre de cada equipo.
interface DocumentoEquipo {
  nombre: string;
}
interface DocumentoNombre {
  equipoId: string;
}

/** El equipo con el estado que le da su préstamo activo; sin préstamo activo, `disponible`. */
export function equipoConEstado(id: string, nombre: string, activo: DocumentoPrestamoActivo | undefined): Equipo {
  if (activo === undefined) return { id, nombre, estado: "disponible" };
  return { id, nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
}

/** Documento de `prestamos_historial`: una entrada por préstamo, con el momento en que se creó para ordenar. */
export interface DocumentoHistorial {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado" | "devuelto";
  creado: string;
}

/** El día de hoy en Madrid, como AAAA-MM-DD. */
export function hoyEnMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

/** Comprueba que `devolucion` es una fecha AAAA-MM-DD real y que no es anterior a hoy en Madrid. */
export function validarDevolucion(devolucion: string, hoy: string = hoyEnMadrid()): "no-valida" | "pasada" | undefined {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(devolucion);
  if (partes === null) return "no-valida";
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    return "no-valida";
  }
  return devolucion < hoy ? "pasada" : undefined;
}

export type ResultadoSolicitud = { ok: true; equipo: Equipo } | { ok: false; error: "no-existe" | "no-disponible" };

/** Reserva un equipo disponible a nombre de la persona, en una transacción que escribe el préstamo y el historial. */
export async function solicitarEquipo(
  almacen: Almacen,
  id: string,
  persona: string,
  devolucion: string,
): Promise<ResultadoSolicitud> {
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const documento = await tx.obtener<DocumentoEquipo>("equipos", id);
    if (documento === undefined) return { ok: false, error: "no-existe" };
    const activo = await tx.obtener<DocumentoPrestamoActivo>("prestamos_activos", id);
    if (activo !== undefined) return { ok: false, error: "no-disponible" };
    const nuevo: DocumentoPrestamoActivo = { equipoId: id, persona, devolucion, estado: "reservado" };
    const entrada: DocumentoHistorial = {
      equipoId: id,
      persona,
      devolucion,
      estado: "reservado",
      creado: new Date().toISOString(),
    };
    tx.guardar("prestamos_activos", id, nuevo);
    tx.guardar("prestamos_historial", randomUUID(), entrada);
    return { ok: true, equipo: equipoConEstado(id, documento.nombre, nuevo) };
  });
}

/** Los equipos del catálogo con su estado, ordenados por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const nombres = await almacen.listar<DocumentoNombre>("equipos_nombres");
  const activos = new Map(
    (await almacen.listar<DocumentoPrestamoActivo>("prestamos_activos")).map((activo) => [activo.equipoId, activo]),
  );
  const equipos: Equipo[] = [];
  for (const { equipoId } of nombres) {
    const documento = await almacen.obtener<DocumentoEquipo>("equipos", equipoId);
    if (documento === undefined) continue;
    equipos.push(equipoConEstado(equipoId, documento.nombre, activos.get(equipoId)));
  }
  return equipos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
