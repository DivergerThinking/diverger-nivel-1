// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

export const COLECCION_ACTIVOS = "prestamos_activos";

/** Préstamo activo de un equipo: la reserva o el préstamo en curso (el documento tiene por id el del equipo). */
interface DocumentoActivo {
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
  prestamoId: string;
}

/** Todos los equipos con su estado; con persona y devolución solo si están reservados o prestados. */
export async function listarEquiposConEstado(almacen: Almacen): Promise<Equipo[]> {
  const equipos = await listarEquipos(almacen);
  return Promise.all(
    equipos.map(async ({ id, nombre }): Promise<Equipo> => {
      const activo = await almacen.obtener<DocumentoActivo>(COLECCION_ACTIVOS, id);
      if (!activo) return { id, nombre, estado: "disponible" };
      return { id, nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
    }),
  );
}
