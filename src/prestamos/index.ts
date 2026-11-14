// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { listarEquiposConEstado } from "./prestamos.js";

export { listarEquiposConEstado, type EquipoConEstado } from "./prestamos.js";

type Equipo = components["schemas"]["Equipo"];

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (_request, reply) => {
    const equipos: Equipo[] = await listarEquiposConEstado(almacen);
    return reply.code(200).send(equipos);
  });
  return Promise.resolve();
};
