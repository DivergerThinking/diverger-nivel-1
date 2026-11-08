// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";

export type EstadoPrestamo = "reservado" | "prestado" | "devuelto";

export interface Prestamo {
  id: string;
  equipo: string;
  persona: string;
  /** Fecha de devolución AAAA-MM-DD. */
  devolucion: string;
  estado: EstadoPrestamo;
  /** Instante de la solicitud o del préstamo en el mostrador (ISO 8601). */
  creado: string;
}

/** Documento de `prestamos_activos`: su id es el id del equipo. */
export interface Activo {
  prestamo: string;
}

export interface EquipoConEstado {
  id: string;
  nombre: string;
  estado: "disponible" | "reservado" | "prestado";
  persona?: string;
  devolucion?: string;
}

export const COLECCION_PRESTAMOS = "prestamos_prestamos";
export const COLECCION_ACTIVOS = "prestamos_activos";

/** Todos los equipos con su estado; persona y devolución solo si están reservados o prestados. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<EquipoConEstado[]> {
  const equipos = await listarEquipos(almacen);
  return Promise.all(
    equipos.map(async ({ id, nombre }): Promise<EquipoConEstado> => {
      const activo = await almacen.obtener<Activo>(COLECCION_ACTIVOS, id);
      const prestamo = activo && (await almacen.obtener<Prestamo>(COLECCION_PRESTAMOS, activo.prestamo));
      if (!prestamo || prestamo.estado === "devuelto") return { id, nombre, estado: "disponible" };
      return { id, nombre, estado: prestamo.estado, persona: prestamo.persona, devolucion: prestamo.devolucion };
    }),
  );
}
