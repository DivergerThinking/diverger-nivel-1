// Interfaz pública del contexto «gamma»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import { saludar } from "./saludo.js";

export { saludar, type Saludo } from "./saludo.js";

/** Rutas del contrato spec/contextos/gamma/api.openapi.json. */
export const rutas: FastifyPluginAsync = (app) => {
  app.get("/api/gamma/saludo", (request) => saludar(request.persona?.email ?? ""));
  return Promise.resolve();
};
