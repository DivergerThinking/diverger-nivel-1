// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
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
