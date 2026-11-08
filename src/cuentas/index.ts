// Interfaz pública del contexto «cuentas»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import { obtenerCuenta } from "./cuentas.js";

export { correosDeIT, esCuentaIT, obtenerCuenta, type Cuenta } from "./cuentas.js";

/** Rutas del contrato spec/contextos/cuentas/api.openapi.json. */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/cuentas/yo", (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return obtenerCuenta(request.persona);
  });
  return Promise.resolve();
};
