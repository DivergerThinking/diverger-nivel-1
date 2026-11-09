// Interfaz pública del contexto «cuentas»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import "../../lib/auth.js";
import { cuentaDe, ERROR_SOLO_IT, type Cuenta } from "./cuenta.js";

export { cuentaDe, esCuentaIT, type Cuenta } from "./cuenta.js";

/** Cuenta de la sesión de la petición, con CORREOS_IT leído de la configuración del despliegue. */
export function cuentaDeLaPeticion(request: FastifyRequest): Cuenta | null {
  return request.persona ? cuentaDe(request.persona.email, process.env.CORREOS_IT) : null;
}

/**
 * Guarda de las operaciones «Solo IT»: úsala como preHandler. Si la cuenta no es de IT
 * responde 403 y la operación no llega a ejecutarse.
 */
export async function exigirIT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!cuentaDeLaPeticion(request)?.esIT) {
    await reply.code(403).send({ error: ERROR_SOLO_IT });
  }
}

/** Rutas del contrato spec/contextos/cuentas/api.openapi.json. */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/cuentas/yo", async (request, reply) => {
    const cuenta = cuentaDeLaPeticion(request);
    if (!cuenta) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return cuenta;
  });
  return Promise.resolve();
};
