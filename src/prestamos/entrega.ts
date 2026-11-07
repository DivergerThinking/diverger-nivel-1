// Entregar un equipo reservado: pasa a prestado con la misma persona y fecha de devolución.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
import { COLECCION_PRESTAMOS, MENSAJE_NO_EXISTE, type PrestamoGuardado, type ResultadoSolicitud } from "./solicitud.js";

export const MENSAJE_NO_RESERVADO = "El equipo no está reservado";

export type ResultadoEntrega = ResultadoSolicitud;

export async function entregarEquipo(almacen: Almacen, equipoId: string): Promise<ResultadoEntrega> {
  // Los equipos no se dan de baja, así que comprobar que existe fuera de la transacción es seguro.
  const equipo = (await listarEquipos(almacen)).find((e) => e.id === equipoId);
  if (equipo === undefined) return { ok: false, codigo: 404, error: MENSAJE_NO_EXISTE };

  return almacen.transaccion<ResultadoEntrega>(async (tx) => {
    const estado = await tx.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id);
    if (estado?.estado !== "reservado") return { ok: false, codigo: 409, error: MENSAJE_NO_RESERVADO };
    const prestamo = await tx.obtener<PrestamoGuardado>(COLECCION_PRESTAMOS, estado.prestamoId);
    const prestado: EstadoGuardado = { ...estado, estado: "prestado" };
    tx.guardar(COLECCION_ESTADOS, equipo.id, prestado);
    if (prestamo !== undefined) {
      tx.guardar(COLECCION_PRESTAMOS, estado.prestamoId, { ...prestamo, estado: "prestado" });
    }
    return {
      ok: true,
      equipo: {
        id: equipo.id,
        nombre: equipo.nombre,
        estado: "prestado",
        persona: estado.persona,
        devolucion: estado.devolucion,
      },
    };
  });
}
