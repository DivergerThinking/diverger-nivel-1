// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import { randomUUID } from "node:crypto";
import type { Almacen } from "../../lib/datos.js";
import type { components } from "./api.gen.js";

export type EquipoCreado = components["schemas"]["EquipoCreado"];

interface DocumentoEquipo {
  nombre: string;
  nombreNormalizado: string;
}

interface DocumentoNombre {
  equipoId: string;
}

export type ResultadoAlta = { ok: true; equipo: EquipoCreado } | { ok: false; error: "sin-nombre" | "repetido" };

/** Nombre normalizado: sin espacios al principio ni al final y en minúsculas. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/** Da de alta un equipo; el nombre normalizado es único, también con altas simultáneas (ADR 0003). */
export async function darDeAlta(almacen: Almacen, nombre: unknown): Promise<ResultadoAlta> {
  if (typeof nombre !== "string") return { ok: false, error: "sin-nombre" };
  const nombreNormalizado = normalizarNombre(nombre);
  if (nombreNormalizado === "") return { ok: false, error: "sin-nombre" };

  const id = randomUUID();
  // El id del documento de nombres es el nombre normalizado; se codifica para que no rompa la ruta del documento.
  const idNombre = encodeURIComponent(nombreNormalizado);
  const nombreRecortado = nombre.trim();

  return almacen.transaccion<ResultadoAlta>(async (tx) => {
    if ((await tx.obtener<DocumentoNombre>("equipos_nombres", idNombre)) !== undefined) {
      return { ok: false, error: "repetido" };
    }
    const equipo: DocumentoEquipo = { nombre: nombreRecortado, nombreNormalizado };
    tx.guardar("equipos", id, equipo);
    tx.guardar("equipos_nombres", idNombre, { equipoId: id } satisfies DocumentoNombre);
    return { ok: true, equipo: { id, nombre: nombreRecortado, estado: "disponible" } };
  });
}
