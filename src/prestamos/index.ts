// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { correoDeSesion } from "../cuentas/index.js";
import { listarEquiposConEstado } from "./prestamos.js";

export { listarEquiposConEstado, type EquipoConEstado } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (request, reply) => {
    if (correoDeSesion(request) === null) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return listarEquiposConEstado(almacen);
  });
  return Promise.resolve();
};
