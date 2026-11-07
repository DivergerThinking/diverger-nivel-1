// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { components } from "./api.gen.js";

export type Sesion = components["schemas"]["Sesion"];

/** Correos de la lista de IT (CORREOS_IT, separados por comas), en minúsculas y sin vacíos. */
export function listaIT(valor: string | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .filter((correo) => correo !== "");
}

/** Si el correo está en la lista de IT, sin distinguir mayúsculas. */
export function esCuentaIT(correo: string, lista: readonly string[]): boolean {
  return lista.includes(correo.trim().toLowerCase());
}

export function sesionDe(correo: string, lista: readonly string[]): Sesion {
  return { persona: correo, esIT: esCuentaIT(correo, lista) };
}
