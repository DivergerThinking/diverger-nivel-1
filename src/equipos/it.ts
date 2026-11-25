// Cuentas de IT: los correos de CORREOS_IT, separados por comas y comparados sin distinguir mayúsculas.
import type { FastifyReply, FastifyRequest } from "fastify";
import "../../lib/auth.js";

/** Correos de la lista, sin espacios y en minúsculas. */
function correosDeIT(lista: string): Set<string> {
  return new Set(
    lista
      .split(",")
      .map((correo) => correo.trim().toLowerCase())
      .filter((correo) => correo !== ""),
  );
}

/** Si el correo está en la lista de cuentas de IT; por defecto, la de CORREOS_IT, que se lee en cada llamada. */
export function esCuentaIT(email: string, lista: string = process.env.CORREOS_IT ?? ""): boolean {
  return correosDeIT(lista).has(email.trim().toLowerCase());
}

/** Gancho `preHandler` de las operaciones «Solo IT»: con otra cuenta, 403 «Solo IT puede hacer esto.». */
export async function exigirIT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.persona && esCuentaIT(request.persona.email)) return;
  await reply.code(403).send({ error: "Solo IT puede hacer esto." });
}
