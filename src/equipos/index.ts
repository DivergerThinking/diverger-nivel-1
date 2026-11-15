// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { SOLO_IT, esCuentaDeIT } from "./cuentas.js";
import { ErrorDeEquipos, crearEquipo } from "./equipos.js";

export { esCuentaDeIT, SOLO_IT } from "./cuentas.js";
export { obtenerEquipo, listarEquipos, type EquipoCreado } from "./equipos.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", async (request, reply) => {
    if (!esCuentaDeIT(request.persona?.email ?? "")) return reply.code(403).send({ error: SOLO_IT });
    const cuerpo = request.body as { nombre?: unknown } | null;
    const resultado = await crearEquipo(almacen, cuerpo?.nombre).catch((error: unknown) => {
      if (error instanceof ErrorDeEquipos) return error;
      throw error;
    });
    if (resultado instanceof ErrorDeEquipos) return reply.code(resultado.codigo).send({ error: resultado.message });
    return reply.code(201).send(resultado);
  });
  return Promise.resolve();
};
