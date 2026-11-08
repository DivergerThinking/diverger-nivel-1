import type { Persona } from "../../lib/auth.js";

export interface Cuenta {
  email: string;
  esIT: boolean;
}

/** Correos de IT de una lista separada por comas: sin espacios de alrededor, en minúsculas y sin vacíos. */
export function correosDeIT(lista: string | undefined): Set<string> {
  const correos = (lista ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .filter((correo) => correo !== "");
  return new Set(correos);
}

/** Si el correo está en la lista, sin distinguir mayúsculas ni espacios de alrededor. */
export function esCuentaIT(email: string, lista: string | undefined = process.env["CORREOS_IT"]): boolean {
  return correosDeIT(lista).has(email.trim().toLowerCase());
}

/** La cuenta de la persona que ha iniciado sesión. */
export function obtenerCuenta(persona: Persona, lista: string | undefined = process.env["CORREOS_IT"]): Cuenta {
  return { email: persona.email, esIT: esCuentaIT(persona.email, lista) };
}
