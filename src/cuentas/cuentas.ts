// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { components } from "./api.gen.js";

export type Sesion = components["schemas"]["Sesion"];

/** Dos correos son el mismo aunque cambien las mayúsculas. */
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

/** ¿Está el correo en la lista `CORREOS_IT` (correos separados por comas)? */
export function esCuentaDeIt(correo: string, correosIt: string | undefined = process.env.CORREOS_IT): boolean {
  const buscado = normalizarCorreo(correo);
  if (!buscado) return false;
  return (correosIt ?? "")
    .split(",")
    .map(normalizarCorreo)
    .some((correoIt) => correoIt === buscado);
}

export function sesionDe(correo: string, correosIt?: string): Sesion {
  return { email: correo, esIt: esCuentaDeIt(correo, correosIt) };
}
