// Interfaz pública del contexto «cuentas»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import "../../lib/auth.js";
import { esCuentaDeIt, sesionDe } from "./cuentas.js";

export { esCuentaDeIt, normalizarCorreo, type Sesion } from "./cuentas.js";

/** Correo de la persona de la sesión, o null si la petición no la tiene. */
export function correoDeSesion(request: FastifyRequest): string | null {
  return request.persona?.email ?? null;
}

/** ¿Es la persona de la sesión una cuenta de IT? */
export function sesionEsIt(request: FastifyRequest): boolean {
  const correo = correoDeSesion(request);
  return correo !== null && esCuentaDeIt(correo);
}

/**
 * Para las operaciones «Solo IT»: devuelve true si la persona es una cuenta de IT.
 * Si no lo es, responde 403 y devuelve false: quien llama no debe cambiar nada.
 */
export function exigirIt(request: FastifyRequest, reply: FastifyReply): boolean {
  if (sesionEsIt(request)) return true;
  void reply.code(403).send({ error: "Solo IT puede hacer esto." });
  return false;
}

/** Rutas del contrato spec/contextos/cuentas/api.openapi.json. */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/cuentas/yo", (request, reply) => {
    const correo = correoDeSesion(request);
    if (!correo) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return sesionDe(correo);
  });
  return Promise.resolve();
};
