// Cuentas de IT: los correos de la variable de entorno CORREOS_IT, leída en cada petición.
import type { FastifyReply, FastifyRequest } from "fastify";

export const MENSAJE_SOLO_IT = "Solo IT puede hacer esto.";

/** Correos separados por comas, sin espacios de alrededor y en minúsculas. */
export function correosDeIt(lista: string | undefined = process.env["CORREOS_IT"]): Set<string> {
  return new Set(
    (lista ?? "")
      .split(",")
      .map((correo) => correo.trim().toLowerCase())
      .filter((correo) => correo !== ""),
  );
}

/** Si el correo es de una cuenta de IT; sin CORREOS_IT, ninguna lo es. */
export function esCuentaIt(email: string, lista?: string): boolean {
  return correosDeIt(lista).has(email.trim().toLowerCase());
}

/** preHandler de las rutas «Solo IT»: responde 403 si la sesión no es de una cuenta de IT. */
export async function exigirIt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.persona && esCuentaIt(request.persona.email)) return;
  await reply.code(403).send({ error: MENSAJE_SOLO_IT });
}
