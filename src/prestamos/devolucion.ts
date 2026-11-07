// Apuntar la devolución de un equipo prestado: vuelve a estar disponible y el préstamo queda devuelto en el historial.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
import { COLECCION_PRESTAMOS, MENSAJE_NO_EXISTE, type PrestamoGuardado, type ResultadoSolicitud } from "./solicitud.js";

export const MENSAJE_NO_PRESTADO = "El equipo no está prestado";

export type ResultadoDevolucion = ResultadoSolicitud;

export async function devolverEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoDevolucion> {
  // Los equipos no se dan de baja, así que comprobar que existe fuera de la transacción es seguro.
  const equipo = (await listarEquipos(almacen)).find((e) => e.id === equipoId);
  if (equipo === undefined) return { ok: false, codigo: 404, error: MENSAJE_NO_EXISTE };

  return almacen.transaccion<ResultadoDevolucion>(async (tx) => {
    const estado = await tx.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id);
    if (estado?.estado !== "prestado") return { ok: false, codigo: 409, error: MENSAJE_NO_PRESTADO };
    const prestamo = await tx.obtener<PrestamoGuardado>(COLECCION_PRESTAMOS, estado.prestamoId);
    if (prestamo !== undefined) {
      tx.guardar(COLECCION_PRESTAMOS, estado.prestamoId, { ...prestamo, estado: "devuelto" });
    }
    tx.borrar(COLECCION_ESTADOS, equipo.id);
    return { ok: true, equipo: { id: equipo.id, nombre: equipo.nombre, estado: "disponible" } };
  });
}
