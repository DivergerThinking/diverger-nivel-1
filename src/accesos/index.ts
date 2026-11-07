// Interfaz pública del contexto «accesos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import "../../lib/auth.js";
import { esCuentaIT, listaIT, sesionDe } from "./sesion.js";

export { esCuentaIT, listaIT, sesionDe, type Sesion } from "./sesion.js";

/** Lista de IT leída de CORREOS_IT en el momento de la petición. */
const listaActual = (): string[] => listaIT(process.env["CORREOS_IT"]);

/** Si la persona de la sesión de la petición es una cuenta de IT. */
export function esIT(request: FastifyRequest): boolean {
  return request.persona !== null && esCuentaIT(request.persona.email, listaActual());
}

/** Hook (preHandler) de las operaciones «Solo IT»: responde 403 a cualquier cuenta que no sea de IT. */
export async function exigirIT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (esIT(request)) return;
  await reply.code(403).send({ error: "Solo IT puede hacer esto." });
}

/** Rutas del contrato spec/contextos/accesos/api.openapi.json. */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/accesos/sesion", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return sesionDe(request.persona.email, listaActual());
  });
  return Promise.resolve();
};
