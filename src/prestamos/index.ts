// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarEquiposConEstado } from "./prestamos.js";

export { listarEquiposConEstado, type Equipo } from "./prestamos.js";

/**
 * Rutas del contrato spec/contextos/prestamos/api.openapi.json. La sesión con Google la exige el servidor
 * en todas las rutas de /api (401 «Inicia sesión con Google.»); las demás historias añaden aquí sus rutas.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", () => listarEquiposConEstado(almacen));
  return Promise.resolve();
};
