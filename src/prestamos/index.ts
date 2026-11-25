// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarConEstado } from "./estado.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json; la sesión (401) la exige el servidor. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", () => listarConEstado(almacen));
  return Promise.resolve();
};
