// Cuentas de IT: las de la variable de entorno CORREOS_IT (correos separados por comas), nunca del código.
import type { FastifyReply, FastifyRequest } from "fastify";
import "../../lib/auth.js";
import type { components } from "./api.gen.js";

type Error = components["schemas"]["Error"];

export const SOLO_IT = "Solo IT puede hacer esto.";

const normalizar = (correo: string): string => correo.trim().toLowerCase();

/** Cuentas de IT de la lista de correos separados por comas, sin espacios ni mayúsculas. */
export function cuentasDeIT(lista: string | undefined = process.env["CORREOS_IT"]): string[] {
  return (lista ?? "").split(",").map(normalizar).filter((correo) => correo !== "");
}

/** Si el correo es de una cuenta de IT, sin distinguir mayúsculas. */
export function esCuentaDeIT(correo: string, lista?: string): boolean {
  const buscado = normalizar(correo);
  return buscado !== "" && cuentasDeIT(lista).includes(buscado);
}

/**
 * Comprobación previa («preHandler») de las operaciones «Solo IT»: deja pasar a las cuentas de IT y
 * responde 403 «Solo IT puede hacer esto.» a las demás, antes de que la operación haga nada.
 */
export async function soloIT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.persona && esCuentaDeIT(request.persona.email)) return;
  const cuerpo: Error = { error: SOLO_IT };
  await reply.code(403).send(cuerpo);
}
