// Prestar un equipo disponible en el mostrador: IT lo apunta ya prestado, aunque sea con retraso.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
import {
  COLECCION_PRESTAMOS,
  esFechaReal,
  MENSAJE_FECHA_NO_VALIDA,
  MENSAJE_NO_DISPONIBLE,
  MENSAJE_NO_EXISTE,
  type PrestamoGuardado,
  type ResultadoSolicitud,
} from "./solicitud.js";

export const MENSAJE_FALTAN_DATOS = "Faltan la persona o la fecha de devolución";

export type ResultadoMostrador = ResultadoSolicitud;

function datosDelCuerpo(cuerpo: unknown): { persona: string; devolucion: string } | { error: string } {
  const bruto = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { persona?: unknown; devolucion?: unknown }) : {};
  const { persona, devolucion } = bruto;
  const vacio = (valor: unknown): boolean => valor === undefined || valor === null || valor === "";
  if (vacio(persona) || vacio(devolucion)) return { error: MENSAJE_FALTAN_DATOS };
  if (typeof persona !== "string" || typeof devolucion !== "string" || persona.trim() === "") {
    return { error: MENSAJE_FALTAN_DATOS };
  }
  if (!esFechaReal(devolucion)) return { error: MENSAJE_FECHA_NO_VALIDA };
  return { persona: persona.trim(), devolucion };
}

export async function prestarEquipo(
  almacen: Almacen,
  equipoId: string,
  cuerpo: unknown,
  ahora: Date,
): Promise<ResultadoMostrador> {
  const datos = datosDelCuerpo(cuerpo);
  if ("error" in datos) return { ok: false, codigo: 400, error: datos.error };

  // Los equipos no se dan de baja, así que comprobar que existe fuera de la transacción es seguro.
  const equipo = (await listarEquipos(almacen)).find((e) => e.id === equipoId);
  if (equipo === undefined) return { ok: false, codigo: 404, error: MENSAJE_NO_EXISTE };

  return almacen.transaccion<ResultadoMostrador>(async (tx) => {
    if ((await tx.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id)) !== undefined) {
      return { ok: false, codigo: 409, error: MENSAJE_NO_DISPONIBLE };
    }
    const prestamoId = randomUUID();
    const prestamo: PrestamoGuardado = {
      equipoId: equipo.id,
      persona: datos.persona,
      devolucion: datos.devolucion,
      estado: "prestado",
      inicio: ahora.toISOString(),
    };
    const estado: EstadoGuardado = {
      estado: "prestado",
      persona: datos.persona,
      devolucion: datos.devolucion,
      prestamoId,
    };
    tx.guardar(COLECCION_PRESTAMOS, prestamoId, prestamo);
    tx.guardar(COLECCION_ESTADOS, equipo.id, estado);
    return {
      ok: true,
      equipo: {
        id: equipo.id,
        nombre: equipo.nombre,
        estado: "prestado",
        persona: datos.persona,
        devolucion: datos.devolucion,
      },
    };
  });
}
