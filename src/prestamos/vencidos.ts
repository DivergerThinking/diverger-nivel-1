// Préstamos vencidos: equipos prestados cuya devolución es anterior a hoy en Madrid, del más antiguo al más reciente.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos } from "../equipos/index.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
import { hoyEnMadrid } from "./solicitud.js";

export interface Vencido {
  id: string;
  nombre: string;
  persona: string;
  devolucion: string;
}

export async function listarVencidos(almacen: Almacen, ahora: Date): Promise<Vencido[]> {
  const hoy = hoyEnMadrid(ahora);
  const equipos = await listarEquipos(almacen);
  const estados = await Promise.all(
    equipos.map((equipo) => almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, equipo.id)),
  );
  const vencidos: Vencido[] = [];
  equipos.forEach((equipo, i) => {
    const estado = estados[i];
    if (estado?.estado !== "prestado" || estado.devolucion >= hoy) return;
    vencidos.push({ id: equipo.id, nombre: equipo.nombre, persona: estado.persona, devolucion: estado.devolucion });
  });
  return vencidos.sort((a, b) => a.devolucion.localeCompare(b.devolucion) || a.nombre.localeCompare(b.nombre));
}
