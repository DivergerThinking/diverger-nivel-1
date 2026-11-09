// Lógica interna del contexto: los demás contextos no pueden importar este fichero.
import type { components } from "./api.gen.js";

export type Cuenta = components["schemas"]["Cuenta"];

export const ERROR_SOLO_IT = "Solo IT puede hacer esto.";

/** Una cuenta es de IT si su correo está en la lista separada por comas, sin distinguir mayúsculas ni espacios. */
export function esCuentaIT(correo: string, listaCorreosIT: string | undefined): boolean {
  const buscado = correo.trim().toLowerCase();
  if (!buscado) return false;
  return (listaCorreosIT ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .some((c) => c === buscado);
}

/** La cuenta de la sesión: el correo verificado del token y si es de IT. */
export function cuentaDe(correo: string, listaCorreosIT: string | undefined): Cuenta {
  return { correo, esIT: esCuentaIT(correo, listaCorreosIT) };
}
