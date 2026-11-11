// Interfaz pública del contexto «beta»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import { saludar } from "./saludo.js";

export { saludar, type Saludo } from "./saludo.js";

/**
 * Rutas del contrato spec/contextos/beta/api.openapi.json. La sesión con Google la exige el servidor
 * en todas las rutas de /api (401 «Inicia sesión con Google.»).
 */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/beta/saludo", (request, respuesta) => {
    if (!request.persona) return respuesta.code(401).send({ error: "Inicia sesión con Google." });
    return saludar(request.persona.email);
  });
  return Promise.resolve();
};
