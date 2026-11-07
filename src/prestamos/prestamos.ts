// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** Documento de `prestamos_activos`: su id es el id del equipo (como mucho un préstamo activo por equipo). */
export interface DocumentoPrestamoActivo {
  equipoId: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado";
}

// Lo único que se lee del catálogo del contexto «equipos»: el id y el nombre de cada equipo.
interface DocumentoEquipo {
  nombre: string;
}
interface DocumentoNombre {
  equipoId: string;
}

/** El equipo con el estado que le da su préstamo activo; sin préstamo activo, `disponible`. */
export function equipoConEstado(id: string, nombre: string, activo: DocumentoPrestamoActivo | undefined): Equipo {
  if (activo === undefined) return { id, nombre, estado: "disponible" };
  return { id, nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
}

/** Los equipos del catálogo con su estado, ordenados por nombre. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const nombres = await almacen.listar<DocumentoNombre>("equipos_nombres");
  const activos = new Map(
    (await almacen.listar<DocumentoPrestamoActivo>("prestamos_activos")).map((activo) => [activo.equipoId, activo]),
  );
  const equipos: Equipo[] = [];
  for (const { equipoId } of nombres) {
    const documento = await almacen.obtener<DocumentoEquipo>("equipos", equipoId);
    if (documento === undefined) continue;
    equipos.push(equipoConEstado(equipoId, documento.nombre, activos.get(equipoId)));
  }
  return equipos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
