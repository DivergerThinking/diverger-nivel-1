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
  /** Id de su entrada en `prestamos_historial`, para pasarla de «reservado» a «prestado». */
  historialId?: string;
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

/**
 * Deja un equipo disponible a nombre de la persona, en una transacción que escribe el préstamo y el historial:
 * `reservado` en una solicitud, `prestado` en un préstamo en el mostrador.
 */
export async function solicitarEquipo(
  almacen: Almacen,
  id: string,
  persona: string,
  devolucion: string,
  estado: "reservado" | "prestado" = "reservado",
): Promise<ResultadoSolicitud> {
  return almacen.transaccion<ResultadoSolicitud>(async (tx) => {
    const documento = await tx.obtener<DocumentoEquipo>("equipos", id);
    if (documento === undefined) return { ok: false, error: "no-existe" };
    const activo = await tx.obtener<DocumentoPrestamoActivo>("prestamos_activos", id);
    if (activo !== undefined) return { ok: false, error: "no-disponible" };
    const historialId = randomUUID();
    const nuevo: DocumentoPrestamoActivo = { equipoId: id, persona, devolucion, estado, historialId };
    const entrada: DocumentoHistorial = {
      equipoId: id,
      persona,
      devolucion,
      estado,
      creado: new Date().toISOString(),
    };
    tx.guardar("prestamos_activos", id, nuevo);
    tx.guardar("prestamos_historial", historialId, entrada);
    return { ok: true, equipo: equipoConEstado(id, documento.nombre, nuevo) };
  });
}

export type ResultadoEntrega = { ok: true; equipo: Equipo } | { ok: false; error: "no-existe" | "no-reservado" };

/** Pasa un equipo reservado a prestado, con su persona y su fecha, y la entrada del historial de «reservado» a «prestado». */
export async function entregarEquipo(almacen: Almacen, id: string): Promise<ResultadoEntrega> {
  return almacen.transaccion<ResultadoEntrega>(async (tx) => {
    const documento = await tx.obtener<DocumentoEquipo>("equipos", id);
    if (documento === undefined) return { ok: false, error: "no-existe" };
    const activo = await tx.obtener<DocumentoPrestamoActivo>("prestamos_activos", id);
    if (activo?.estado !== "reservado") return { ok: false, error: "no-reservado" };
    // La entrada de la reserva se reescribe por el id que guardó la solicitud; una reserva sin él
    // (anterior a este campo) deja una entrada nueva. Primero las lecturas y después las escrituras.
    const historialId = activo.historialId ?? randomUUID();
    const anterior = activo.historialId === undefined ? undefined : await tx.obtener<DocumentoHistorial>("prestamos_historial", historialId);
    const prestado: DocumentoPrestamoActivo = { ...activo, estado: "prestado" };
    tx.guardar("prestamos_activos", id, prestado);
    const entrada: DocumentoHistorial = {
      equipoId: id,
      persona: activo.persona,
      devolucion: activo.devolucion,
      estado: "prestado",
      creado: anterior?.creado ?? new Date().toISOString(),
    };
    tx.guardar("prestamos_historial", historialId, entrada);
    return { ok: true, equipo: equipoConEstado(id, documento.nombre, prestado) };
  });
}

export type ResultadoDevolucion = { ok: true; equipo: Equipo } | { ok: false; error: "no-existe" | "no-prestado" };

/** Apunta la devolución de un equipo prestado: lo deja disponible y pasa su entrada del historial a «devuelto». */
export async function devolverEquipo(almacen: Almacen, id: string): Promise<ResultadoDevolucion> {
  return almacen.transaccion<ResultadoDevolucion>(async (tx) => {
    const documento = await tx.obtener<DocumentoEquipo>("equipos", id);
    if (documento === undefined) return { ok: false, error: "no-existe" };
    const activo = await tx.obtener<DocumentoPrestamoActivo>("prestamos_activos", id);
    if (activo?.estado !== "prestado") return { ok: false, error: "no-prestado" };
    // Primero las lecturas y después las escrituras; sin id de historial (anterior a este campo) se deja una entrada nueva.
    const historialId = activo.historialId ?? randomUUID();
    const anterior = activo.historialId === undefined ? undefined : await tx.obtener<DocumentoHistorial>("prestamos_historial", historialId);
    tx.borrar("prestamos_activos", id);
    const entrada: DocumentoHistorial = {
      equipoId: id,
      persona: activo.persona,
      devolucion: activo.devolucion,
      estado: "devuelto",
      creado: anterior?.creado ?? new Date().toISOString(),
    };
    tx.guardar("prestamos_historial", historialId, entrada);
    return { ok: true, equipo: equipoConEstado(id, documento.nombre, undefined) };
  });
}

export type PrestamoVencido = components["schemas"]["PrestamoVencido"];

/** Los equipos prestados cuya devolución es anterior a `hoy`, del más antiguo al más reciente. */
export async function listarVencidos(almacen: Almacen, hoy: string = hoyEnMadrid()): Promise<PrestamoVencido[]> {
  const activos = await almacen.listar<DocumentoPrestamoActivo>("prestamos_activos");
  const vencidos: PrestamoVencido[] = [];
  for (const activo of activos) {
    if (activo.estado !== "prestado" || activo.devolucion >= hoy) continue;
    const documento = await almacen.obtener<DocumentoEquipo>("equipos", activo.equipoId);
    if (documento === undefined) continue;
    vencidos.push({ id: activo.equipoId, nombre: documento.nombre, persona: activo.persona, devolucion: activo.devolucion });
  }
  return vencidos.sort((a, b) => a.devolucion.localeCompare(b.devolucion) || a.nombre.localeCompare(b.nombre, "es"));
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
