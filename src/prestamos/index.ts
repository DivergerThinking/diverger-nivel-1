// Interfaz pública del contexto «prestamos» (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarEquiposConEstado } from "./estados.js";

/**
 * Rutas del contrato spec/contextos/prestamos/api.openapi.json.
 * La sesión (401) la exige el servidor común a todas las rutas de /api (app/server.ts).
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async () => listarEquiposConEstado(almacen));
  return Promise.resolve();
};
