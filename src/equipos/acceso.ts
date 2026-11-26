// Control de acceso común: quién es una cuenta de IT. La lista sale de CORREOS_IT, separada por comas, y se compara
// sin distinguir mayúsculas. Se lee en cada petición para que dependa de la configuración del despliegue, no del código.
import type { preHandlerAsyncHookHandler } from "fastify";
import "../../lib/auth.js";

export const SOLO_IT = "Solo IT puede hacer esto.";

function correosDeIT(entorno: NodeJS.ProcessEnv): Set<string> {
  const correos = (entorno["CORREOS_IT"] ?? "").split(",").map((correo) => correo.trim().toLowerCase());
  return new Set(correos.filter((correo) => correo !== ""));
}

/** Si el correo es de una cuenta de IT según CORREOS_IT. */
export function esCuentaDeIT(correo: string | undefined, entorno: NodeJS.ProcessEnv = process.env): boolean {
  if (!correo) return false;
  return correosDeIT(entorno).has(correo.trim().toLowerCase());
}

/** Hook previo de las rutas «Solo IT»: responde 403 a cualquier otra cuenta. */
export const exigirIT: preHandlerAsyncHookHandler = async (request, reply) => {
  if (!esCuentaDeIT(request.persona?.email)) {
    await reply.code(403).send({ error: SOLO_IT });
  }
};
