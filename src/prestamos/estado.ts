// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { listarEquipos } from "../equipos/index.js";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoConEstado = components["schemas"]["Equipo"];

/** El estado de un equipo tal como se guarda en la colección `estadosEquipo`. */
export interface EstadoEquipo {
  estado: EquipoConEstado["estado"];
  persona?: string;
  devolucion?: string;
}

const ESTADOS = "estadosEquipo";

/** Todos los equipos con su estado; un equipo sin documento de estado está disponible. */
export async function listarConEstado(almacen: Almacen): Promise<EquipoConEstado[]> {
  const equipos = await listarEquipos(almacen);
  return Promise.all(
    equipos.map(async ({ id, nombre }): Promise<EquipoConEstado> => {
      const guardado = await almacen.obtener<EstadoEquipo>(ESTADOS, id);
      if (!guardado || guardado.estado === "disponible") return { id, nombre, estado: "disponible" };
      return {
        id,
        nombre,
        estado: guardado.estado,
        ...(guardado.persona !== undefined ? { persona: guardado.persona } : {}),
        ...(guardado.devolucion !== undefined ? { devolucion: guardado.devolucion } : {}),
      };
    }),
  );
}
