// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import { listEquipment } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Préstamo activo (agregado): uno por equipo como mucho, con id el del equipo. */
export interface PrestamoActivo {
  equipoId: string;
  estado: "reservado" | "prestado";
  persona: string;
  devolucion: string;
  prestamoId: string;
}

export const ACTIVOS = "prestamos_activos";

/** Lista los equipos con su estado: sin préstamo activo está disponible, y sin persona ni devolución. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const [equipos, activos] = await Promise.all([listEquipment(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const porEquipo = new Map(activos.map((activo) => [activo.equipoId, activo]));
  return equipos.map(({ id, nombre }): Equipo => {
    const activo = porEquipo.get(id);
    if (activo === undefined) return { id, nombre, estado: "disponible" };
    return { id, nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
