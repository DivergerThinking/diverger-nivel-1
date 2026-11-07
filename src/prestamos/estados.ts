// Estado de los equipos: un equipo sin documento en «prestamos_estados» está disponible.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";

export const COLECCION_ESTADOS = "prestamos_estados";

export type Estado = "disponible" | "reservado" | "prestado";

/** Documento de «prestamos_estados»: uno por equipo que no está disponible, con id el del equipo. */
export interface EstadoGuardado {
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
  prestamoId: string;
}

export interface EquipoConEstado {
  id: string;
  nombre: string;
  estado: Estado;
  persona?: string;
  devolucion?: string;
}

/** Los equipos con su estado; persona y devolución solo si están reservados o prestados. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<EquipoConEstado[]> {
  const equipos = await listarEquipos(almacen);
  const ocupados = await Promise.all(
    equipos.map((equipo) => almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id)),
  );
  return equipos.map((equipo, i): EquipoConEstado => {
    const ocupado = ocupados[i];
    if (ocupado === undefined) return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
    return {
      id: equipo.id,
      nombre: equipo.nombre,
      estado: ocupado.estado,
      persona: ocupado.persona,
      devolucion: ocupado.devolucion,
    };
  });
}
