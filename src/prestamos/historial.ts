// Historial de un equipo: todos sus préstamos, del más reciente al más antiguo.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import { COLECCION_PRESTAMOS, MENSAJE_NO_EXISTE, type PrestamoGuardado } from "./solicitud.js";

export interface PrestamoHistorial {
  persona: string;
  devolucion: string;
  estado: PrestamoGuardado["estado"];
}

export type ResultadoHistorial =
  | { ok: true; historial: PrestamoHistorial[] }
  | { ok: false; codigo: 404; error: string };

export async function obtenerHistorial(almacen: Almacen, equipoId: string): Promise<ResultadoHistorial> {
  const equipo = (await listarEquipos(almacen)).find((e) => e.id === equipoId);
  if (equipo === undefined) return { ok: false, codigo: 404, error: MENSAJE_NO_EXISTE };

  const prestamos = (await almacen.listar<PrestamoGuardado>(COLECCION_PRESTAMOS)).filter((p) => p.equipoId === equipo.id);
  const historial = prestamos
    .sort((a, b) => b.inicio.localeCompare(a.inicio))
    .map(({ persona, devolucion, estado }): PrestamoHistorial => ({ persona, devolucion, estado }));
  return { ok: true, historial };
}
