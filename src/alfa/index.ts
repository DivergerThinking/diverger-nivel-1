// Interfaz pública del contexto «alfa»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import { saludarDesdeAlfa } from "./saludo.js";

export { saludarDesdeAlfa, type Saludo } from "./saludo.js";

/**
 * Rutas del contrato spec/contextos/alfa/api.openapi.json. La sesión con Google la exige el servidor
 * en todas las rutas de /api (401 «Inicia sesión con Google.»).
 */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/alfa/saludo", (request, respuesta) => {
    if (!request.persona) return respuesta.code(401).send({ error: "Inicia sesión con Google." });
    return saludarDesdeAlfa(request.persona.email);
  });
  return Promise.resolve();
};
