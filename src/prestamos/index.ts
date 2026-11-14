// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { soloIT } from "../equipos/index.js";
import type { components } from "./api.gen.js";
import { consultarHistorial, listarEquiposConEstado, NO_EXISTE_EQUIPO } from "./prestamos.js";

export { consultarHistorial, listarEquiposConEstado, type EntradaHistorial, type EquipoConEstado } from "./prestamos.js";

type Equipo = components["schemas"]["Equipo"];
type EntradaDelContrato = components["schemas"]["EntradaHistorial"];
type Error = components["schemas"]["Error"];

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (_request, reply) => {
    const equipos: Equipo[] = await listarEquiposConEstado(almacen);
    return reply.code(200).send(equipos);
  });
  app.get<{ Params: { id: string } }>("/api/equipos/:id/historial", { preHandler: soloIT }, async (request, reply) => {
    const historial: EntradaDelContrato[] | undefined = await consultarHistorial(almacen, request.params.id);
    if (!historial) {
      const cuerpo: Error = { error: NO_EXISTE_EQUIPO };
      return reply.code(404).send(cuerpo);
    }
    return reply.code(200).send(historial);
  });
  return Promise.resolve();
};
